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
import { lockBatch } from "./batch-locker";
import { planConcepts } from "./creative-planner";
import { critiqueConcepts } from "./creative-critic";
import { conceptsToBriefs } from "./concept-adapter";
import { inferBrandPolicy } from "./brand-style-policy";
import { directAdBatchV3, adDirectorToArtDirection } from "./art-director";
import { buildPromptBatchV3 } from "./prompt-builder";
import { selectReferencesBatch } from "./reference-selector";
import { renderBatch } from "./renderer";
import { renderGateBatch } from "./quality-gate";
import { compositionGate } from "./quality-gate";
import { composeAd, deriveCopyAssetsV3 } from "./composer";
import { dualEvaluateBatch } from "./dual-evaluator";
import { buildGraphicAd, generateBatchConfigs } from "./graphic-engine";
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
}

export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const { input, onEvent } = config;
  const hasProductImages = !!(input.product?.imagePaths?.length);

  // ─── LAYER A: Context Filter ───────────────────────────────
  onEvent({ type: "phase", phase: "A", message: "Filtrage du contexte stratégique..." });

  const context = await filterContext(input);
  onEvent({ type: "context_filtered", context });

  // ─── Infer brand policy from context ────────────────────────
  const brandPolicy = inferBrandPolicy(context);
  console.log(`[Pipeline] Brand policy: "${brandPolicy.brand_name}" (max stretch: ${brandPolicy.max_stretch_per_batch})`);

  // ─── LAYER J: Batch Locker ─────────────────────────────────
  onEvent({ type: "phase", phase: "J", message: "Verrouillage stratégique du batch..." });

  const lock = await lockBatch(context, input.count);
  onEvent({ type: "batch_locked", lock });

  // ─── LAYER B: Concept Planner (v3) ────────────────────────
  // Over-generates count×2 concepts with closed taxonomies.
  onEvent({ type: "phase", phase: "B", message: `Génération de ${input.count * 2} concepts (sur-génération pour filtrage)...` });

  const allConcepts = await planConcepts(context, input.count, brandPolicy, lock, hasProductImages);
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

  const adDirections = await directAdBatchV3(keptConcepts, context, hasProductImages);

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

    // Select references using v2 ArtDirection adapter (reference-selector expects ArtDirection)
    // Pass additional user-uploaded reference images if available
    let geminiRefs: SelectedReference[][];
    geminiRefs = selectReferencesBatch(
      geminiArtDirs,
      input.product?.imagePaths,
      undefined, // inspirationPaths
      input.additionalReferenceImages,
    );

    // Build prompts using v3 path
    const geminiPrompts = buildPromptBatchV3(
      geminiConcepts,
      geminiAdDirs,
      context,
      geminiRefs,
      input.aspectRatio,
    );

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

  // ─── LAYER G: Composer (v3 — taxonomy-driven layout) ────────
  const composedAds: ComposedAd[] = [];
  const compositionGateVerdicts: GateVerdict[] = [];

  onEvent({ type: "phase", phase: "G", message: "Composition v3 des publicités (SVG text overlay)..." });

  for (let i = 0; i < renders.length; i++) {
    const concept = keptConcepts[i];
    const brief = briefs[i];
    const copyAssets = allCopyAssets[i]?.copyAssets || deriveCopyAssetsV3(concept, context);

    onEvent({
      type: "composing",
      index: i,
      layout: concept.layout_family,
    });

    const composerInput: ComposerInput = {
      image: renders[i].final_image,
      mimeType: renders[i].final_mime_type,
      brief,
      artDirection: artDirections[i],
      context,
      renderMode: concept.render_mode,
      overlayIntent: concept.overlay_intent,
      textDensity: concept.text_density,
      copyAssets,
      aspectRatio: input.aspectRatio,
      // v3 additions
      layoutFamily: concept.layout_family,
      proofMechanism: concept.proof_mechanism,
      formatFamily: concept.format_family,
    };

    const composed = await composeAd(composerInput);
    composedAds.push(composed);

    onEvent({
      type: "composed",
      index: i,
      layoutUsed: composed.layoutUsed,
      fallbacks: composed.fallbacksApplied,
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
