import type {
  RawPipelineInput,
  FilteredContext,
  CreativeBrief,
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
import { planCreatives } from "./creative-planner";
import { directArtBatch } from "./art-director";
import { buildPromptBatch } from "./prompt-builder";
import { selectReferencesBatch } from "./reference-selector";
import { renderBatch } from "./renderer";
import { renderGateBatch } from "./quality-gate";
import { compositionGate } from "./quality-gate";
import { composeAd, deriveCopyAssets } from "./composer";
import { dualEvaluateBatch } from "./dual-evaluator";
import { buildGraphicAd, generateBatchConfigs } from "./graphic-engine";
import fs from "fs";
import path from "path";

// ============================================================
// PIPELINE ORCHESTRATOR v2
// Dual-engine rendering:
//   "graphic_design" realism_target → PROGRAMMATIC (Sharp, no AI)
//     Background gradient + real product photo + SVG text overlay
//   All other realism_targets → GEMINI (AI scene) + SVG text overlay
//
// Both paths produce text-free images, then the Composer adds
// pixel-perfect typography via SVG overlay.
//
// The creative planner decides per-concept which path to use.
// A batch can mix both approaches for maximum variety.
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

export interface PipelineConfig {
  input: RawPipelineInput;
  onEvent: (event: PipelineEvent) => void;
}

export interface PipelineResult {
  context: FilteredContext;
  lock: BatchLockConfig;
  briefs: CreativeBrief[];
  artDirections: ArtDirection[];
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
  const strategy = input.renderStrategy || "complete_ad"; // Default to complete_ad for best quality

  // ─── LAYER A: Context Filter ───────────────────────────────
  onEvent({ type: "phase", phase: "A", message: "Filtrage du contexte stratégique..." });

  const context = await filterContext(input);
  onEvent({ type: "context_filtered", context });

  // ─── LAYER J: Batch Locker ─────────────────────────────────
  onEvent({ type: "phase", phase: "J", message: "Verrouillage stratégique du batch..." });

  const lock = await lockBatch(context, input.count);
  onEvent({ type: "batch_locked", lock });

  // ─── LAYER B: Creative Planner ─────────────────────────────
  onEvent({ type: "phase", phase: "B", message: "Génération des concepts créatifs..." });

  const briefs = await planCreatives(context, input.count, lock, hasProductImages);
  onEvent({ type: "briefs_generated", briefs });

  // ─── LAYER C: Art Director (ONLY for clean mode) ───────────
  let artDirections: (ArtDirection | null)[];

  if (strategy === "clean") {
    onEvent({ type: "phase", phase: "C", message: "Direction artistique par concept..." });

    const fullDirections = await directArtBatch(briefs, context, hasProductImages);
    artDirections = fullDirections;

    fullDirections.forEach((dir, i) => {
      onEvent({ type: "art_direction", index: i, direction: dir });
    });
  } else {
    // COMPLETE_AD MODE: Skip art director entirely
    onEvent({ type: "phase", phase: "C", message: "Mode complete_ad — direction artistique intégrée au concept créatif (skip)" });
    artDirections = briefs.map(() => null);
  }

  // ─── LAYER D+E: Prompt Build + Render (DUAL ENGINE) ─────────
  // Route each concept to the right engine:
  //   graphic_design → Sharp programmatic (instant, 100% reliable)
  //   everything else → Gemini AI scene (creative, varied)

  onEvent({ type: "phase", phase: "D", message: "Construction des prompts et routage moteur..." });

  // Split concepts by engine type
  const graphicIndices: number[] = [];
  const geminiIndices: number[] = [];

  briefs.forEach((brief, i) => {
    if (brief.realism_target === "graphic_design" && hasProductImages) {
      graphicIndices.push(i);
    } else {
      geminiIndices.push(i);
    }
  });

  console.log(`[Pipeline] Routing: ${graphicIndices.length} graphic_design + ${geminiIndices.length} AI scene`);

  // Derive copy assets for ALL concepts (needed by both engines)
  const allCopyAssets = briefs.map((brief) => ({
    copyAssets: deriveCopyAssets(brief, context),
    brandName: context.brand_name,
  }));

  // ─── ENGINE A: Graphic Design (programmatic, no AI) ────────
  const graphicRenders: Map<number, RenderResult> = new Map();

  if (graphicIndices.length > 0) {
    onEvent({ type: "phase", phase: "E", message: `Moteur graphique (${graphicIndices.length} concepts)...` });

    // Load product image once
    const productBuffer = loadFirstProductImage(input.product?.imagePaths);

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
            art_direction: {} as ArtDirection,
            base_image: {
              buffer: imageBuffer,
              mime_type: "image/png",
              prompt_used: "[graphic_design — programmatic, no AI]",
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
          console.log(`[Pipeline] Graphic engine SUCCESS for concept ${conceptIndex + 1}`);
        } catch (err) {
          console.error(`[Pipeline] Graphic engine FAILED for concept ${conceptIndex + 1}:`, err);
          onEvent({ type: "render_pass_1", index: conceptIndex, success: false });
          // Fall back to Gemini for this concept
          geminiIndices.push(conceptIndex);
        }
      }
    } else {
      // No product image loaded — fall back all to Gemini
      geminiIndices.push(...graphicIndices);
      graphicIndices.length = 0;
    }
  }

  // ─── ENGINE B: Gemini AI (scene generation) ────────────────
  const geminiRenders: Map<number, RenderResult> = new Map();

  if (geminiIndices.length > 0) {
    onEvent({ type: "phase", phase: "E", message: `Moteur IA Gemini (${geminiIndices.length} concepts)...` });

    // Build prompts only for Gemini concepts
    const geminiBriefs = geminiIndices.map((i) => briefs[i]);
    const geminiDirections = geminiIndices.map((i) => artDirections[i]);

    // Select references for Gemini concepts
    let geminiRefs: SelectedReference[][];
    if (strategy === "clean" && geminiDirections[0]) {
      geminiRefs = selectReferencesBatch(
        geminiDirections as ArtDirection[],
        input.product?.imagePaths,
      );
    } else {
      geminiRefs = selectReferencesFromBriefs(geminiBriefs, input.product?.imagePaths);
    }

    const geminiAdAssets = geminiIndices.map((i) => allCopyAssets[i]);

    const geminiPrompts = buildPromptBatch(
      geminiBriefs,
      geminiDirections,
      context,
      geminiRefs,
      input.aspectRatio,
      geminiAdAssets
    );

    geminiPrompts.forEach((p, gi) => {
      onEvent({ type: "prompt_built", index: geminiIndices[gi], prompt_preview: p.prompt_for_model.slice(0, 200) });
    });

    const rawGeminiRenders = await renderBatch(
      geminiPrompts,
      geminiBriefs,
      (gi, success) => onEvent({ type: "render_pass_1", index: geminiIndices[gi], success }),
      (gi, success) => onEvent({ type: "render_pass_2", index: geminiIndices[gi], success })
    );

    rawGeminiRenders.forEach((r, gi) => {
      r.concept_index = geminiIndices[gi];
      r.art_direction = (artDirections[geminiIndices[gi]] || {}) as ArtDirection;
      geminiRenders.set(geminiIndices[gi], r);
    });
  }

  // ─── Merge renders (maintain original order) ───────────────
  const renders: RenderResult[] = [];
  const prompts: BuiltPrompt[] = [];

  for (let i = 0; i < briefs.length; i++) {
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

  // ─── LAYER G: Composer (ALWAYS — both modes) ─────────────────
  // Both strategies now generate text-free images and use the Composer
  // to add text overlays via Sharp + SVG for pixel-perfect typography.

  let composedAds: ComposedAd[] = [];
  let compositionGateVerdicts: GateVerdict[] = [];

  onEvent({ type: "phase", phase: "G", message: "Composition des publicités finales (SVG text overlay)..." });

  for (let i = 0; i < renders.length; i++) {
    const brief = briefs[i];
    const copyAssets = allCopyAssets[i]?.copyAssets || deriveCopyAssets(brief, context);

    onEvent({
      type: "composing",
      index: i,
      layout: brief.overlayIntent || "headline_cta",
    });

    const composerInput: ComposerInput = {
      image: renders[i].final_image,
      mimeType: renders[i].final_mime_type,
      brief,
      artDirection: (artDirections[i] || {}) as ArtDirection,
      context,
      renderMode: brief.renderMode || "scene_first",
      overlayIntent: brief.overlayIntent || "headline_cta",
      textDensity: brief.textDensity || "medium",
      copyAssets,
      aspectRatio: input.aspectRatio,
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
    briefs,
    artDirections: artDirections.map((d) => (d || {}) as ArtDirection),
    prompts,
    renders,
    renderGateVerdicts,
    composedAds,
    compositionGateVerdicts,
    evaluation,
  };
}

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Load the first available product image.
 * Used by the graphic engine for product compositing.
 */
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

// ─── Select references when art direction is skipped ─

/**
 * Select references directly from briefs (when art direction is skipped).
 * Simply loads all product images as product_fidelity references.
 */
function selectReferencesFromBriefs(
  briefs: CreativeBrief[],
  productImagePaths?: string[]
): SelectedReference[][] {
  if (!productImagePaths?.length) {
    return briefs.map(() => []);
  }

  // Load product images once, share across all concepts
  const loadedRefs: SelectedReference[] = [];
  for (const imgPath of productImagePaths.slice(0, 3)) {
    try {
      const fullPath = path.isAbsolute(imgPath)
        ? imgPath
        : path.join(DATA_DIR, imgPath);

      if (fs.existsSync(fullPath)) {
        loadedRefs.push({
          path: imgPath,
          role: "product_fidelity",
          buffer: fs.readFileSync(fullPath),
        });
      }
    } catch {
      console.warn(`[Pipeline] Failed to load product image: ${imgPath}`);
    }
  }

  // Every concept gets the same product references
  return briefs.map(() => [...loadedRefs]);
}
