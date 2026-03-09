import type { LayoutTemplate, CreativeArchetypeId } from "./types";

// ============================================================
// LAYOUT TEMPLATES — 10 templates for the Composer
// Each template = array of LayoutZone with positions in %
// of canvas + margins + priority. Zones are placed by the
// Composer and collision-detected.
//
// Updated for narrative archetypes.
// ============================================================

const ALL_ARCHETYPES: CreativeArchetypeId[] = [
  "immersive_world",
  "epic_confrontation",
  "character_adventure",
  "surreal_scale",
  "luxury_staging",
  "pop_culture_twist",
  "sensory_explosion",
  "absurd_humor",
  "emotional_snapshot",
  "graphic_statement",
  "transformation_story",
  "social_proof_scene",
];

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // 1. Hero Headline Right — product left, headline + CTA right
  {
    id: "hero_headline_right",
    name: "Hero Headline Right",
    zones: [
      {
        id: "product",
        x: 5,
        y: 15,
        width: 45,
        height: 70,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
      {
        id: "headline",
        x: 55,
        y: 15,
        width: 40,
        height: 30,
        minFontSize: 48,
        maxFontSize: 72,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "proof",
        x: 55,
        y: 48,
        width: 40,
        height: 15,
        minFontSize: 24,
        maxFontSize: 32,
        fontWeight: "normal",
        alignment: "left",
        priority: 6,
      },
      {
        id: "cta",
        x: 55,
        y: 70,
        width: 35,
        height: 12,
        minFontSize: 28,
        maxFontSize: 40,
        fontWeight: "bold",
        alignment: "left",
        priority: 8,
      },
      {
        id: "badge",
        x: 55,
        y: 85,
        width: 25,
        height: 8,
        minFontSize: 18,
        maxFontSize: 24,
        fontWeight: "normal",
        alignment: "left",
        priority: 4,
      },
    ],
    applicableTo: ["luxury_staging", "sensory_explosion", "graphic_statement"],
    safeZonePosition: "right",
    productAnchor: "left",
  },

  // 2. Hero Headline Left — inverse of above
  {
    id: "hero_headline_left",
    name: "Hero Headline Left",
    zones: [
      {
        id: "product",
        x: 50,
        y: 15,
        width: 45,
        height: 70,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
      {
        id: "headline",
        x: 5,
        y: 15,
        width: 40,
        height: 30,
        minFontSize: 48,
        maxFontSize: 72,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "proof",
        x: 5,
        y: 48,
        width: 40,
        height: 15,
        minFontSize: 24,
        maxFontSize: 32,
        fontWeight: "normal",
        alignment: "left",
        priority: 6,
      },
      {
        id: "cta",
        x: 5,
        y: 70,
        width: 35,
        height: 12,
        minFontSize: 28,
        maxFontSize: 40,
        fontWeight: "bold",
        alignment: "left",
        priority: 8,
      },
      {
        id: "badge",
        x: 5,
        y: 85,
        width: 25,
        height: 8,
        minFontSize: 18,
        maxFontSize: 24,
        fontWeight: "normal",
        alignment: "left",
        priority: 4,
      },
    ],
    applicableTo: ["luxury_staging", "epic_confrontation", "surreal_scale"],
    safeZonePosition: "left",
    productAnchor: "right",
  },

  // 3. Minimal Bottom Bar — thin bar at bottom (headline + CTA)
  {
    id: "minimal_bottom_bar",
    name: "Minimal Bottom Bar",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 82,
        width: 60,
        height: 10,
        minFontSize: 36,
        maxFontSize: 52,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "cta",
        x: 70,
        y: 82,
        width: 25,
        height: 10,
        minFontSize: 24,
        maxFontSize: 36,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "forbidden",
        x: 0,
        y: 0,
        width: 100,
        height: 78,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
    ],
    applicableTo: ["immersive_world", "character_adventure", "emotional_snapshot"],
    safeZonePosition: "bottom",
  },

  // 4. Split Comparison — left/right (transformation)
  {
    id: "split_comparison",
    name: "Split Comparison",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 5,
        width: 90,
        height: 12,
        minFontSize: 40,
        maxFontSize: 60,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "subtitle",
        x: 5,
        y: 20,
        width: 40,
        height: 8,
        minFontSize: 20,
        maxFontSize: 28,
        fontWeight: "normal",
        alignment: "center",
        priority: 5,
      },
      {
        id: "proof",
        x: 55,
        y: 20,
        width: 40,
        height: 8,
        minFontSize: 20,
        maxFontSize: 28,
        fontWeight: "normal",
        alignment: "center",
        priority: 6,
      },
      {
        id: "cta",
        x: 30,
        y: 88,
        width: 40,
        height: 8,
        minFontSize: 28,
        maxFontSize: 36,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
    ],
    applicableTo: ["transformation_story", "epic_confrontation", "surreal_scale"],
    safeZonePosition: "top",
  },

  // 5. Top Headline Bottom CTA — universal
  {
    id: "top_headline_bottom_cta",
    name: "Top Headline Bottom CTA",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 5,
        width: 90,
        height: 15,
        minFontSize: 48,
        maxFontSize: 72,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "proof",
        x: 10,
        y: 22,
        width: 80,
        height: 8,
        minFontSize: 22,
        maxFontSize: 28,
        fontWeight: "normal",
        alignment: "center",
        priority: 6,
      },
      {
        id: "cta",
        x: 25,
        y: 85,
        width: 50,
        height: 10,
        minFontSize: 30,
        maxFontSize: 42,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "badge",
        x: 75,
        y: 5,
        width: 20,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "bold",
        alignment: "center",
        priority: 4,
      },
    ],
    applicableTo: ALL_ARCHETYPES,
    safeZonePosition: "top",
  },

  // 6. Full Overlay — gradient + centered text
  {
    id: "full_overlay",
    name: "Full Overlay",
    zones: [
      {
        id: "headline",
        x: 10,
        y: 30,
        width: 80,
        height: 20,
        minFontSize: 52,
        maxFontSize: 80,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "subtitle",
        x: 15,
        y: 52,
        width: 70,
        height: 10,
        minFontSize: 24,
        maxFontSize: 36,
        fontWeight: "normal",
        alignment: "center",
        priority: 5,
      },
      {
        id: "cta",
        x: 30,
        y: 72,
        width: 40,
        height: 10,
        minFontSize: 28,
        maxFontSize: 40,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "badge",
        x: 35,
        y: 85,
        width: 30,
        height: 7,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "center",
        priority: 4,
      },
    ],
    applicableTo: ["pop_culture_twist", "absurd_humor", "graphic_statement"],
    safeZonePosition: "bottom",
  },

  // 7. Badge Corner — focus product + badge in corner
  {
    id: "badge_corner",
    name: "Badge Corner",
    zones: [
      {
        id: "badge",
        x: 5,
        y: 5,
        width: 30,
        height: 10,
        minFontSize: 20,
        maxFontSize: 28,
        fontWeight: "bold",
        alignment: "center",
        priority: 7,
      },
      {
        id: "headline",
        x: 5,
        y: 78,
        width: 65,
        height: 12,
        minFontSize: 40,
        maxFontSize: 56,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "cta",
        x: 72,
        y: 80,
        width: 23,
        height: 10,
        minFontSize: 24,
        maxFontSize: 32,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
    ],
    applicableTo: ["luxury_staging", "sensory_explosion", "social_proof_scene"],
    safeZonePosition: "bottom",
    productAnchor: "center",
  },

  // 8. Social Proof Banner — proof/testimonial at top
  {
    id: "social_proof_banner",
    name: "Social Proof Banner",
    zones: [
      {
        id: "proof",
        x: 5,
        y: 5,
        width: 90,
        height: 12,
        minFontSize: 28,
        maxFontSize: 40,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "headline",
        x: 5,
        y: 80,
        width: 60,
        height: 12,
        minFontSize: 36,
        maxFontSize: 52,
        fontWeight: "bold",
        alignment: "left",
        priority: 8,
      },
      {
        id: "cta",
        x: 68,
        y: 82,
        width: 27,
        height: 10,
        minFontSize: 24,
        maxFontSize: 34,
        fontWeight: "bold",
        alignment: "center",
        priority: 7,
      },
    ],
    applicableTo: ["social_proof_scene", "emotional_snapshot", "absurd_humor"],
    safeZonePosition: "top",
  },

  // 9. Lifestyle Caption — caption strip at bottom
  {
    id: "lifestyle_caption",
    name: "Lifestyle Caption",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 75,
        width: 90,
        height: 10,
        minFontSize: 36,
        maxFontSize: 52,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "subtitle",
        x: 10,
        y: 86,
        width: 50,
        height: 7,
        minFontSize: 20,
        maxFontSize: 28,
        fontWeight: "normal",
        alignment: "left",
        priority: 5,
      },
      {
        id: "cta",
        x: 65,
        y: 86,
        width: 30,
        height: 7,
        minFontSize: 24,
        maxFontSize: 32,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
    ],
    applicableTo: ["character_adventure", "emotional_snapshot", "pop_culture_twist", "immersive_world"],
    safeZonePosition: "bottom",
  },

  // 10. Impact Center — bold central text (for graphic/statement)
  {
    id: "impact_center",
    name: "Impact Center",
    zones: [
      {
        id: "forbidden",
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
      {
        id: "headline",
        x: 10,
        y: 22,
        width: 80,
        height: 25,
        minFontSize: 52,
        maxFontSize: 80,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "proof",
        x: 15,
        y: 50,
        width: 70,
        height: 12,
        minFontSize: 22,
        maxFontSize: 28,
        fontWeight: "normal",
        alignment: "center",
        priority: 6,
      },
      {
        id: "cta",
        x: 25,
        y: 70,
        width: 50,
        height: 10,
        minFontSize: 26,
        maxFontSize: 36,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "badge",
        x: 35,
        y: 85,
        width: 30,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "center",
        priority: 4,
      },
    ],
    applicableTo: ["graphic_statement", "surreal_scale", "transformation_story", "epic_confrontation"],
    safeZonePosition: "bottom",
    productAnchor: "center",
  },
];

/**
 * Select the best layout template based on overlay intent.
 * Since archetypes are now free strings, selection is driven
 * entirely by the overlay intent and safe zone position.
 */
export function selectLayout(
  _archetype: string,
  overlayIntent: string,
  _aspectRatio: string
): LayoutTemplate {
  // Intent-based selection (no archetype matching needed)
  if (overlayIntent === "minimal") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "minimal_bottom_bar")
      || LAYOUT_TEMPLATES.find((t) => t.id === "lifestyle_caption")!;
  }

  if (overlayIntent === "full_ad") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "full_overlay")
      || LAYOUT_TEMPLATES.find((t) => t.id === "impact_center")!;
  }

  if (overlayIntent === "badge_proof") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "badge_corner")
      || LAYOUT_TEMPLATES.find((t) => t.id === "social_proof_banner")!;
  }

  // Default: top_headline_bottom_cta (universal)
  return LAYOUT_TEMPLATES.find((t) => t.id === "top_headline_bottom_cta")!;
}

/**
 * Get a simpler fallback template (fewer zones, less text).
 */
export function getFallbackTemplate(currentId: string): LayoutTemplate | null {
  const simplicity: Record<string, string> = {
    full_overlay: "top_headline_bottom_cta",
    top_headline_bottom_cta: "minimal_bottom_bar",
    hero_headline_right: "badge_corner",
    hero_headline_left: "badge_corner",
    split_comparison: "top_headline_bottom_cta",
    impact_center: "top_headline_bottom_cta",
    social_proof_banner: "minimal_bottom_bar",
    badge_corner: "minimal_bottom_bar",
    lifestyle_caption: "minimal_bottom_bar",
    minimal_bottom_bar: null as unknown as string,
  };

  const fallbackId = simplicity[currentId];
  if (!fallbackId) return null;
  return LAYOUT_TEMPLATES.find((t) => t.id === fallbackId) ?? null;
}
