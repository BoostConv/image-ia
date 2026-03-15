import type { LayoutTemplate } from "./types";

// ============================================================
// LAYOUT TEMPLATES v3 — Aligned on LayoutFamily taxonomy
//
// Each template ID matches a LayoutFamily value from taxonomy.ts.
// Selection is now DIRECT: concept.layout_family → template ID.
//
// 10 templates × LayoutZone positions in % of canvas.
// Zones are placed by the Composer with collision detection.
// ============================================================

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  // ─── 1. left_copy_right_product ─────────────────────────
  // Copy stack (headline + proof + CTA) on the left, product hero on the right.
  // Good for: problem_solution, objection_crusher, comparison.
  {
    id: "left_copy_right_product",
    name: "Left Copy, Right Product",
    zones: [
      {
        id: "product",
        x: 50,
        y: 10,
        width: 45,
        height: 80,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
      {
        id: "headline",
        x: 5,
        y: 12,
        width: 42,
        height: 28,
        minFontSize: 44,
        maxFontSize: 68,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "proof",
        x: 5,
        y: 44,
        width: 42,
        height: 15,
        minFontSize: 22,
        maxFontSize: 30,
        fontWeight: "normal",
        alignment: "left",
        priority: 6,
      },
      {
        id: "cta",
        x: 5,
        y: 66,
        width: 38,
        height: 12,
        minFontSize: 26,
        maxFontSize: 38,
        fontWeight: "bold",
        alignment: "left",
        priority: 8,
      },
      {
        id: "badge",
        x: 5,
        y: 82,
        width: 30,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "left",
        priority: 4,
      },
    ],
    safeZonePosition: "left",
    productAnchor: "right",
  },

  // ─── 2. center_hero_top_claim ───────────────────────────
  // Product/scene hero center, headline at top, CTA at bottom.
  // Universal layout — works for most ad types.
  {
    id: "center_hero_top_claim",
    name: "Center Hero, Top Claim",
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
    safeZonePosition: "top",
  },

  // ─── 3. split_screen ────────────────────────────────────
  // Left/right split — ideal for before/after, comparison.
  {
    id: "split_screen",
    name: "Split Screen",
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
    safeZonePosition: "top",
  },

  // ─── 4. card_stack ──────────────────────────────────────
  // Stacked card modules — centered, layered look.
  // Good for: offer_led, objection_crusher, ingredient_spotlight.
  {
    id: "card_stack",
    name: "Card Stack",
    zones: [
      {
        id: "headline",
        x: 10,
        y: 22,
        width: 80,
        height: 20,
        minFontSize: 48,
        maxFontSize: 76,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "proof",
        x: 15,
        y: 45,
        width: 70,
        height: 12,
        minFontSize: 22,
        maxFontSize: 30,
        fontWeight: "normal",
        alignment: "center",
        priority: 6,
      },
      {
        id: "subtitle",
        x: 15,
        y: 58,
        width: 70,
        height: 8,
        minFontSize: 20,
        maxFontSize: 26,
        fontWeight: "normal",
        alignment: "center",
        priority: 5,
      },
      {
        id: "cta",
        x: 25,
        y: 72,
        width: 50,
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
        y: 86,
        width: 30,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "center",
        priority: 4,
      },
    ],
    safeZonePosition: "bottom",
    productAnchor: "center",
  },

  // ─── 5. quote_frame ─────────────────────────────────────
  // Testimonial/quote-focused layout — proof at top, headline at bottom.
  // Good for: testimonial, ugc_hybrid, social_proof.
  {
    id: "quote_frame",
    name: "Quote Frame",
    zones: [
      {
        id: "proof",
        x: 5,
        y: 5,
        width: 90,
        height: 14,
        minFontSize: 28,
        maxFontSize: 42,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "headline",
        x: 5,
        y: 78,
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
        y: 80,
        width: 27,
        height: 10,
        minFontSize: 24,
        maxFontSize: 34,
        fontWeight: "bold",
        alignment: "center",
        priority: 7,
      },
      {
        id: "badge",
        x: 5,
        y: 92,
        width: 25,
        height: 6,
        minFontSize: 14,
        maxFontSize: 20,
        fontWeight: "normal",
        alignment: "left",
        priority: 4,
      },
    ],
    safeZonePosition: "top",
  },

  // ─── 6. badge_cluster ───────────────────────────────────
  // Badge/proof elements prominent — corner badges + bottom bar.
  // Good for: proof_demo, ingredient_spotlight, certification.
  {
    id: "badge_cluster",
    name: "Badge Cluster",
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
        id: "proof",
        x: 5,
        y: 18,
        width: 35,
        height: 8,
        minFontSize: 18,
        maxFontSize: 24,
        fontWeight: "normal",
        alignment: "left",
        priority: 6,
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
    safeZonePosition: "bottom",
    productAnchor: "center",
  },

  // ─── 7. vertical_story_stack ────────────────────────────
  // Vertical flow — caption strip at bottom, image fills most of frame.
  // Good for: editorial, ugc_hybrid, character-driven ads.
  {
    id: "vertical_story_stack",
    name: "Vertical Story Stack",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 73,
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
        y: 84,
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
        y: 84,
        width: 30,
        height: 7,
        minFontSize: 24,
        maxFontSize: 32,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "forbidden",
        x: 0,
        y: 0,
        width: 100,
        height: 70,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
    ],
    safeZonePosition: "bottom",
  },

  // ─── 8. diagonal_split ──────────────────────────────────
  // Dynamic diagonal composition — impact center with bold text.
  // Good for: before_after, comparison, visual_metaphor.
  {
    id: "diagonal_split",
    name: "Diagonal Split",
    zones: [
      {
        id: "forbidden",
        x: 0,
        y: 0,
        width: 100,
        height: 18,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
      {
        id: "headline",
        x: 10,
        y: 20,
        width: 80,
        height: 22,
        minFontSize: 52,
        maxFontSize: 80,
        fontWeight: "bold",
        alignment: "center",
        priority: 9,
      },
      {
        id: "proof",
        x: 15,
        y: 46,
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
        y: 66,
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
        y: 82,
        width: 30,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "center",
        priority: 4,
      },
    ],
    safeZonePosition: "bottom",
    productAnchor: "center",
  },

  // ─── 9. hero_with_bottom_offer ──────────────────────────
  // Thin bar at bottom — headline + CTA. Image dominates.
  // Good for: offer_led, benefit_closeup, editorial.
  {
    id: "hero_with_bottom_offer",
    name: "Hero with Bottom Offer",
    zones: [
      {
        id: "headline",
        x: 5,
        y: 80,
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
        y: 80,
        width: 25,
        height: 10,
        minFontSize: 24,
        maxFontSize: 36,
        fontWeight: "bold",
        alignment: "center",
        priority: 8,
      },
      {
        id: "badge",
        x: 5,
        y: 5,
        width: 25,
        height: 8,
        minFontSize: 18,
        maxFontSize: 24,
        fontWeight: "bold",
        alignment: "center",
        priority: 5,
      },
      {
        id: "forbidden",
        x: 0,
        y: 15,
        width: 100,
        height: 62,
        minFontSize: 0,
        maxFontSize: 0,
        fontWeight: "normal",
        alignment: "center",
        priority: 10,
      },
    ],
    safeZonePosition: "bottom",
  },

  // ─── 10. macro_with_side_copy ───────────────────────────
  // Macro/close-up product right, copy stack left.
  // Good for: ingredient_spotlight, benefit_closeup, proof_demo.
  {
    id: "macro_with_side_copy",
    name: "Macro with Side Copy",
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
        width: 42,
        height: 25,
        minFontSize: 44,
        maxFontSize: 68,
        fontWeight: "bold",
        alignment: "left",
        priority: 9,
      },
      {
        id: "proof",
        x: 5,
        y: 44,
        width: 42,
        height: 15,
        minFontSize: 22,
        maxFontSize: 30,
        fontWeight: "normal",
        alignment: "left",
        priority: 6,
      },
      {
        id: "cta",
        x: 5,
        y: 65,
        width: 38,
        height: 12,
        minFontSize: 26,
        maxFontSize: 38,
        fontWeight: "bold",
        alignment: "left",
        priority: 8,
      },
      {
        id: "badge",
        x: 5,
        y: 82,
        width: 30,
        height: 8,
        minFontSize: 16,
        maxFontSize: 22,
        fontWeight: "normal",
        alignment: "left",
        priority: 4,
      },
    ],
    safeZonePosition: "left",
    productAnchor: "right",
  },
];

// ─── SELECTION ─────────────────────────────────────────────

// ─── LAYOUT FAMILY → TEMPLATE MAPPING ────────────────────────
// Maps the 31 new layout families to the 10 existing template structures.
// This lets the composer reuse proven zone placements for similar layouts.

const LAYOUT_TO_TEMPLATE: Record<string, string> = {
  // Éducatifs
  story_sequence: "vertical_story_stack",
  listicle: "card_stack",
  annotation_callout: "macro_with_side_copy",
  flowchart: "vertical_story_stack",
  // Centrés Image
  hero_image: "center_hero_top_claim",
  product_focus: "center_hero_top_claim",
  product_in_context: "hero_with_bottom_offer",
  probleme_zoome: "macro_with_side_copy",
  golden_hour: "hero_with_bottom_offer",
  macro_detail: "macro_with_side_copy",
  action_shot: "center_hero_top_claim",
  ingredient_showcase: "badge_cluster",
  scale_shot: "split_screen",
  destruction_shot: "center_hero_top_claim",
  texture_fill: "hero_with_bottom_offer",
  negative_space: "left_copy_right_product",
  // Social Proof
  testimonial_card: "quote_frame",
  ugc_style: "quote_frame",
  press_as_seen_in: "badge_cluster",
  wall_of_love: "card_stack",
  statistique_data_point: "diagonal_split",
  tweet_post_screenshot: "quote_frame",
  // Comparatifs
  split_screen: "split_screen",
  timeline_compare: "split_screen",
  avant_apres: "split_screen",
  // Centrés Texte
  text_heavy: "diagonal_split",
  single_word: "diagonal_split",
  fill_the_blank: "diagonal_split",
  two_truths: "split_screen",
  manifesto: "diagonal_split",
  quote_card: "quote_frame",
};

/**
 * Select layout template by LayoutFamily (v3 — maps 31 families to 10 templates).
 * Falls back to center_hero_top_claim if no match.
 */
export function selectLayoutByFamily(layoutFamily: string): LayoutTemplate {
  // First try direct match (old template IDs)
  const direct = LAYOUT_TEMPLATES.find((t) => t.id === layoutFamily);
  if (direct) return direct;

  // Map new layout family to closest template
  const templateId = LAYOUT_TO_TEMPLATE[layoutFamily];
  if (templateId) {
    return LAYOUT_TEMPLATES.find((t) => t.id === templateId)
      || LAYOUT_TEMPLATES.find((t) => t.id === "center_hero_top_claim")!;
  }

  return LAYOUT_TEMPLATES.find((t) => t.id === "center_hero_top_claim")!;
}

/**
 * Select layout by overlay intent (v2 compat).
 * @deprecated Use selectLayoutByFamily instead.
 */
export function selectLayout(
  _archetype: string,
  overlayIntent: string,
  _aspectRatio: string
): LayoutTemplate {
  // Intent-based selection (v2 fallback)
  if (overlayIntent === "minimal") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "hero_with_bottom_offer")
      || LAYOUT_TEMPLATES.find((t) => t.id === "vertical_story_stack")!;
  }

  if (overlayIntent === "full_ad") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "card_stack")
      || LAYOUT_TEMPLATES.find((t) => t.id === "diagonal_split")!;
  }

  if (overlayIntent === "badge_proof") {
    return LAYOUT_TEMPLATES.find((t) => t.id === "badge_cluster")
      || LAYOUT_TEMPLATES.find((t) => t.id === "quote_frame")!;
  }

  // Default
  return LAYOUT_TEMPLATES.find((t) => t.id === "center_hero_top_claim")!;
}

/**
 * Get a simpler fallback template (fewer zones, less text).
 */
export function getFallbackTemplate(currentId: string): LayoutTemplate | null {
  const simplicity: Record<string, string | null> = {
    card_stack: "center_hero_top_claim",
    diagonal_split: "center_hero_top_claim",
    center_hero_top_claim: "hero_with_bottom_offer",
    left_copy_right_product: "badge_cluster",
    macro_with_side_copy: "badge_cluster",
    split_screen: "center_hero_top_claim",
    quote_frame: "hero_with_bottom_offer",
    badge_cluster: "hero_with_bottom_offer",
    vertical_story_stack: "hero_with_bottom_offer",
    hero_with_bottom_offer: null,
  };

  const fallbackId = simplicity[currentId];
  if (!fallbackId) return null;
  return LAYOUT_TEMPLATES.find((t) => t.id === fallbackId) ?? null;
}
