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

const MAX_AD_FOCUSED_LENGTH = 1200;

export interface AdFocusedPromptInput {
  concept: ConceptSpec;
  direction: AdDirectorSpec;
  context: FilteredContext;
  references: SelectedReference[];
  aspectRatio: string;
  layoutInspiration?: Buffer;
  brandStyleImages?: Buffer[];
  layoutFamily: LayoutFamily;
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

  // === AD MISSION ===
  parts.push("=== AD MISSION ===");
  parts.push(`Job: ${concept.ad_job} — Meta ads visual for ${context.format_goal}.`);
  parts.push(`Purpose: Quand la personne voit cette image, elle comprend immediatement que ${extractBeliefTo(concept.belief_shift)}.`);
  parts.push(`Belief Shift: FROM "${extractBeliefFrom(concept.belief_shift)}" → TO "${extractBeliefTo(concept.belief_shift)}".`);

  // === LAYOUT STRUCTURE ===
  parts.push("");
  parts.push("=== LAYOUT STRUCTURE ===");
  parts.push(`Type: ${formatLayoutFamily(layoutFamily)} (see layout reference image attached).`);
  parts.push(`Grid: ${direction.grid_system}.`);
  parts.push(`Reading Order: ${direction.reading_order}.`);
  parts.push(`Eye Path: ${direction.eye_path}.`);

  // Safe zones
  const overlayMap = direction.overlay_map;
  parts.push(`Safe Zones: Headline at ${overlayMap.headline_zone}, CTA at ${overlayMap.cta_zone}.`);
  if (overlayMap.forbidden_zones.length > 0) {
    parts.push(`FORBIDDEN: Never place elements in ${overlayMap.forbidden_zones.join(", ")}.`);
  }

  // === VISUAL FOCUS ===
  parts.push("");
  parts.push("=== VISUAL FOCUS ===");
  parts.push(`Attention Anchor: ${direction.attention_anchor} (ce que l'oeil voit en premier).`);
  parts.push(`Product Role: ${concept.product_role} at ${direction.product_placement}.`);
  if (direction.product_scale > 0) {
    parts.push(`Product Scale: ~${Math.round(direction.product_scale * 100)}% of frame.`);
  }

  // Product fidelity from reference
  const hasProductRef = references.some(
    (r) => r.role === "product_fidelity" || r.role === "packaging" || r.role === "texture_material"
  );
  if (hasProductRef && concept.product_role !== "absent") {
    parts.push(`EXACT product from reference: same packaging, colors, label, shape. ${context.product_name}.`);
  }

  // === SCENE ===
  parts.push("");
  parts.push("=== SCENE ===");
  parts.push(`Visual Device: ${concept.visual_device}.`);
  parts.push(`Environment: ${direction.environment}.`);
  parts.push(`Lighting: ${direction.lighting.split(".")[0]}.`);
  parts.push(`Mood: ${inferMood(concept, direction)}.`);
  parts.push(`Colors: ${direction.color_direction.split(".")[0]}.`);

  // Props if relevant
  if (direction.prop_list.length > 0) {
    parts.push(`Props: ${direction.prop_list.slice(0, 3).join(", ")}.`);
  }

  // === REFERENCE USAGE ===
  parts.push("");
  parts.push("=== REFERENCE USAGE ===");

  const hasLayoutRef = references.some(r => r.role === "layout_structure");
  if (hasLayoutRef || input.layoutInspiration) {
    parts.push("LAYOUT REF: Respecter la structure et proportions de l'image layout attachee.");
  }

  if (hasProductRef) {
    parts.push("PRODUCT REF: Reproduction exacte du packaging, couleurs, forme.");
  }

  const hasBrandStyle = references.some(r => r.role === "brand_style" || r.role === "style_mood");
  if (hasBrandStyle || (input.brandStyleImages && input.brandStyleImages.length > 0)) {
    parts.push("BRAND STYLE: S'inspirer du style visuel des images marque attachees.");
  }

  // === ASPECT RATIO CONSTRAINTS ===
  if (aspectRatio === "9:16") {
    parts.push("");
    parts.push("=== STORIES/REELS CONSTRAINTS ===");
    parts.push("Top 15% and bottom 20% may be cut off - keep critical elements in center 65%.");
    parts.push("Vertical composition, eye flows top to bottom.");
  }

  // === NEVER (avoid list) ===
  parts.push("");
  parts.push("=== NEVER ===");
  if (direction.avoid.length > 0) {
    parts.push(direction.avoid.join(", ") + ".");
  }
  parts.push("No text, no typography, no words, no letters, no fake logos outside the real product, no watermark.");

  // Condense and add suffix
  const promptText = condensePrompt(parts.join("\n"), MAX_AD_FOCUSED_LENGTH - IMAGE_RULES_SUFFIX.length) + IMAGE_RULES_SUFFIX;

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

  // Enforce safe zones
  edits.push(
    `Ensure ${direction.safe_zone.percentage}% empty space at ${direction.safe_zone.position} for text overlay. No text anywhere.`
  );

  // Color refinement
  if (direction.color_direction.length > 10) {
    edits.push(`Colors: ${direction.color_direction.slice(0, 80)}.`);
  }

  // Reading order check
  edits.push(`Verify eye path: ${direction.eye_path}.`);

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
 */
function extractBeliefFrom(beliefShift: string): string {
  const match = beliefShift.match(/FROM\s*["""]?(.+?)["""]?\s*→/i);
  if (match) return match[1].trim();

  // Try splitting by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) return parts[0].replace(/FROM/i, "").trim();

  return "une croyance limitante";
}

/**
 * Extract "to" part of belief shift.
 */
function extractBeliefTo(beliefShift: string): string {
  const match = beliefShift.match(/→\s*TO\s*["""]?(.+?)["""]?$/i);
  if (match) return match[1].trim();

  // Try splitting by →
  const parts = beliefShift.split("→");
  if (parts.length >= 2) return parts[parts.length - 1].replace(/TO/i, "").trim();

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
  } = input;

  return concepts.map((concept, i) => {
    const direction = directions[i];
    const references = referencesByIndex[i] || [];
    const layoutFamily = layoutFamilies[i] || concept.layout_family;
    const layoutInspiration = layoutInspirations?.[i];

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
    });
  });
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
