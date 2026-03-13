import type {
  ConceptSpec,
  AdDirectorSpec,
  CreativeBrief,
  ArtDirection,
  FilteredContext,
  BuiltPrompt,
  SelectedReference,
  ImageGenerationConfig,
  CopyAssets,
  AdPromptStructure,
  GateVerdict,
} from "./types";
import type { LayoutFamily } from "../db/schema";

// ============================================================
// LAYER D: PROMPT BUILDER (v3.2 — AD-HARDENED)
//
// Programmatic construction of the final image generation prompt.
// No AI call — pure template engineering.
//
// THREE specialized builders by render_family:
//   - photo_led (≤900 chars): scene that PROVES the ad claim
//   - design_led (≤700 chars): graphic structure with product
//   - hybrid (≤800 chars): partial scene + graphic overlay
//
// ALL modes generate TEXT-FREE images. Text is ALWAYS added later
// by the Composer (Sharp + SVG) for pixel-perfect typography.
//
// STRICT PROMPT STRUCTURE (every builder follows this):
//   1. Ad job — what the visual must accomplish
//   2. Single visual proof — the ONE scene/device that proves it
//   3. Exact product constraint — packaging fidelity from reference
//   4. Composition constraint — framing, focal, grid
//   5. Minimal environment — only what the scene requires
//   6. Text overlay space — reserved safe zone
//   7. Avoid list — explicit negatives
//
// BANNED FILLER: "ultra-high quality", "8K", "professional studio
// lighting", "vibrant and modern", "premium", "elegant" — unless
// they describe a SPECIFIC scene element.
// ============================================================

const MAX_PHOTO_LENGTH = 900;
const MAX_DESIGN_LENGTH = 700;
const MAX_HYBRID_LENGTH = 800;

/**
 * Product-aware suffix: keeps product's real packaging/logo intact,
 * blocks everything else (floating text, fake logos, watermarks).
 */
const IMAGE_RULES_SUFFIX = " Preserve exact product packaging, label, and shape from reference. No floating text, no typography, no words, no letters, no fake logos outside the real product, no watermark.";

// ─── V3 ENTRY POINT ──────────────────────────────────────────

/**
 * Build prompt for one concept using v3 types.
 * Routes to specialized builder by render_family.
 */
export function buildPromptV3(
  concept: ConceptSpec,
  direction: AdDirectorSpec | null,
  context: FilteredContext,
  references: SelectedReference[],
  aspectRatio: string,
): BuiltPrompt {
  let promptForModel: string;
  let editPrompt: string;

  if (!direction) {
    // Fallback: no art direction — build from concept alone
    promptForModel = buildFallbackPrompt(concept, context, references);
    editPrompt = "";
  } else {
    switch (concept.render_family) {
      case "photo_led":
        promptForModel = buildPhotoLedPass1(concept, direction, context, references);
        editPrompt = buildPhotoLedPass2(concept, direction, context);
        break;

      case "design_led":
        promptForModel = buildDesignLedPass1(concept, direction, context, references);
        editPrompt = buildDesignLedPass2(concept, direction, context);
        break;

      case "hybrid":
        promptForModel = buildHybridPass1(concept, direction, context, references);
        editPrompt = buildHybridPass2(concept, direction, context);
        break;

      default:
        promptForModel = buildPhotoLedPass1(concept, direction, context, references);
        editPrompt = buildPhotoLedPass2(concept, direction, context);
    }
  }

  return {
    prompt_for_model: promptForModel,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

// ============================================================
// PHASE 5+ — AD-FOCUSED PROMPT BUILDER
// Creates prompts 100% oriented META ADS with:
// - AD MISSION (belief shift, purpose)
// - LAYOUT STRUCTURE (grid, reading order, safe zones)
// - VISUAL FOCUS (attention anchor, eye path)
// - SCENE (environment, lighting, mood)
// - REFERENCE STRATEGY (layout inspiration, brand style)
// ============================================================

const MAX_AD_FOCUSED_LENGTH = 1200; // Shorter = better for Gemini

export interface AdFocusedPromptInput {
  concept: ConceptSpec;
  direction: AdDirectorSpec;
  context: FilteredContext;
  references: SelectedReference[];
  aspectRatio: string;
  layoutInspiration?: Buffer;
  brandStyleImages?: Buffer[];
  layoutFamily: LayoutFamily;
  copyAssets?: CopyAssets;
}

/**
 * Build an AD-FOCUSED prompt (Phase 5+).
 * Structures the prompt around ad mission, layout, focus, and scene.
 */
export function buildAdFocusedPrompt(
  input: AdFocusedPromptInput
): BuiltPrompt {
  const { concept, direction, context, references, aspectRatio, layoutFamily } = input;

  const parts: string[] = [];

  // Headline & CTA — Gemini renders the text directly in the image
  const headline = input.copyAssets?.headline || concept.headline;
  const cta = input.copyAssets?.cta || concept.cta;
  const brandName = input.copyAssets?.brandName || context.brand_name;

  parts.push(`Create a Meta/Instagram ad image for ${brandName}.`);

  // Scene description — short, visual, concrete
  parts.push(concept.visual_device + ".");

  // Product placement
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(`Show the EXACT product from the reference photo — same packaging, label, colors, shape. ${context.product_name} placed at ${direction.product_placement}.`);
    } else {
      parts.push(`${context.product_name} at ${direction.product_placement}.`);
    }
  }

  // Environment + lighting (one line)
  parts.push(`${direction.environment}. ${direction.lighting.split(".")[0]}. ${direction.color_direction.split(".")[0]}.`);

  // Text overlay — Gemini handles it
  parts.push(`Include this text on the image, cleanly integrated into the composition:`);
  parts.push(`- Headline (large, bold): "${headline}"`);
  parts.push(`- CTA button or badge: "${cta}"`);
  if (brandName) {
    parts.push(`- Brand name: "${brandName}"`);
  }
  parts.push(`Place text at ${direction.safe_zone.position}. Text must be perfectly legible with good contrast against the background. Use clean, modern sans-serif typography.`);

  // Props (max 2)
  if (direction.prop_list.length > 0) {
    parts.push(`Props: ${direction.prop_list.slice(0, 2).join(", ")}.`);
  }

  // Avoid list (compact)
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  // Condense — no IMAGE_RULES_SUFFIX needed, anti-text is already in prompt
  const promptText = condensePrompt(parts.join("\n"), MAX_AD_FOCUSED_LENGTH);

  // Build edit prompt for pass 2
  const editPrompt = buildAdFocusedPass2(concept, direction, context);

  return {
    prompt_for_model: promptText,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

/**
 * Build pass 2 edit prompt for ad-focused generation.
 */
function buildAdFocusedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext
): string {
  const edits: string[] = [];

  // Sharpen product if hero or large scale
  if (concept.product_role === "hero" || direction.product_scale > 0.4) {
    edits.push(
      `Sharpen ${context.product_name}: crisp edges, accurate packaging texture.`
    );
  }

  // Ensure text is legible
  edits.push("Ensure all text in the image is perfectly legible, well-contrasted, and cleanly rendered.");

  // Color refinement
  if (direction.color_direction.length > 10) {
    edits.push(`Colors: ${direction.color_direction.slice(0, 80)}.`);
  }

  return edits.join(" ");
}

/**
 * Format layout family for human-readable prompt.
 */
function formatLayoutFamily(family: LayoutFamily): string {
  const mapping: Record<LayoutFamily, string> = {
    left_copy_right_product: "Left Copy + Right Product layout",
    center_hero_top_claim: "Center Hero with Top Claim layout",
    split_screen: "Split Screen layout (50/50)",
    card_stack: "Card Stack layout",
    quote_frame: "Quote Frame layout",
    badge_cluster: "Badge Cluster layout",
    vertical_story_stack: "Vertical Story Stack layout",
    diagonal_split: "Diagonal Split layout",
    hero_with_bottom_offer: "Hero with Bottom Offer layout",
    macro_with_side_copy: "Macro Shot with Side Copy layout",
  };
  return mapping[family] || family;
}

/**
 * Extract "from" part of belief shift.
 * Handles both French (DE...VERS) and English (FROM...TO) formats.
 */
function extractBeliefFrom(beliefShift: string): string {
  // Try French format: DE '...' → VERS
  const frenchMatch = beliefShift.match(/DE\s*['""]?(.+?)['""]?\s*→/i);
  if (frenchMatch) {
    return frenchMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Try English format: FROM '...' → TO
  const englishMatch = beliefShift.match(/FROM\s*['""]?(.+?)['""]?\s*→/i);
  if (englishMatch) {
    return englishMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Fallback: split by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) {
    return parts[0].replace(/^(DE|FROM)\s*/i, "").trim().replace(/^['""']|['""']$/g, "");
  }

  return "une croyance limitante";
}

/**
 * Extract "to" part of belief shift.
 * Handles both French (DE...VERS) and English (FROM...TO) formats.
 */
function extractBeliefTo(beliefShift: string): string {
  // Try French format: → VERS '...'
  const frenchMatch = beliefShift.match(/→\s*VERS\s*['""]?(.+?)['""]?\s*$/i);
  if (frenchMatch) {
    return frenchMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Try English format: → TO '...'
  const englishMatch = beliefShift.match(/→\s*TO\s*['""]?(.+?)['""]?\s*$/i);
  if (englishMatch) {
    return englishMatch[1].trim().replace(/^['""']|['""']$/g, "");
  }

  // Fallback: split by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(/^(VERS|TO)\s*/i, "").trim().replace(/^['""']|['""']$/g, "");
  }

  return beliefShift;
}

/**
 * Infer mood from concept and direction.
 */
function inferMood(concept: ConceptSpec, direction: AdDirectorSpec): string {
  // Use visual_style and style_mode to infer mood
  const styleMap: Record<string, string> = {
    minimal_product: "clean, focused, professional",
    editorial_lifestyle: "aspirational, warm, authentic",
    bold_graphic: "energetic, modern, impactful",
    luxe_restraint: "premium, sophisticated, refined",
    raw_authentic: "genuine, trustworthy, relatable",
    playful_pop: "fun, vibrant, engaging",
    tech_forward: "innovative, sleek, cutting-edge",
    organic_natural: "calm, natural, wholesome",
  };

  return styleMap[concept.visual_style] || direction.lighting.split(",")[0];
}

// ─── PHOTO-LED BUILDER (≤900 chars) ─────────────────────────
// Structure: ad job → visual proof → product → composition → environment → safe zone → avoid

function buildPhotoLedPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job — what this visual must accomplish (not a style declaration)
  parts.push(`Advertising photograph for ${concept.ad_job}.`);

  // 2. Single visual proof — the ONE scene that proves the ad claim
  parts.push(concept.visual_device + ".");

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(
        `EXACT product from reference: same packaging, colors, label, shape. ${context.product_name} as ${concept.product_role} element at ${direction.product_placement}.`
      );
    } else {
      parts.push(
        `${context.product_name} as ${concept.product_role} element at ${direction.product_placement}.`
      );
    }
    // Product anchoring precision
    if (direction.product_anchoring.scale > 0) {
      parts.push(`Product occupies ~${Math.round(direction.product_anchoring.scale * 100)}% of frame.`);
    }
  }

  // 4. Composition constraint — framing, focal, camera
  parts.push(`${direction.composition}. ${direction.framing}. Focus: ${direction.focal_point}.`);
  parts.push(`${direction.camera}.`);

  // 5. Minimal environment — only what the scene needs
  parts.push(`${direction.environment}. ${direction.lighting.split(".")[0]}. ${direction.color_direction.split(".")[0]}.`);

  // Props only if they serve the proof (max 3)
  if (direction.prop_list.length > 0) {
    parts.push(`Props: ${direction.prop_list.slice(0, 3).join(", ")}.`);
  }

  // 6. Text overlay space — reserved zone
  parts.push(`Empty space at ${direction.safe_zone.position} (~${direction.safe_zone.percentage}% of frame) reserved for text overlay.`);

  // 7. Avoid list
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 4).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildPhotoLedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
): string {
  const edits: string[] = [];

  // Sharpen product if hero or large
  if (concept.product_role === "hero" || direction.product_anchoring.scale > 0.4) {
    edits.push(
      `Sharpen ${context.product_name}: crisp edges, accurate packaging texture.`
    );
  }

  // Enforce safe zone
  edits.push(
    `Ensure ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`
  );

  // Color refinement only if direction provides specifics
  if (direction.color_direction.length > 10) {
    edits.push(`Colors: ${direction.color_direction.slice(0, 80)}.`);
  }

  return edits.join(" ");
}

// ─── DESIGN-LED BUILDER (≤700 chars) ────────────────────────
// Structure: ad job → visual structure → product → contrast → safe zone → avoid

function buildDesignLedPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Graphic design ad layout for ${concept.ad_job}.`);

  // 2. Visual structure — background + geometry
  const gradientSpec = direction.render_family_specs?.gradient_spec;
  if (gradientSpec) {
    parts.push(`Background: ${gradientSpec}.`);
  } else {
    parts.push(`Background: ${concept.background_treatment} using ${direction.color_direction.split(".")[0]}.`);
  }
  const geometrySpec = direction.render_family_specs?.geometry_elements;
  if (geometrySpec) {
    parts.push(`${geometrySpec}.`);
  }

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(
        `EXACT product from reference composited at ${direction.product_placement}, ~${Math.round(direction.product_anchoring.scale * 100)}% of frame.`
      );
    } else {
      parts.push(`${context.product_name} at ${direction.product_placement}.`);
    }
    if (direction.product_anchoring.contact_shadow_required) {
      parts.push("Contact shadow beneath product.");
    }
  }

  // 4. Contrast / tension principle
  parts.push(`${concept.contrast_principle}.`);

  // 5. Text overlay space
  parts.push(`Empty space at ${direction.safe_zone.position} for text overlay.`);

  // 6. Avoid
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_DESIGN_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildDesignLedPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  _context: FilteredContext,
): string {
  return [
    `Refine graphic composition: ${direction.composition.slice(0, 80)}.`,
    `Maintain ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`,
  ].join(" ");
}

// ─── HYBRID BUILDER (≤800 chars) ────────────────────────────
// Structure: ad job → scene + graphic elements → product → environment → safe zone → avoid

function buildHybridPass1(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Mixed-media ad visual for ${concept.ad_job}.`);

  // 2. Visual proof — scene + graphic overlay
  const photoSpec = direction.render_family_specs?.photo_scene_spec;
  if (photoSpec) {
    parts.push(`Scene: ${photoSpec}.`);
  } else {
    parts.push(`${concept.visual_device}.`);
  }
  const geometrySpec = direction.render_family_specs?.geometry_elements;
  if (geometrySpec) {
    parts.push(`Graphic overlay: ${geometrySpec}.`);
  }
  const blendMode = direction.render_family_specs?.blend_mode;
  if (blendMode) {
    parts.push(`${blendMode}.`);
  }

  // 3. Exact product constraint
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(`EXACT product from reference at ${direction.product_placement}.`);
    } else {
      parts.push(`${context.product_name} at ${direction.product_placement}.`);
    }
  }

  // 4. Minimal environment
  parts.push(`${direction.environment}. ${direction.lighting.split(".")[0]}.`);
  parts.push(`${direction.color_direction.split(".")[0]}.`);

  // 5. Text overlay space
  parts.push(`Empty space at ${direction.safe_zone.position} for text overlay.`);

  // 6. Avoid
  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_HYBRID_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildHybridPass2(
  concept: ConceptSpec,
  direction: AdDirectorSpec,
  context: FilteredContext,
): string {
  return [
    `Sharpen ${context.product_name}, crisp edges against graphic elements.`,
    `Ensure ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position}. No text anywhere.`,
  ].join(" ");
}

// ─── FALLBACK (no art direction available) ──────────────────

function buildFallbackPrompt(
  concept: ConceptSpec,
  context: FilteredContext,
  references: SelectedReference[],
): string {
  const parts: string[] = [];

  // 1. Ad job
  parts.push(`Advertising visual for ${concept.ad_job}.`);

  // 2. Visual proof
  parts.push(concept.visual_device + ".");

  // 3. Product
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging"
  );
  if (concept.product_role !== "absent") {
    if (hasProductRef) {
      parts.push(`EXACT product from reference: same packaging, label, shape. ${context.product_name} as ${concept.product_role} element.`);
    } else {
      parts.push(`${context.product_name} as ${concept.product_role} element.`);
    }
  }

  // 4. Composition
  parts.push("Single focal point, clear visual hierarchy.");

  // 5. Safe zone
  parts.push(`Empty space at ${concept.text_zone_spec} for text overlay.`);

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
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

// ─── V3 BATCH ──────────────────────────────────────────────

/**
 * Build prompts for a batch of concepts (v3).
 */
export function buildPromptBatchV3(
  concepts: ConceptSpec[],
  directions: (AdDirectorSpec | null)[],
  context: FilteredContext,
  referencesByIndex: SelectedReference[][],
  aspectRatio: string,
): BuiltPrompt[] {
  return concepts.map((concept, i) =>
    buildPromptV3(
      concept,
      directions[i],
      context,
      referencesByIndex[i] || [],
      aspectRatio,
    )
  );
}

// ─── V4 AD-FOCUSED BATCH (Phase 5+) ─────────────────────────

export interface AdFocusedBatchInput {
  concepts: ConceptSpec[];
  directions: AdDirectorSpec[];
  context: FilteredContext;
  referencesByIndex: SelectedReference[][];
  aspectRatio: string;
  layoutFamilies: LayoutFamily[];
  layoutInspirations?: (Buffer | undefined)[];
  brandStyleImages?: Buffer[];
  copyAssetsByIndex?: CopyAssets[];
}

/**
 * Build prompts for a batch of concepts (ad-focused v4).
 * Uses the new ad-focused prompt structure with layout inspirations.
 */
export function buildAdFocusedPromptBatch(
  input: AdFocusedBatchInput
): BuiltPrompt[] {
  const {
    concepts,
    directions,
    context,
    referencesByIndex,
    aspectRatio,
    layoutFamilies,
    layoutInspirations,
    brandStyleImages,
    copyAssetsByIndex,
  } = input;

  return concepts.map((concept, i) => {
    const direction = directions[i];
    const references = referencesByIndex[i] || [];
    const layoutFamily = layoutFamilies[i] || concept.layout_family;
    const layoutInspiration = layoutInspirations?.[i];
    const copyAssets = copyAssetsByIndex?.[i];

    // If we don't have direction, fallback to V3
    if (!direction) {
      return buildPromptV3(concept, null, context, references, aspectRatio);
    }

    return buildAdFocusedPrompt({
      concept,
      direction,
      context,
      references,
      aspectRatio,
      layoutFamily: layoutFamily as LayoutFamily,
      layoutInspiration,
      brandStyleImages,
      copyAssets,
    });
  });
}

// ─── FEEDBACK LOOP: PROMPT ADJUSTMENT AFTER GATE FAILURE ────
// P1 optimization: when render gate rejects an image, adjust the
// prompt based on the specific failure scores and retry once.

/**
 * Adjust a prompt after a render gate failure.
 * Reads the gate verdict scores and adds targeted negative constraints.
 */
export function adjustPromptAfterGateFailure(
  originalPrompt: BuiltPrompt,
  verdict: GateVerdict,
): BuiltPrompt {
  const scores = verdict.scores;
  const adjustments: string[] = [];

  // High "pasted" score → add compositing constraints
  if ((scores.product_looks_pasted ?? 0) > 7) {
    adjustments.push("Product must appear naturally integrated with coherent shadows and reflections. NOT composited, NOT pasted. Natural contact shadows and ambient occlusion.");
  } else if ((scores.product_looks_pasted ?? 0) > 5) {
    adjustments.push("Ensure natural shadows and reflections around product. Avoid any composited look.");
  }

  // High fidelity risk → add fidelity constraints
  if ((scores.product_fidelity_risk ?? 0) > 7) {
    adjustments.push("CRITICAL: Product packaging must be EXACT — same shape, proportions, label, colors. Do NOT distort or modify the product.");
  } else if ((scores.product_fidelity_risk ?? 0) > 5) {
    adjustments.push("Preserve exact product proportions, label placement, and packaging shape.");
  }

  // Low perspective coherence → simplify scene
  if ((scores.perspective_coherent ?? 10) < 3) {
    adjustments.push("SIMPLIFY the scene. Use a single consistent camera angle. All elements must share the same vanishing point and perspective. Avoid complex multi-plane compositions.");
  } else if ((scores.perspective_coherent ?? 10) < 5) {
    adjustments.push("Ensure consistent perspective across all scene elements. Single vanishing point.");
  }

  // Low safe zone usability → enlarge safe zone
  if ((scores.safe_zone_usable ?? 10) < 4) {
    adjustments.push("ENLARGE the empty space reserved for text overlay. At least 30% of the frame must be clean, uncluttered space suitable for headline placement. Push scene elements away from the text zone.");
  } else if ((scores.safe_zone_usable ?? 10) < 6) {
    adjustments.push("Ensure the text overlay zone is clearly empty — no products, props, or busy patterns in that area.");
  }

  if (adjustments.length === 0) {
    // Generic improvement if no specific score issue
    adjustments.push("Improve overall image quality. Ensure natural lighting, coherent perspective, and clear safe zones for text.");
  }

  const adjustmentSuffix = "\n\n=== RETRY CORRECTIONS ===\n" + adjustments.join("\n");

  return {
    ...originalPrompt,
    prompt_for_model: originalPrompt.prompt_for_model + adjustmentSuffix,
    edit_prompt_round_2: originalPrompt.edit_prompt_round_2,
  };
}

// ─── V2 COMPAT (for pipeline backward compat) ──────────────

/** @deprecated Use buildPromptV3 instead */
export function buildPrompt(
  brief: CreativeBrief,
  direction: ArtDirection | null,
  context: FilteredContext,
  references: SelectedReference[],
  aspectRatio: string,
  _completeAd?: { copyAssets: CopyAssets; brandName: string }
): BuiltPrompt {
  let promptForModel: string;
  let editPrompt: string;

  if (brief.renderMode === "product_first" && direction) {
    promptForModel = buildProductFirstPass1(brief, direction, context);
    editPrompt = buildProductFirstPass2(brief, direction);
  } else if (direction) {
    promptForModel = buildLegacyPass1(brief, direction, context);
    editPrompt = buildLegacyPass2(brief, direction, context);
  } else {
    promptForModel = buildLegacyScene(brief, context, references);
    editPrompt = "";
  }

  return {
    prompt_for_model: promptForModel,
    edit_prompt_round_2: editPrompt,
    selected_reference_images: references,
    image_generation_config: buildGenerationConfig(aspectRatio),
  };
}

/** @deprecated Use buildPromptBatchV3 instead */
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

// ─── LEGACY PROMPT BUILDERS (v2 compat) ─────────────────────

function buildLegacyScene(
  brief: CreativeBrief,
  context: FilteredContext,
  references: SelectedReference[]
): string {
  const parts: string[] = [];

  const styleMap: Record<string, string> = {
    photorealistic: "Ultra-high quality advertising photography, 8K, professional lighting.",
    stylized_photo: "Cinematic commercial photography, dramatic studio lighting, high contrast.",
    editorial: "High-end editorial photography, magazine quality, art-directed.",
    graphic_design: "Bold graphic design composition, clean geometric shapes, vibrant.",
    mixed_media: "Creative mixed media, photography blended with graphic elements.",
  };
  parts.push(styleMap[brief.realism_target] || styleMap.photorealistic);

  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (hasProductRef) {
    parts.push("Reproduce the EXACT product from the reference photo — same packaging, colors, logo, shape.");
  }

  parts.push(brief.single_visual_idea);
  parts.push(`${context.product_name} clearly visible, naturally integrated with real shadows.`);
  parts.push(`Clear empty space at ${brief.copy_safe_zone || "top"} for overlay.`);
  parts.push("Single focal point, clean composition.");

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;
}

function buildLegacyPass1(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(brief.single_visual_idea + ".");

  if (direction.product_role !== "absent") {
    parts.push(`${context.product_name} as ${direction.product_role} element. ${context.product_key_benefit}.`);
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

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH);
}

function buildLegacyPass2(
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

function buildProductFirstPass1(
  brief: CreativeBrief,
  direction: ArtDirection,
  context: FilteredContext
): string {
  const parts: string[] = [];

  parts.push(`Professional product photography: ${context.product_name}. ${brief.single_visual_idea}.`);
  parts.push(`Exact product reproduction from reference — accurate packaging, logo, colors, materials (${direction.texture_priority}).`);

  const anchoring = direction.product_anchoring;
  if (anchoring) {
    parts.push(
      `Product at ${anchoring.position}, ~${Math.round(anchoring.scale * 100)}% of frame.${anchoring.contact_shadow_required ? " Natural contact shadow." : ""}`
    );
  }

  parts.push(`${direction.environment}. ${direction.lighting}.`);
  parts.push(`${direction.camera}. Sharp focus on product, soft background.`);
  parts.push(`${direction.color_direction}.`);

  parts.push(`Clear space at ${direction.safe_zone.position} for text. No text in image.`);

  if (direction.avoid.length > 0) {
    parts.push(`Avoid: ${direction.avoid.slice(0, 3).join(", ")}.`);
  }

  return condensePrompt(parts.join(" "), MAX_PHOTO_LENGTH);
}

function buildProductFirstPass2(
  brief: CreativeBrief,
  direction: ArtDirection,
): string {
  return [
    `Extend scene around product: ${direction.environment}. Keep product unchanged.`,
    `Match perspective and lighting. ${direction.color_direction}.`,
    `Maintain clear space at ${direction.safe_zone.position}. No text.`,
  ].join(" ");
}
