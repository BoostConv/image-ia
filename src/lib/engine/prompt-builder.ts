import type {
  CreativeBrief,
  ArtDirection,
  FilteredContext,
  BuiltPrompt,
  SelectedReference,
  ImageGenerationConfig,
  CopyAssets,
} from "./types";

// ============================================================
// LAYER D: PROMPT BUILDER
// Programmatic construction of the final image generation prompt.
// No AI call — pure template engineering.
//
// ALL modes generate TEXT-FREE images. Text is ALWAYS added later
// by the Composer (Sharp + SVG) for pixel-perfect typography.
//
// Gemini is terrible at rendering text in images — so we NEVER
// ask it to. Instead we ask for beautiful, cinematic, product-focused
// scenes with clear space reserved for text overlay.
//
// Prompt strategy:
//   - Keep prompts SHORT (<800 chars) — image models work better
//   - Lead with quality keywords (high attention weight)
//   - Describe the SCENE vividly, not technical specs
//   - Always request "no text, no typography, no watermarks"
//   - Always request clear space at the copy_safe_zone
// ============================================================

const MAX_PROMPT_LENGTH = 800;

/**
 * Build the complete prompt package for one concept.
 * ALL modes now generate text-free images. Text is added by the Composer.
 */
export function buildPrompt(
  brief: CreativeBrief,
  direction: ArtDirection | null,
  context: FilteredContext,
  references: SelectedReference[],
  aspectRatio: string,
  completeAd?: { copyAssets: CopyAssets; brandName: string }
): BuiltPrompt {
  let promptForModel: string;
  let editPrompt: string;

  if (completeAd) {
    // COMPLETE AD MODE — clean scene image, text added later by Composer
    promptForModel = buildScenePrompt(brief, context, references);
    editPrompt = "";
  } else if (brief.renderMode === "product_first" && direction) {
    promptForModel = buildProductFirstPass1(brief, direction, context);
    editPrompt = buildProductFirstPass2(brief, direction, context);
  } else if (direction) {
    promptForModel = buildPass1Prompt(brief, direction, context);
    editPrompt = buildPass2Prompt(brief, direction, context);
  } else {
    // Fallback: build from brief alone (no art direction)
    promptForModel = buildScenePrompt(brief, context, references);
    editPrompt = "";
  }

  const config = buildGenerationConfig(aspectRatio);

  return {
    prompt_for_model: promptForModel,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: config,
  };
}

// ─── SCENE PROMPT (clean image, no text) ─────────────────────

/**
 * Build a SHORT, visual-only prompt for Gemini.
 *
 * KEY INSIGHT: Image generation models produce MUCH better results when:
 * 1. The prompt is SHORT (<800 chars) — every word beyond that dilutes quality
 * 2. Quality keywords come FIRST (high attention weight at start)
 * 3. The prompt describes a SCENE, not technical specifications
 * 4. Text rendering is NEVER requested (models are terrible at it)
 * 5. The product is described as part of the scene, not as a technical requirement
 *
 * Text overlay is added AFTER by the Composer (Sharp + SVG = pixel-perfect).
 */
function buildScenePrompt(
  brief: CreativeBrief,
  context: FilteredContext,
  references: SelectedReference[]
): string {
  const parts: string[] = [];

  // ── Quality primer (highest attention weight at start of prompt) ──
  const styleMap: Record<string, string> = {
    photorealistic: "Ultra-high quality advertising photography, 8K, professional lighting",
    stylized_photo: "Cinematic commercial photography, dramatic studio lighting, high contrast",
    editorial: "High-end editorial photography, magazine quality, art-directed",
    graphic_design: "Bold graphic design composition, clean geometric shapes, vibrant",
    mixed_media: "Creative mixed media, photography blended with graphic elements",
  };
  parts.push(styleMap[brief.realism_target] || styleMap.photorealistic + ".");

  // ── Product reference handling ──
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (hasProductRef) {
    parts.push(
      `Reproduce the EXACT product from the reference photo — same packaging, colors, logo, shape.`
    );
  }

  // ── The SCENE — the heart of the prompt ──
  // This is the creative concept from the planner — keep it as-is, it's already vivid
  parts.push(brief.single_visual_idea);

  // ── Product integration (short) ──
  parts.push(
    `${context.product_name} clearly visible, naturally part of the scene with real shadows and perspective.`
  );

  // ── Space for text overlay (added later by Composer) ──
  const safeZone = brief.copy_safe_zone || "top";
  parts.push(`Leave clear empty space at the ${safeZone} of the image — no objects there.`);

  // ── CRITICAL: No text! ──
  parts.push(`Absolutely no text, no typography, no words, no letters, no logos, no watermarks in the image.`);

  return condensePrompt(parts.join(" "), MAX_PROMPT_LENGTH);
}

// ─── CLEAN MODE (no text) ───────────────────────────────────

/**
 * PASS 1: Scene-first clean image (no text).
 */
function buildPass1Prompt(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(brief.single_visual_idea + ".");

  if (direction.product_role !== "absent") {
    parts.push(
      `${context.product_name} as ${direction.product_role} element. ${context.product_key_benefit}.`
    );
  }

  parts.push(direction.environment + ".");
  parts.push(`${direction.composition}. ${direction.framing}. Focus: ${direction.focal_point}.`);
  parts.push(`${direction.lighting}. ${direction.color_direction}.`);
  parts.push(direction.camera + ".");

  const styleShort: Record<string, string> = {
    photorealistic: "Ultra-realistic advertising photography, medium format quality.",
    stylized_photo: "Stylized commercial photography, dramatic lighting.",
    editorial: "Editorial magazine photography, art directed.",
    graphic_design: "Clean graphic design with photographic elements.",
    mixed_media: "Mixed media, photography with graphic elements.",
  };
  parts.push(styleShort[brief.realism_target] || styleShort.photorealistic);

  if (direction.prop_list.length > 0 && direction.prop_list.length <= 4) {
    parts.push(`Props: ${direction.prop_list.join(", ")}.`);
  }

  parts.push(`Leave clear space at ${direction.safe_zone.position} for text overlay.`);
  parts.push("No text, no logos, no watermarks in the image.");

  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PROMPT_LENGTH);
}

/**
 * PASS 2: Refinement prompt — 3 directives max.
 */
function buildPass2Prompt(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const edits: string[] = [];

  if (direction.product_role === "hero") {
    edits.push(
      `Sharpen ${context.product_name} details: crisp edges, accurate ${direction.texture_priority} texture.`
    );
  }

  edits.push(
    `Refine lighting (${direction.lighting.slice(0, 60)}) and colors (${direction.color_direction.slice(0, 60)}).`
  );

  edits.push(
    `Ensure ${direction.safe_zone.percentage}% clear space at ${direction.safe_zone.position}. No text in image.`
  );

  return edits.join(" ");
}

// ─── PRODUCT FIRST PROMPT BUILDERS ──────────────────────────

function buildProductFirstPass1(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(
    `Professional product photography: ${context.product_name}. ${brief.single_visual_idea}.`
  );

  parts.push(
    `Exact product reproduction from reference — accurate packaging, logo, colors, materials (${direction.texture_priority}).`
  );

  const anchoring = direction.product_anchoring;
  if (anchoring) {
    parts.push(
      `Product at ${anchoring.position}, ~${Math.round(anchoring.scale * 100)}% of frame.${anchoring.contact_shadow_required ? " Natural contact shadow." : ""}`
    );
  }

  parts.push(`${direction.environment}. ${direction.lighting}.`);
  parts.push(`${direction.camera}. Sharp focus on product, soft background.`);
  parts.push(`${direction.color_direction}.`);

  const styleShort: Record<string, string> = {
    photorealistic: "Ultra-realistic product photography.",
    stylized_photo: "Stylized commercial product shot.",
    editorial: "Editorial product photography.",
    graphic_design: "Clean product on graphic background.",
    mixed_media: "Product with mixed media elements.",
  };
  parts.push(styleShort[brief.realism_target] || styleShort.photorealistic);

  parts.push(`Clear space at ${direction.safe_zone.position} for text. No text in image.`);

  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PROMPT_LENGTH);
}

function buildProductFirstPass2(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  return [
    `Extend scene around product: ${direction.environment}. Keep product unchanged.`,
    `Match perspective and lighting. ${direction.color_direction}.`,
    `Maintain clear space at ${direction.safe_zone.position}. No text.`,
  ].join(" ");
}

// ─── UTILITIES ──────────────────────────────────────────────

function condensePrompt(raw: string, maxLength: number): string {
  let prompt = raw.replace(/\s+/g, " ").trim();

  if (prompt.length <= maxLength) {
    return prompt;
  }

  const truncated = prompt.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > maxLength * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated + "...";
}

function buildGenerationConfig(aspectRatio: string): ImageGenerationConfig {
  return {
    aspect_ratio: aspectRatio,
    quality: "high",
  };
}

/**
 * Build prompts for an entire batch.
 */
export function buildPromptBatch(
  briefs: CreativeBrief[],
  directions: (ArtDirection | null)[],
  context: FilteredContext,
  referencesByIndex: SelectedReference[][],
  aspectRatio: string,
  completeAdAssets?: Array<{ copyAssets: CopyAssets; brandName: string } | undefined>
): BuiltPrompt[] {
  return briefs.map((brief, i) =>
    buildPrompt(
      brief,
      directions[i],
      context,
      referencesByIndex[i] || [],
      aspectRatio,
      completeAdAssets?.[i]
    )
  );
}
