import type {
  CreativeBrief,
  FilteredContext,
  RenderMode,
  OverlayIntent,
  TextDensity,
} from "./types";

// ============================================================
// COMPONENT I: RENDER MODE ROUTER (v2 — DEPRECATED)
//
// These v2 functions operate on CreativeBrief and are NO LONGER
// called by the v3 pipeline. The v3 equivalents live inside
// creative-planner.ts and operate on ConceptSpec:
//
//   - assignRenderModeV3(concept, hasProductImages) → RenderMode
//   - assignOverlayIntentV3(concept) → OverlayIntent
//   - assignTextDensityV3(concept) → TextDensity
//
// The v3 versions use closed taxonomies (render_family,
// format_family, awareness_stage) instead of free-form
// marketing_angle strings.
//
// These v2 functions are kept ONLY for backward compatibility
// with code paths that still use CreativeBrief (e.g. concept-adapter).
// They will be removed once all downstream consumers migrate to v3.
// ============================================================

/**
 * @deprecated Use assignRenderModeV3 in creative-planner.ts instead.
 * v3 uses ConceptSpec.render_family + product_role for routing.
 */
export function assignRenderMode(
  brief: CreativeBrief,
  _context: FilteredContext,
  hasProductImages: boolean
): RenderMode {
  if (hasProductImages && brief.realism_target === "photorealistic") {
    if (brief.marketing_angle === "objection" || brief.marketing_angle === "curiosity") {
      return "product_first";
    }
  }
  return "scene_first";
}

/**
 * @deprecated Use assignOverlayIntentV3 in creative-planner.ts instead.
 * v3 maps directly from format_family + awareness_stage.
 */
export function assignOverlayIntent(brief: CreativeBrief): OverlayIntent {
  if (
    brief.marketing_angle === "desire" ||
    brief.marketing_angle === "aspiration" ||
    brief.marketing_angle === "identity"
  ) {
    return "minimal";
  }

  if (
    brief.marketing_angle === "social_proof" ||
    brief.marketing_angle === "urgency"
  ) {
    return "badge_proof";
  }

  if (
    brief.marketing_angle === "fear" ||
    brief.marketing_angle === "objection" ||
    brief.marketing_angle === "disruption"
  ) {
    return "full_ad";
  }

  return "headline_cta";
}

/**
 * @deprecated Use assignTextDensityV3 in creative-planner.ts instead.
 * v3 maps directly from format_family.
 */
export function assignTextDensity(brief: CreativeBrief): TextDensity {
  if (
    brief.marketing_angle === "desire" ||
    brief.marketing_angle === "aspiration" ||
    brief.marketing_angle === "curiosity"
  ) {
    return "low";
  }

  if (
    brief.marketing_angle === "objection" ||
    brief.marketing_angle === "fear" ||
    brief.marketing_angle === "social_proof"
  ) {
    return "medium";
  }

  return "medium";
}

/**
 * @deprecated Use ConceptSpec fields directly — render_mode, overlay_intent,
 * text_density are set by the v3 planner at concept creation time.
 */
export function assignRenderProperties(
  brief: CreativeBrief,
  context: FilteredContext,
  hasProductImages: boolean
): CreativeBrief {
  return {
    ...brief,
    renderMode: assignRenderMode(brief, context, hasProductImages),
    overlayIntent: assignOverlayIntent(brief),
    textDensity: assignTextDensity(brief),
  };
}
