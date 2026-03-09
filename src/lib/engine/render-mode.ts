import type {
  CreativeBrief,
  FilteredContext,
  RenderMode,
  OverlayIntent,
  TextDensity,
} from "./types";

// ============================================================
// COMPONENT I: RENDER MODE ROUTER
// Deterministic assignment of renderMode, overlayIntent, textDensity.
// No AI call — pure mapping logic.
//
// Now based on marketing_angle + hook_type + realism_target
// instead of fixed archetype IDs.
// ============================================================

/**
 * Assign render mode based on hook type and context.
 * product_first: only when product fidelity is the main message.
 * scene_first: for everything creative/narrative (default).
 */
export function assignRenderMode(
  brief: CreativeBrief,
  _context: FilteredContext,
  hasProductImages: boolean
): RenderMode {
  // Product-first only for explicit product-showcase hooks with product images
  if (hasProductImages && brief.realism_target === "photorealistic") {
    // Only use product_first for angles that center on the product itself
    if (brief.marketing_angle === "objection" || brief.marketing_angle === "curiosity") {
      return "product_first";
    }
  }
  return "scene_first";
}

/**
 * Assign overlay intent based on marketing angle and hook type.
 */
export function assignOverlayIntent(brief: CreativeBrief): OverlayIntent {
  // Emotional and aspirational ads: let the image speak, minimal text
  if (
    brief.marketing_angle === "desire" ||
    brief.marketing_angle === "aspiration" ||
    brief.marketing_angle === "identity"
  ) {
    return "minimal";
  }

  // Social proof and urgency need proof badges
  if (
    brief.marketing_angle === "social_proof" ||
    brief.marketing_angle === "urgency"
  ) {
    return "badge_proof";
  }

  // Fear, objection, disruption need full ad treatment with clear messaging
  if (
    brief.marketing_angle === "fear" ||
    brief.marketing_angle === "objection" ||
    brief.marketing_angle === "disruption"
  ) {
    return "full_ad";
  }

  // Default: headline + CTA
  return "headline_cta";
}

/**
 * Assign text density based on marketing angle.
 */
export function assignTextDensity(brief: CreativeBrief): TextDensity {
  // Visual-first angles: let the scene speak
  if (
    brief.marketing_angle === "desire" ||
    brief.marketing_angle === "aspiration" ||
    brief.marketing_angle === "curiosity"
  ) {
    return "low";
  }

  // Rational angles: need text to support the argument
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
 * Assign all render properties to a brief in one call.
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
