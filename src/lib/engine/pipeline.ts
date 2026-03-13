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
// lockBatch is now merged into filterContext (P2 optimization)
// import { lockBatch } from "./batch-locker";
import { planConcepts } from "./creative-planner";
import { critiqueConcepts } from "./creative-critic";
import { conceptsToBriefs } from "./concept-adapter";
import { inferBrandPolicy } from "./brand-style-policy";
import { analyzeBrandDA, enrichPolicyWithDA, formatDAFingerprintForPrompt } from "./brand-da-analyzer";
import type { BrandDAFingerprint } from "./brand-da-analyzer";
import { directAdBatchV3, adDirectorToArtDirection } from "./art-director";
import { buildPromptBatchV3, buildAdFocusedPromptBatch, adjustPromptAfterGateFailure } from "./prompt-builder";
import { selectReferencesBatch, selectReferencesBatchV4, loadBrandStyleImages } from "./reference-selector";
import { getLayoutInspirationImage } from "../db/queries/layouts";
import type { LayoutFamily } from "../db/schema";
import { renderBatch } from "./renderer";
import { renderGateBatch } from "./quality-gate";
import { compositionGate } from "./quality-gate";
import { composeAd, deriveCopyAssetsV3 } from "./composer";
import { polishCopyBatch } from "./copy-editor";
import { dualEvaluateBatch } from "./dual-evaluator";
import { buildGraphicAd, generateBatchConfigs } from "./graphic-engine";
import { getRecentCreativePatterns } from "../db/queries/creative-memory";
import type { CreativeMemory } from "../db/queries/creative-memory";
import fs from "fs";
import path from "path";

// ============================================================
// PIPELINE ORCHESTRATOR v3.1
//
// A: ContextFilter → J: BatchLocker → B: ConceptPlanner (v3) →
// B2: CreativeCritic → C: AdDirector (v3 — AdDirectorSpec) →
// D: PromptBuilder (v3 — 3 specialized builders) →
// E: Renderer (dual-engine) → H1: RenderGate →
// G: Composer (v3 — taxonomy-driven layout) →
// H2: CompositionGate → K: DualEvaluator → F: Ranking
//
// Key changes from v3.0:
//   - Art director produces AdDirectorSpec (richer ad structure)
//   - Prompt builder routes by render_family (photo/design/hybrid)
//   - Layout selection by LayoutFamily taxonomy (direct match)
//   - Copy assets derived from ConceptSpec (v3, richer)
//   - Adapter bridge still used for renderer backward compat
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

export interface PipelineConfig {
  input: RawPipelineInput;
  onEvent: (event: PipelineEvent) => void;
}

export interface PipelineResult {
  context: FilteredContext;
  lock: BatchLockConfig;
  concepts: ConceptSpec[];           // v3: all generated concepts
  scoredConcepts: ScoredConcept[];   // v3: scored by critic
  keptConcepts: ConceptSpec[];       // v3: kept after critic filter
  briefs: CreativeBrief[];           // v2 compat: adapted from kept concepts
  adDirections: AdDirectorSpec[];    // v3: ad director specs
  artDirections: ArtDirection[];     // v2 compat: adapted from ad directions
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
  console.log(`[Pipeline] Brand policy: "${brandPolicy.brand_name}" (max stretch: ${brandPolicy.max_stretch_per_batch})`);

  // ─── Brand DA Analysis (Vision on brand style images) ──────
  let daFingerprint: BrandDAFingerprint | undefined;
  if (input.brandStyleImagePaths?.length) {
    try {
      onEvent({ type: "phase", phase: "A2", message: "Analyse DA marque (Vision)..." });
      const styleImages = loadBrandStyleImages(input.brandStyleImagePaths);
      if (styleImages.length > 0) {
        daFingerprint = await analyzeBrandDA(styleImages, context.brand_name);
        // Enrich policy with observed DA
        brandPolicy = enrichPolicyWithDA(brandPolicy, daFingerprint);
        console.log(`[Pipeline] Brand DA enriched — personality: "${daFingerprint.visual_personality}", confidence: ${daFingerprint.confidence}`);
      }
    } catch (err) {
      console.warn("[Pipeline] Brand DA analysis failed, continuing with inferred policy:", err);
    }
  }

  // ─── P3: Creative Memory (inter-batch diversification) ─────
  let creativeMemory: CreativeMemory | undefined;
  const brandId = input.brand.name; // Use brand name as fallback ID
  try {
    creativeMemory = await getRecentCreativePatterns(brandId);
    if (creativeMemory.totalAds > 0) {
      console.log(`[Pipeline] Creative memory: ${creativeMemory.totalAds} recent ads found for "${brandId}"`);
    }
  } catch {
    console.warn("[Pipeline] Creative memory query failed, continuing without");
  }

  // ─── LAYER B: Concept Planner (v3) ────────────────────────
  // Over-generates count×2 concepts with closed taxonomies.
  onEvent({ type: "phase", phase: "B", message: `Génération de ${input.count * 2} concepts (sur-génération pour filtrage)...` });

  const allConcepts = await planConcepts(context, input.count, brandPolicy, lock, hasProductImages, creativeMemory, daFingerprint);
  onEvent({ type: "concepts_generated", concepts: allConcepts });

  // ─── LAYER B2: Creative Critic ────────────────────────────
  // Scores all concepts, keeps top N.
  onEvent({ type: "phase", phase: "B2", message: `Critique créative — filtrage des ${allConcepts.length} concepts...` });

  const scoredConcepts = await critiqueConcepts(allConcepts, context, brandPolicy, input.count);
  const keptConcepts = scoredConcepts
    .slice(0, input.count)
    .map((s) => s.concept);

  const rejectedCount = allConcepts.length - keptConcepts.length;
  onEvent({ type: "concepts_scored", scored: scoredConcepts, kept: keptConcepts.length, rejected: rejectedCount });
  console.log(`[Pipeline] Critic: kept ${keptConcepts.length}/${allConcepts.length} concepts`);

  // ─── ADAPTER: ConceptSpec → CreativeBrief ──────────────────
  // Downstream renderer still expects CreativeBrief for metadata storage.
  const briefs = conceptsToBriefs(keptConcepts);
  onEvent({ type: "briefs_generated", briefs }); // Backward compat event

  // ─── LAYER C: Ad Director (v3 — AdDirectorSpec) ────────────
  onEvent({ type: "phase", phase: "C", message: "Direction artistique v3 par concept..." });

  const daDirective = daFingerprint ? formatDAFingerprintForPrompt(daFingerprint) : undefined;
  const adDirections = await directAdBatchV3(keptConcepts, context, hasProductImages, daDirective);

  // Adapt to ArtDirection for downstream renderer compat
  const artDirections = adDirections.map(adDirectorToArtDirection);

  adDirections.forEach((dir, i) => {
    onEvent({ type: "ad_direction", index: i, direction: dir });
  });

  // ─── LAYER D+E: Prompt Build + Render (DUAL ENGINE) ─────────
  onEvent({ type: "phase", phase: "D", message: "Construction des prompts v3 et routage moteur..." });

  // Derive copy assets from ConceptSpec (v3 — richer)
  const allCopyAssets = keptConcepts.map((concept) => ({
    copyAssets: deriveCopyAssetsV3(concept, context),
    brandName: context.brand_name,
  }));

  // Split concepts by engine type
  const graphicIndices: number[] = [];
  const geminiIndices: number[] = [];

  keptConcepts.forEach((concept, i) => {
    if (concept.render_family === "design_led" && hasProductImages) {
      graphicIndices.push(i);
    } else {
      geminiIndices.push(i);
    }
  });

  console.log(`[Pipeline] Routing: ${graphicIndices.length} design_led + ${geminiIndices.length} AI (photo/hybrid)`);

  // ─── ENGINE A: Graphic Design (programmatic, no AI) ────────
  const graphicRenders: Map<number, RenderResult> = new Map();

  if (graphicIndices.length > 0) {
    onEvent({ type: "phase", phase: "E", message: `Moteur graphique (${graphicIndices.length} concepts)...` });

    // Prefer user-uploaded additional images, then product images from disk
    const productBuffer = input.additionalReferenceImages?.[0]
      || loadFirstProductImage(input.product?.imagePaths);

    if (productBuffer) {
      const graphicConfigs = generateBatchConfigs(
        graphicIndices.length,
        context.brand_visual_code.primary_color || "#333333",
        context.brand_visual_code.secondary_color || "#666666",
        context.brand_visual_code.accent_color || "#FF6600",
        input.aspectRatio
      );

      for (let gi = 0; gi < graphicIndices.length; gi++) {
        const conceptIndex = graphicIndices[gi];
        try {
          const imageBuffer = await buildGraphicAd(productBuffer, graphicConfigs[gi]);

          const renderResult: RenderResult = {
            concept_index: conceptIndex,
            brief: briefs[conceptIndex],
            art_direction: artDirections[conceptIndex],
            base_image: {
              buffer: imageBuffer,
              mime_type: "image/png",
              prompt_used: "[design_led — programmatic, no AI]",
            },
            edited_image: undefined,
            final_image: imageBuffer,
            final_mime_type: "image/png",
            generation_metadata: {
              pass_1_success: true,
              pass_2_success: false,
              pass_2_attempted: false,
              total_api_calls: 0,
              reference_images_used: 1,
            },
          };

          graphicRenders.set(conceptIndex, renderResult);
          onEvent({ type: "render_pass_1", index: conceptIndex, success: true });
        } catch (err) {
          console.error(`[Pipeline] Graphic engine FAILED for concept ${conceptIndex + 1}:`, err);
          onEvent({ type: "render_pass_1", index: conceptIndex, success: false });
          geminiIndices.push(conceptIndex);
        }
      }
    } else {
      geminiIndices.push(...graphicIndices);
      graphicIndices.length = 0;
    }
  }

  // ─── ENGINE B: Gemini AI (scene generation) ────────────────
  const geminiRenders: Map<number, RenderResult> = new Map();

  if (geminiIndices.length > 0) {
    onEvent({ type: "phase", phase: "E", message: `Moteur IA Gemini (${geminiIndices.length} concepts)...` });

    // Build v3 prompts using ConceptSpec + AdDirectorSpec
    const geminiConcepts = geminiIndices.map((i) => keptConcepts[i]);
    const geminiAdDirs = geminiIndices.map((i) => adDirections[i]);
    const geminiArtDirs = geminiIndices.map((i) => artDirections[i]);
    const geminiBriefs = geminiIndices.map((i) => briefs[i]);

    // ─── Phase 5+: Load layout inspirations and brand style ────
    const brandId = input.brand.name; // Use brand name as fallback ID
    const layoutFamilies = geminiConcepts.map((c) => c.layout_family as LayoutFamily);

    // Load layout inspiration images for each concept
    const layoutInspirations: (Buffer | undefined)[] = [];
    for (const layoutFamily of layoutFamilies) {
      try {
        const layoutBuffer = await getLayoutInspirationImage(layoutFamily, brandId);
        layoutInspirations.push(layoutBuffer || undefined);
      } catch {
        layoutInspirations.push(undefined);
      }
    }

    // Load brand style images if available
    const brandStyleImages = input.brandStyleImagePaths?.length
      ? loadBrandStyleImages(input.brandStyleImagePaths)
      : undefined;

    // Select references using V4 (with layout inspiration support)
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

    // ─── Phase 5+: Build prompts using AD-FOCUSED builder ────
    // Include copy assets so Gemini renders text directly in the image
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
    });

    geminiPrompts.forEach((p, gi) => {
      onEvent({ type: "prompt_built", index: geminiIndices[gi], prompt_preview: p.prompt_for_model.slice(0, 200) });
    });

    // Render using v2 renderer (still expects CreativeBrief)
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

    // Report render errors if any
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

  // ─── Merge renders (maintain original order) ───────────────
  const renders: RenderResult[] = [];
  const prompts: BuiltPrompt[] = [];

  for (let i = 0; i < keptConcepts.length; i++) {
    const render = graphicRenders.get(i) || geminiRenders.get(i);
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
    // Only retry Gemini renders (graphic renders are deterministic)
    if (renders[i].base_image.prompt_used === "[design_led — programmatic, no AI]") continue;

    retryCount++;
    onEvent({ type: "phase", phase: "H1-retry", message: `Retry render ${i + 1} (${verdict.action})...` });
    console.log(`[Pipeline] Retrying render ${i + 1} — verdict was "${verdict.action}"`);

    try {
      // Adjust prompt based on gate failure scores
      const originalPrompt = prompts[i];
      const adjustedPrompt = adjustPromptAfterGateFailure(originalPrompt, verdict);

      // Re-render with adjusted prompt (single attempt)
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

        // Re-gate the retry
        const retryVerdict = await renderGateBatch([retryRender]);
        const newVerdict = retryVerdict[0];
        onEvent({ type: "render_gate", index: i, verdict: newVerdict });

        // Replace if the retry is better (accept or at least not reject)
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

  // ─── STAGE F: Copy Editor (polish headlines/CTAs) ───────────
  onEvent({ type: "phase", phase: "F", message: "Polish du copy (headlines, CTAs)..." });

  const polishedCopies = await polishCopyBatch(keptConcepts, context);

  // Apply polished copy back to allCopyAssets
  polishedCopies.forEach((polished, i) => {
    if (allCopyAssets[i]) {
      allCopyAssets[i].copyAssets.headline = polished.headline;
      allCopyAssets[i].copyAssets.cta = polished.cta;
      if (polished.subtitle) {
        allCopyAssets[i].copyAssets.subtitle = polished.subtitle;
      }
      if (polished.proof) {
        allCopyAssets[i].copyAssets.proof = polished.proof;
      }
    }
  });

  console.log("[Pipeline] Copy polished:", polishedCopies.map((p, i) => ({
    concept: i + 1,
    headline: p.headline,
    cta: p.cta,
  })));

  // ─── LAYER G: SKIP Composer — Gemini renders text directly ────
  // Text (headline, CTA, brand) is now baked into the Gemini prompt.
  // No SVG overlay needed.
  const composedAds: ComposedAd[] = [];
  const compositionGateVerdicts: GateVerdict[] = [];

  onEvent({ type: "phase", phase: "G", message: "Texte intégré par Gemini — pas de composition SVG." });

  for (let i = 0; i < renders.length; i++) {
    // Pass-through: use the rendered image as-is (text already in image)
    const concept = keptConcepts[i];
    const copyAssets = allCopyAssets[i]?.copyAssets || deriveCopyAssetsV3(concept, context);
    composedAds.push({
      buffer: renders[i].final_image,
      mimeType: renders[i].final_mime_type,
      layoutUsed: "none",
      zonesUsed: [],
      collisions: [],
      fallbacksApplied: [],
      copyAssets,
    });

    onEvent({
      type: "composed",
      index: i,
      layoutUsed: "none",
      fallbacks: [],
    });
  }

  // ─── LAYER H2: Composition Gate ──────────────────────────────
  onEvent({ type: "phase", phase: "H2", message: "Contrôle qualité des compositions..." });

  for (let i = 0; i < composedAds.length; i++) {
    const canvasWidth = 1080;
    const verdict = compositionGate(composedAds[i], canvasWidth);
    compositionGateVerdicts.push(verdict);
    onEvent({ type: "composition_gate", index: i, verdict });
  }

  // ─── LAYER K: Dual Evaluator + LAYER F: Ranking ────────────
  onEvent({ type: "phase", phase: "K", message: "Évaluation duale et ranking..." });

  const evaluation = await dualEvaluateBatch(renders, composedAds, context);

  evaluation.individual.forEach((dualEval, i) => {
    onEvent({ type: "base_evaluation", index: i, scores: dualEval.base });
    onEvent({ type: "composed_evaluation", index: i, scores: dualEval.composed });
  });
  onEvent({ type: "ranking", ranking: evaluation.pairwise });

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
