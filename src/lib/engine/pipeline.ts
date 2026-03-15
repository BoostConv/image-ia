import type {
  RawPipelineInput,
  FilteredContext,
  CreativeBrief,
  ConceptSpec,
  ScoredConcept,
  AdDirectorSpec,
  ArtDirection,
  BuiltPrompt,
  RenderResult,
  PipelineEvent,
  BatchLockConfig,
  GateVerdict,
  ComposedAd,
  DualBatchEvaluation,
  ComposerInput,
  SelectedReference,
} from "./types";
import { filterContext } from "./context-filter";
import { planConcepts } from "./creative-planner";
import { conceptsToBriefs } from "./concept-adapter";
import { inferBrandPolicy, mergeBrandPolicy } from "./brand-style-policy";
import type { BrandStylePolicy } from "./brand-style-policy";
import { analyzeBrandDA, enrichPolicyWithDA, formatDAFingerprintForPrompt } from "./brand-da-analyzer";
import type { BrandDAFingerprint } from "./brand-da-analyzer";
import { adDirectorToArtDirection } from "./art-director";
import { buildPromptBatchV3, buildAdFocusedPromptBatch, adjustPromptAfterGateFailure, deriveDirectionFromConcept } from "./prompt-builder";
import { selectReferencesBatch, selectReferencesBatchV4, loadBrandStyleImages } from "./reference-selector";
import { getLayoutInspirationImage } from "../db/queries/layouts";
import type { LayoutFamily } from "../db/schema";
import { renderBatch } from "./renderer";
import { renderGateBatch } from "./quality-gate";
import { compositionGate } from "./quality-gate";
import { deriveCopyAssetsV3 } from "./composer";
import { polishCopyBatch } from "./copy-editor";
// graphic-engine removed — all concepts go through Gemini
import { getRecentCreativePatterns, getApprovedRejectedExamples } from "../db/queries/creative-memory";
import type { CreativeMemory, FewShotExample } from "../db/queries/creative-memory";
import { getLayoutAnalysis } from "../db/queries/layouts";
import type { LayoutAnalysis } from "../db/schema";
import { formatLayoutAnalysisForPrompt } from "./layout-analyzer";
import fs from "fs";
import path from "path";

// ============================================================
// PIPELINE ORCHESTRATOR v5
//
// A: ContextFilter + BatchLocker (merged) →
// B: ConceptPlanner (simplified — 12 fields) →
// C: Direction (deterministic — no AI call) →
// D: PromptBuilder (ad-focused) →
// E: Renderer (dual-engine: Gemini + graphic) →
// H1: RenderGate + retry loop
//
// Removed in v4:
//   - B2 CreativeCritic (AI scoring of text concepts — low value)
//   - K DualEvaluator (post-render scoring — no corrective action)
//   - H2 CompositionGate (Composer is disabled)
//   - G Composer (text rendered by Gemini directly)
// Removed in v5:
//   - C Art Director Claude call (replaced by deterministic derivation)
//   - 20+ unused ConceptSpec fields from Claude prompt
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data", "images");

export interface PipelineConfig {
  input: RawPipelineInput;
  onEvent: (event: PipelineEvent) => void;
}

export interface PipelineResult {
  context: FilteredContext;
  lock: BatchLockConfig;
  concepts: ConceptSpec[];
  scoredConcepts: ScoredConcept[];
  keptConcepts: ConceptSpec[];
  briefs: CreativeBrief[];
  adDirections: AdDirectorSpec[];
  artDirections: ArtDirection[];
  prompts: BuiltPrompt[];
  renders: RenderResult[];
  renderGateVerdicts: GateVerdict[];
  composedAds: ComposedAd[];
  compositionGateVerdicts: GateVerdict[];
  evaluation: DualBatchEvaluation;
  retriedIndices: number[];
  daFingerprint?: BrandDAFingerprint;
}

export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const { input, onEvent } = config;
  const hasProductImages = !!(input.product?.imagePaths?.length);

  // ─── LAYER A+J: Context Filter + Batch Locker (merged) ─────
  onEvent({ type: "phase", phase: "A", message: "Filtrage du contexte stratégique + verrouillage batch..." });

  const { context, lock } = await filterContext(input);
  onEvent({ type: "context_filtered", context });
  onEvent({ type: "batch_locked", lock });

  // ─── Infer brand policy from context ────────────────────────
  let brandPolicy = inferBrandPolicy(context);
  // Apply DB overrides if configured
  if (input.brand.brandStylePolicy) {
    brandPolicy = mergeBrandPolicy(brandPolicy, input.brand.brandStylePolicy as Partial<BrandStylePolicy>);
    console.log(`[Pipeline] Brand policy: "${brandPolicy.brand_name}" (DB overrides applied, max stretch: ${brandPolicy.max_stretch_per_batch})`);
  } else {
    console.log(`[Pipeline] Brand policy: "${brandPolicy.brand_name}" (inferred, max stretch: ${brandPolicy.max_stretch_per_batch})`);
  }

  // ─── Brand DA Analysis (Vision on brand style images) ──────
  let daFingerprint: BrandDAFingerprint | undefined;

  // Use persisted fingerprint if available (avoid re-analyzing every batch)
  if (input.brand.daFingerprint) {
    daFingerprint = input.brand.daFingerprint as unknown as BrandDAFingerprint;
    brandPolicy = enrichPolicyWithDA(brandPolicy, daFingerprint);
    console.log(`[Pipeline] Brand DA loaded from DB — personality: "${daFingerprint.visual_personality}", confidence: ${daFingerprint.confidence}`);
  } else if (input.brandStyleImagePaths?.length) {
    // Fallback: analyze on the fly if images exist but no persisted fingerprint
    try {
      onEvent({ type: "phase", phase: "A2", message: "Analyse DA marque (Vision)..." });
      const styleImages = loadBrandStyleImages(input.brandStyleImagePaths);
      if (styleImages.length > 0) {
        daFingerprint = await analyzeBrandDA(styleImages, context.brand_name);
        brandPolicy = enrichPolicyWithDA(brandPolicy, daFingerprint);
        console.log(`[Pipeline] Brand DA analyzed live — personality: "${daFingerprint.visual_personality}", confidence: ${daFingerprint.confidence}`);
      }
    } catch (err) {
      console.warn("[Pipeline] Brand DA analysis failed, continuing with inferred policy:", err);
    }
  }

  // ─── P3: Creative Memory (inter-batch diversification) ─────
  let creativeMemory: CreativeMemory | undefined;
  const brandId = input.brand.name;
  try {
    creativeMemory = await getRecentCreativePatterns(brandId);
    if (creativeMemory.totalAds > 0) {
      console.log(`[Pipeline] Creative memory: ${creativeMemory.totalAds} recent ads found for "${brandId}"`);
    }
  } catch {
    console.warn("[Pipeline] Creative memory query failed, continuing without");
  }

  // ─── P4: Few-shot examples (review feedback loop) ─────────
  let fewShotExamples: FewShotExample[] | undefined;
  try {
    fewShotExamples = await getApprovedRejectedExamples(brandId);
    if (fewShotExamples.length > 0) {
      console.log(`[Pipeline] Few-shot: ${fewShotExamples.length} examples (approved/rejected) found for "${brandId}"`);
    }
  } catch {
    console.warn("[Pipeline] Few-shot query failed, continuing without");
  }

  // ─── LAYER B: Concept Planner (v3) ────────────────────────
  onEvent({ type: "phase", phase: "B", message: `Génération de ${input.count} concepts créatifs...` });

  // Pass user-forced layout families if provided
  const forcedLayouts = input.forcedLayoutFamilies?.length
    ? input.forcedLayoutFamilies as import("./taxonomy").LayoutFamily[]
    : undefined;

  // Load layout analyses for all possible layouts (so planner knows what they look like)
  const layoutAnalyses = new Map<string, LayoutAnalysis>();
  try {
    const { LAYOUT_FAMILIES: allLayoutFamilies } = await import("./taxonomy");
    const layoutsToCheck = forcedLayouts || allLayoutFamilies;
    for (const lf of layoutsToCheck) {
      const analysis = await getLayoutAnalysis(lf as import("../db/schema").LayoutFamily, brandId);
      if (analysis) layoutAnalyses.set(lf, analysis);
    }
    if (layoutAnalyses.size > 0) {
      console.log(`[Pipeline] Layout analyses loaded: ${layoutAnalyses.size} layouts with Vision data`);
    }
  } catch {
    console.warn("[Pipeline] Layout analysis loading failed, continuing without");
  }

  const planResult = await planConcepts(context, input.count, brandPolicy, lock, hasProductImages, creativeMemory, daFingerprint, forcedLayouts, fewShotExamples, layoutAnalyses, input.creativityLevel);
  const allConcepts = planResult.concepts;
  const keptConcepts = allConcepts;
  onEvent({ type: "concepts_generated", concepts: allConcepts });

  // Store Claude prompts for debugging — will be emitted with Gemini prompts later
  const claudeSystemPrompt = planResult.claudeSystemPrompt;
  const claudeUserPrompt = planResult.claudeUserPrompt;

  // Compat: empty scored concepts (critic removed)
  const scoredConcepts: ScoredConcept[] = allConcepts.map((concept, i) => ({
    concept,
    scores: {
      stop_scroll: 5, message_clarity: 5, ad_likeness: 5, proof_strength: 5,
      visual_hierarchy: 5, thumb_readability: 5, product_visibility: 5,
      brand_fit: 5, novelty: 5, renderability: 5, confusion_risk: 3,
      composite_score: 5, pass: true,
    },
    rank: i + 1,
  }));

  onEvent({ type: "concepts_scored", scored: scoredConcepts, kept: keptConcepts.length, rejected: 0 });
  console.log(`[Pipeline] Generated ${keptConcepts.length} concepts (direct, no filtering)`);

  // ─── ADAPTER: ConceptSpec → CreativeBrief ──────────────────
  const briefs = conceptsToBriefs(keptConcepts);
  onEvent({ type: "briefs_generated", briefs });

  // ─── LAYER C: Direction (deterministic — no AI call) ────────
  onEvent({ type: "phase", phase: "C", message: "Direction artistique (dérivation automatique)..." });

  const adDirections = keptConcepts.map((concept) =>
    deriveDirectionFromConcept(concept, context, hasProductImages)
  );
  const artDirections = adDirections.map(adDirectorToArtDirection);

  adDirections.forEach((dir, i) => {
    onEvent({ type: "ad_direction", index: i, direction: dir });
  });

  // ─── LAYER D+E: Prompt Build + Render (DUAL ENGINE) ─────────
  onEvent({ type: "phase", phase: "D", message: "Construction des prompts et routage moteur..." });

  const allCopyAssets = keptConcepts.map((concept) => ({
    copyAssets: deriveCopyAssetsV3(concept, context),
    brandName: context.brand_name,
  }));

  // All concepts go through Gemini (graphic engine removed)
  const geminiIndices = keptConcepts.map((_, i) => i);

  // ─── ENGINE: Gemini AI (scene generation) ──────────────────
  const geminiRenders: Map<number, RenderResult> = new Map();

  if (geminiIndices.length > 0) {
    onEvent({ type: "phase", phase: "E", message: `Moteur IA Gemini (${geminiIndices.length} concepts)...` });

    const geminiConcepts = geminiIndices.map((i) => keptConcepts[i]);
    const geminiAdDirs = geminiIndices.map((i) => adDirections[i]);
    const geminiArtDirs = geminiIndices.map((i) => artDirections[i]);
    const geminiBriefs = geminiIndices.map((i) => briefs[i]);

    // Load layout inspirations and brand style
    const layoutFamilies = geminiConcepts.map((c) => c.layout_family as LayoutFamily);

    const layoutInspirations: (Buffer | undefined)[] = [];
    for (const layoutFamily of layoutFamilies) {
      try {
        const layoutBuffer = await getLayoutInspirationImage(layoutFamily, brandId);
        layoutInspirations.push(layoutBuffer || undefined);
      } catch {
        layoutInspirations.push(undefined);
      }
    }

    const brandStyleImages = input.brandStyleImagePaths?.length
      ? loadBrandStyleImages(input.brandStyleImagePaths)
      : undefined;

    // Select references
    console.log(`[Pipeline] Product imagePaths: ${JSON.stringify(input.product?.imagePaths?.slice(0, 3))}`);
    console.log(`[Pipeline] hasProductImages: ${hasProductImages}, additionalRefs: ${input.additionalReferenceImages?.length || 0}`);

    const geminiRefs = await selectReferencesBatchV4(
      geminiArtDirs.map((dir, i) => ({
        direction: dir,
        productImagePaths: input.product?.imagePaths,
        additionalImages: input.additionalReferenceImages,
        layoutFamily: layoutFamilies[i],
        brandId,
        brandStyleImagePaths: input.brandStyleImagePaths,
      }))
    );

    geminiRefs.forEach((refs, i) => {
      const roles = refs.map(r => `${r.role}(${r.buffer ? r.buffer.length : 'no-buf'})`);
      console.log(`[Pipeline] Concept ${i + 1} refs: [${roles.join(', ')}]`);
    });

    // Build prompts (ad-focused with copy assets for Gemini text rendering)
    const geminiCopyAssets = geminiIndices.map((i) => allCopyAssets[i]?.copyAssets);
    const geminiPrompts = buildAdFocusedPromptBatch({
      concepts: geminiConcepts,
      directions: geminiAdDirs,
      context,
      referencesByIndex: geminiRefs,
      aspectRatio: input.aspectRatio,
      layoutFamilies,
      layoutInspirations,
      brandStyleImages,
      copyAssetsByIndex: geminiCopyAssets,
      layoutAnalyses,
      creativityLevel: input.creativityLevel,
      promptMode: input.promptMode,
    });

    geminiPrompts.forEach((p, gi) => {
      onEvent({ type: "prompt_built", index: geminiIndices[gi], prompt_preview: p.prompt_for_model.slice(0, 200) });
    });

    // Emit full prompts detail (Claude + Gemini) for UI debugging
    onEvent({
      type: "prompts_detail",
      claude_system: claudeSystemPrompt,
      claude_user: claudeUserPrompt,
      gemini: geminiPrompts.map((p, gi) => ({
        index: geminiIndices[gi],
        system_instruction: p.system_instruction || "",
        user_prompt: p.prompt_for_model,
        edit_prompt: p.edit_prompt_round_2,
      })),
    });

    // Render
    const rawGeminiRenders = await renderBatch(
      geminiPrompts,
      geminiBriefs,
      (gi, success) => onEvent({ type: "render_pass_1", index: geminiIndices[gi], success }),
      (gi, success) => onEvent({ type: "render_pass_2", index: geminiIndices[gi], success })
    );

    rawGeminiRenders.forEach((r, gi) => {
      r.concept_index = geminiIndices[gi];
      r.art_direction = geminiArtDirs[gi];
      geminiRenders.set(geminiIndices[gi], r);
    });

    const renderErrors = (rawGeminiRenders as any).__renderErrors as { index: number; error: string }[] | undefined;
    if (renderErrors?.length) {
      renderErrors.forEach((re) => {
        onEvent({ type: "error", index: re.index, error: `Render échoué: ${re.error}` });
      });
    }

    if (rawGeminiRenders.length === 0) {
      const errorDetail = renderErrors?.map((e) => e.error).join("; ") || "Erreur inconnue";
      console.error(`[Pipeline] ALL Gemini renders failed: ${errorDetail}`);
    }
  }

  // ─── Collect renders ────────────────────────────────────────
  const renders: RenderResult[] = [];
  const prompts: BuiltPrompt[] = [];

  for (let i = 0; i < keptConcepts.length; i++) {
    const render = geminiRenders.get(i);
    if (render) {
      renders.push(render);
      prompts.push({
        prompt_for_model: render.base_image.prompt_used,
        edit_prompt_round_2: "",
        selected_reference_images: [],
        image_generation_config: { aspect_ratio: input.aspectRatio, quality: "high" },
      });
    }
  }

  // ─── LAYER H1: Render Gate ─────────────────────────────────
  onEvent({ type: "phase", phase: "H1", message: "Contrôle qualité des rendus..." });

  const renderGateVerdicts = await renderGateBatch(renders);

  renderGateVerdicts.forEach((verdict, i) => {
    onEvent({ type: "render_gate", index: i, verdict });

    if (verdict.action === "fallback_to_pass1" && renders[i].edited_image) {
      renders[i].final_image = renders[i].base_image.buffer;
      renders[i].final_mime_type = renders[i].base_image.mime_type;
      console.log(`[Pipeline] Concept ${i + 1}: falling back to pass 1`);
    }
  });

  // ─── P1: FEEDBACK LOOP — Retry rejected/high-risk renders ───
  const retriedIndices: number[] = [];
  const maxRetries = Math.ceil(input.count / 2);
  let retryCount = 0;

  for (let i = 0; i < renders.length && retryCount < maxRetries; i++) {
    const verdict = renderGateVerdicts[i];
    if (verdict.action !== "reject" && verdict.action !== "mark_high_risk") continue;

    retryCount++;
    onEvent({ type: "phase", phase: "H1-retry", message: `Retry render ${i + 1} (${verdict.action})...` });
    console.log(`[Pipeline] Retrying render ${i + 1} — verdict was "${verdict.action}"`);

    try {
      const originalPrompt = prompts[i];
      const adjustedPrompt = adjustPromptAfterGateFailure(originalPrompt, verdict);

      const retryRenders = await renderBatch(
        [adjustedPrompt],
        [briefs[i]],
        (_gi, success) => onEvent({ type: "render_pass_1", index: i, success }),
        (_gi, success) => onEvent({ type: "render_pass_2", index: i, success })
      );

      if (retryRenders.length > 0) {
        const retryRender = retryRenders[0];
        retryRender.concept_index = renders[i].concept_index;
        retryRender.art_direction = renders[i].art_direction;

        const retryVerdict = await renderGateBatch([retryRender]);
        const newVerdict = retryVerdict[0];
        onEvent({ type: "render_gate", index: i, verdict: newVerdict });

        if (newVerdict.action === "accept" ||
            (newVerdict.action === "mark_high_risk" && verdict.action === "reject")) {
          renders[i] = retryRender;
          renderGateVerdicts[i] = newVerdict;
          prompts[i] = adjustedPrompt;
          retriedIndices.push(i);
          console.log(`[Pipeline] Retry ${i + 1} succeeded — new verdict: "${newVerdict.action}"`);
        } else {
          console.log(`[Pipeline] Retry ${i + 1} did not improve — keeping original`);
        }
      }
    } catch (err) {
      console.error(`[Pipeline] Retry failed for concept ${i + 1}:`, err);
    }
  }

  if (retriedIndices.length > 0) {
    console.log(`[Pipeline] Retried ${retriedIndices.length} renders: indices [${retriedIndices.join(", ")}]`);
  }

  // ─── Build composed ads (pass-through, Gemini renders text) ──
  const composedAds: ComposedAd[] = [];
  const compositionGateVerdicts: GateVerdict[] = [];

  for (let i = 0; i < renders.length; i++) {
    const concept = keptConcepts[i];
    const copyAssets = allCopyAssets[i]?.copyAssets || deriveCopyAssetsV3(concept, context);
    composedAds.push({
      buffer: renders[i].final_image,
      mimeType: renders[i].final_mime_type,
      layoutUsed: concept.layout_family,
      zonesUsed: [],
      collisions: [],
      fallbacksApplied: [],
      copyAssets,
    });
    compositionGateVerdicts.push({
      action: "accept",
      reasons: ["Pass-through — text rendered by Gemini"],
      scores: {},
      confidence: 1,
    });
  }

  // ─── Build empty evaluation (K removed) ─────────────────────
  const evaluation: DualBatchEvaluation = {
    individual: renders.map(() => ({
      base: {
        craft: { realism: 0, product_fidelity: 0, composition_quality: 0, lighting_quality: 0, premium_visual_feel: 0, material_coherence: 0, overall_craft: 0 },
        ad_performance: { stop_scroll_power: 0, instant_clarity: 0, visible_promise: 0, visible_proof: 0, meta_native_feel: 0, visual_distinctiveness: 0, text_overlay_readiness: 0, likelihood_to_win_in_feed: 0, overall_ad: 0 },
        combined_score: 0,
        strengths: [],
        weaknesses: [],
      },
      composed: {
        stop_scroll_power: 0, message_clarity: 0, mobile_readability: 0, visual_cohesion: 0,
        text_legibility: 0, hierarchy_effectiveness: 0, cta_visibility: 0, brand_consistency: 0,
        overall_composed: 0, improvement_notes: [],
      },
      final_score: 0,
    })),
    pairwise: {
      best_for_scroll_stop: 0,
      best_for_product_showcase: 0,
      best_for_promise_communication: 0,
      best_for_premium_feel: 0,
      best_overall_for_meta_feed: 0,
      ranking_rationale: "Évaluation désactivée — pipeline v4",
    },
  };

  return {
    context,
    lock,
    concepts: allConcepts,
    scoredConcepts,
    keptConcepts,
    briefs,
    adDirections,
    artDirections,
    prompts,
    renders,
    renderGateVerdicts,
    composedAds,
    compositionGateVerdicts,
    evaluation,
    retriedIndices,
    daFingerprint,
  };
}

// ─── HELPERS ─────────────────────────────────────────────────

function loadFirstProductImage(productImagePaths?: string[]): Buffer | null {
  if (!productImagePaths?.length) return null;

  for (const imgPath of productImagePaths) {
    try {
      const fullPath = path.isAbsolute(imgPath)
        ? imgPath
        : path.join(DATA_DIR, imgPath);

      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
    } catch {
      console.warn(`[Pipeline] Failed to load product image: ${imgPath}`);
    }
  }
  return null;
}
