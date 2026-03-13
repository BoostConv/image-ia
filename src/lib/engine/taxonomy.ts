// ============================================================
// TAXONOMY — Closed, controlled taxonomies for agency-grade ads
//
// Every value here is INTENTIONAL. No free strings.
// The pipeline picks from these lists. Claude MUST choose
// from them. This enables:
//   - Repeatability (same input → same structure)
//   - Learning (track which combos perform)
//   - Brand safety (style policies filter by taxonomy)
//   - Diversity control (ensure batch variety)
// ============================================================

// ─── AD JOB — The #1 strategic layer ────────────────────────
// What is this ad's PRIMARY mission in the funnel?

export type AdJob =
  | "scroll_stop"       // Interrupt the feed. Curiosity, shock, beauty.
  | "educate"           // Teach something. Mechanism, ingredient, problem.
  | "prove"             // Demonstrate proof. Testimonial, data, demo.
  | "handle_objection"  // Bust a myth. Counter a reason NOT to buy.
  | "convert_offer";    // Close the deal. Offer, urgency, CTA.

export const AD_JOBS: AdJob[] = [
  "scroll_stop", "educate", "prove", "handle_objection", "convert_offer",
];

// ─── FORMAT FAMILY — The ad's structural blueprint ──────────
// Each format = a specific advertising JOB expressed visually.

export type FormatFamily =
  | "problem_solution"
  | "proof_demo"
  | "offer_led"
  | "testimonial"
  | "comparison"
  | "editorial"
  | "ugc_hybrid"
  | "visual_metaphor"
  | "objection_crusher"
  | "ingredient_spotlight"
  | "benefit_closeup"
  | "before_after";

export const FORMAT_FAMILIES: FormatFamily[] = [
  "problem_solution", "proof_demo", "offer_led", "testimonial",
  "comparison", "editorial", "ugc_hybrid", "visual_metaphor",
  "objection_crusher", "ingredient_spotlight", "benefit_closeup", "before_after",
];

// ─── LAYOUT FAMILY — How the ad is visually composed ────────

export type LayoutFamily =
  | "left_copy_right_product"
  | "center_hero_top_claim"
  | "split_screen"
  | "card_stack"
  | "quote_frame"
  | "badge_cluster"
  | "vertical_story_stack"
  | "diagonal_split"
  | "hero_with_bottom_offer"
  | "macro_with_side_copy";

export const LAYOUT_FAMILIES: LayoutFamily[] = [
  "left_copy_right_product", "center_hero_top_claim", "split_screen",
  "card_stack", "quote_frame", "badge_cluster", "vertical_story_stack",
  "diagonal_split", "hero_with_bottom_offer", "macro_with_side_copy",
];

// ─── PROOF MECHANISM — How the ad proves its claim ──────────

export type ProofMechanism =
  | "ingredient"
  | "mechanism"
  | "texture"
  | "transformation"
  | "social_proof"
  | "authority"
  | "comparison"
  | "data"
  | "offer"
  | "certification";

export const PROOF_MECHANISMS: ProofMechanism[] = [
  "ingredient", "mechanism", "texture", "transformation", "social_proof",
  "authority", "comparison", "data", "offer", "certification",
];

// ─── RUPTURE STRUCTURE — The visual device that stops scroll ─

export type RuptureStructure =
  | "hyper_scale"
  | "frozen_explosion"
  | "hybrid_fusion"
  | "dry_levitation"
  | "cutaway"
  | "mirror_symmetry"
  | "radical_minimalism"
  | "anachronism"
  | "macro_texture"
  | "visual_humor";

export const RUPTURE_STRUCTURES: RuptureStructure[] = [
  "hyper_scale", "frozen_explosion", "hybrid_fusion", "dry_levitation",
  "cutaway", "mirror_symmetry", "radical_minimalism", "anachronism",
  "macro_texture", "visual_humor",
];

// ─── GRAPHIC TENSION — Compositional tension ────────────────

export type GraphicTension =
  | "diagonal_split"
  | "framing_in_frame"
  | "low_angle_hero"
  | "negative_space_block"
  | "radial_focus"
  | "shadow_play"
  | "z_pattern"
  | "color_block_contrast"
  | "verticality"
  | "spotlight";

export const GRAPHIC_TENSIONS: GraphicTension[] = [
  "diagonal_split", "framing_in_frame", "low_angle_hero",
  "negative_space_block", "radial_focus", "shadow_play",
  "z_pattern", "color_block_contrast", "verticality", "spotlight",
];

// ─── RENDER FAMILY — Photo vs Design vs Hybrid ─────────────

export type RenderFamily = "photo_led" | "design_led" | "hybrid";

export const RENDER_FAMILIES: RenderFamily[] = [
  "photo_led", "design_led", "hybrid",
];

// ─── HUMAN PRESENCE ─────────────────────────────────────────

export type HumanPresence = "none" | "hand" | "face" | "body";

export const HUMAN_PRESENCES: HumanPresence[] = [
  "none", "hand", "face", "body",
];

// ─── VISUAL STYLE — Controlled aesthetic modes ──────────────

export type VisualStyle =
  | "quiet_luxury"
  | "hyper_clean_tech"
  | "editorial_fashion"
  | "organic_earthy"
  | "vibrant_street"
  | "gritty_industrial"
  | "dreamcore"
  | "pop_high_saturation";

export const VISUAL_STYLES: VisualStyle[] = [
  "quiet_luxury", "hyper_clean_tech", "editorial_fashion", "organic_earthy",
  "vibrant_street", "gritty_industrial", "dreamcore", "pop_high_saturation",
];

// ─── STYLE MODE — Brand compatibility tier ──────────────────

export type StyleMode = "brand_native" | "brand_adjacent" | "stretch";

export const STYLE_MODES: StyleMode[] = [
  "brand_native", "brand_adjacent", "stretch",
];

// ─── AWARENESS STAGE ────────────────────────────────────────

export type AwarenessStage =
  | "unaware"
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "most_aware";

export const AWARENESS_STAGES: AwarenessStage[] = [
  "unaware", "problem_aware", "solution_aware", "product_aware", "most_aware",
];

// ─── MARKETING LEVER (secondary layer) ──────────────────────

export type MarketingLever =
  | "desire"
  | "fear"
  | "objection"
  | "identity"
  | "social_proof"
  | "disruption"
  | "aspiration"
  | "curiosity"
  | "urgency"
  | "guilt_relief";

export const MARKETING_LEVERS: MarketingLever[] = [
  "desire", "fear", "objection", "identity", "social_proof",
  "disruption", "aspiration", "curiosity", "urgency", "guilt_relief",
];

// ============================================================
// COMPATIBILITY TABLES
// These encode the RULES of what goes with what.
// ============================================================

// ─── Ad Job → Best Format Families ─────────────────────────

export const AD_JOB_FORMAT_MAP: Record<AdJob, FormatFamily[]> = {
  scroll_stop: ["visual_metaphor", "editorial", "before_after", "ugc_hybrid"],
  educate: ["ingredient_spotlight", "proof_demo", "comparison", "benefit_closeup"],
  prove: ["proof_demo", "testimonial", "comparison", "before_after"],
  handle_objection: ["objection_crusher", "comparison", "testimonial", "proof_demo"],
  convert_offer: ["offer_led", "testimonial", "benefit_closeup", "before_after"],
};

// ─── Awareness → Best Format Families ──────────────────────

export const AWARENESS_FORMAT_MAP: Record<AwarenessStage, FormatFamily[]> = {
  unaware: ["editorial", "visual_metaphor", "ugc_hybrid"],
  problem_aware: ["problem_solution", "before_after", "ugc_hybrid", "visual_metaphor"],
  solution_aware: ["proof_demo", "comparison", "ingredient_spotlight", "benefit_closeup"],
  product_aware: ["benefit_closeup", "testimonial", "objection_crusher", "comparison"],
  most_aware: ["offer_led", "testimonial", "comparison", "proof_demo"],
};

// ─── Awareness → Best Ad Jobs ──────────────────────────────

export const AWARENESS_JOB_MAP: Record<AwarenessStage, AdJob[]> = {
  unaware: ["scroll_stop", "educate"],
  problem_aware: ["scroll_stop", "educate", "prove"],
  solution_aware: ["educate", "prove", "handle_objection"],
  product_aware: ["prove", "handle_objection", "convert_offer"],
  most_aware: ["convert_offer", "handle_objection"],
};

// ─── Format Family → Best Layout Families ──────────────────

export const FORMAT_LAYOUT_MAP: Record<FormatFamily, LayoutFamily[]> = {
  problem_solution: ["split_screen", "left_copy_right_product", "vertical_story_stack"],
  proof_demo: ["center_hero_top_claim", "macro_with_side_copy", "badge_cluster"],
  offer_led: ["hero_with_bottom_offer", "center_hero_top_claim", "card_stack"],
  testimonial: ["quote_frame", "center_hero_top_claim", "vertical_story_stack"],
  comparison: ["split_screen", "left_copy_right_product", "diagonal_split"],
  editorial: ["center_hero_top_claim", "macro_with_side_copy", "hero_with_bottom_offer"],
  ugc_hybrid: ["quote_frame", "vertical_story_stack", "center_hero_top_claim"],
  visual_metaphor: ["center_hero_top_claim", "hero_with_bottom_offer", "diagonal_split"],
  objection_crusher: ["left_copy_right_product", "split_screen", "card_stack"],
  ingredient_spotlight: ["macro_with_side_copy", "center_hero_top_claim", "badge_cluster"],
  benefit_closeup: ["center_hero_top_claim", "hero_with_bottom_offer", "macro_with_side_copy"],
  before_after: ["split_screen", "diagonal_split", "vertical_story_stack"],
};

// ─── Format Family → Best Proof Mechanisms ─────────────────

export const FORMAT_PROOF_MAP: Record<FormatFamily, ProofMechanism[]> = {
  problem_solution: ["mechanism", "transformation", "comparison"],
  proof_demo: ["mechanism", "data", "ingredient"],
  offer_led: ["offer", "data", "social_proof"],
  testimonial: ["social_proof", "authority", "transformation"],
  comparison: ["comparison", "data", "mechanism"],
  editorial: ["texture", "authority", "certification"],
  ugc_hybrid: ["social_proof", "transformation", "texture"],
  visual_metaphor: ["mechanism", "transformation", "ingredient"],
  objection_crusher: ["data", "comparison", "authority"],
  ingredient_spotlight: ["ingredient", "mechanism", "certification"],
  benefit_closeup: ["texture", "transformation", "mechanism"],
  before_after: ["transformation", "comparison", "data"],
};

// ─── Format Family → Best Render Family ────────────────────

export const FORMAT_RENDER_MAP: Record<FormatFamily, RenderFamily[]> = {
  problem_solution: ["photo_led", "hybrid"],
  proof_demo: ["photo_led", "hybrid"],
  offer_led: ["design_led", "hybrid"],
  testimonial: ["photo_led", "hybrid"],
  comparison: ["design_led", "hybrid", "photo_led"],
  editorial: ["photo_led"],
  ugc_hybrid: ["photo_led"],
  visual_metaphor: ["photo_led", "hybrid"],
  objection_crusher: ["design_led", "hybrid"],
  ingredient_spotlight: ["photo_led", "hybrid"],
  benefit_closeup: ["photo_led"],
  before_after: ["photo_led", "hybrid", "design_led"],
};

// ============================================================
// VALIDATION HELPERS
// ============================================================

export function isValidFormatForAwareness(
  format: FormatFamily,
  awareness: AwarenessStage
): boolean {
  return AWARENESS_FORMAT_MAP[awareness].includes(format);
}

export function isValidJobForAwareness(
  job: AdJob,
  awareness: AwarenessStage
): boolean {
  return AWARENESS_JOB_MAP[awareness].includes(job);
}

export function getCompatibleFormats(
  job: AdJob,
  awareness: AwarenessStage
): FormatFamily[] {
  const jobFormats = AD_JOB_FORMAT_MAP[job];
  const awarenessFormats = AWARENESS_FORMAT_MAP[awareness];
  const intersection = jobFormats.filter((f) => awarenessFormats.includes(f));
  // If no overlap, use job formats (they're more specific)
  return intersection.length > 0 ? intersection : jobFormats;
}

export function getDefaultLayout(format: FormatFamily): LayoutFamily {
  return FORMAT_LAYOUT_MAP[format][0];
}

export function getDefaultProof(format: FormatFamily): ProofMechanism {
  return FORMAT_PROOF_MAP[format][0];
}

export function getDefaultRender(format: FormatFamily): RenderFamily {
  return FORMAT_RENDER_MAP[format][0];
}

/**
 * Format the full taxonomy as a string for Claude prompts.
 * This is injected so Claude MUST choose from these lists.
 */
export function formatTaxonomyForPrompt(): string {
  return `=== TAXONOMIES FERMÉES (tu DOIS choisir dans ces listes) ===

AD_JOB (mission principale) :
${AD_JOBS.map((j) => `  - "${j}"`).join("\n")}

FORMAT_FAMILY (blueprint pub) :
${FORMAT_FAMILIES.map((f) => `  - "${f}"`).join("\n")}

LAYOUT_FAMILY (composition visuelle) :
${LAYOUT_FAMILIES.map((l) => `  - "${l}"`).join("\n")}

PROOF_MECHANISM (comment prouver) :
${PROOF_MECHANISMS.map((p) => `  - "${p}"`).join("\n")}

RUPTURE_STRUCTURE (dispositif scroll-stop) :
${RUPTURE_STRUCTURES.map((r) => `  - "${r}"`).join("\n")}

GRAPHIC_TENSION (tension compositionnelle) :
${GRAPHIC_TENSIONS.map((g) => `  - "${g}"`).join("\n")}

RENDER_FAMILY (type de rendu) :
${RENDER_FAMILIES.map((r) => `  - "${r}"`).join("\n")}

VISUAL_STYLE (esthétique) :
${VISUAL_STYLES.map((s) => `  - "${s}"`).join("\n")}

STYLE_MODE (cohérence marque) :
${STYLE_MODES.map((m) => `  - "${m}"`).join("\n")}

HUMAN_PRESENCE :
${HUMAN_PRESENCES.map((h) => `  - "${h}"`).join("\n")}

MARKETING_LEVER (secondaire) :
${MARKETING_LEVERS.map((l) => `  - "${l}"`).join("\n")}`;
}

/**
 * P5 optimization: Compact taxonomy for planner prompt.
 * Omits ad_job, marketing_lever, format_family (already fixed by skeletons).
 * Only lists values the planner still needs to choose.
 * Reduces prompt by ~30%.
 */
export function formatTaxonomyCompactForPrompt(): string {
  return `=== TAXONOMIES FERMÉES (tu DOIS choisir dans ces listes) ===
(ad_job, marketing_lever, format_family sont PRE-ASSIGNES dans les squelettes — ne pas changer.)

LAYOUT_FAMILY: ${LAYOUT_FAMILIES.map((l) => `"${l}"`).join(" | ")}
PROOF_MECHANISM: ${PROOF_MECHANISMS.map((p) => `"${p}"`).join(" | ")}
RUPTURE_STRUCTURE: ${RUPTURE_STRUCTURES.map((r) => `"${r}"`).join(" | ")}
GRAPHIC_TENSION: ${GRAPHIC_TENSIONS.map((g) => `"${g}"`).join(" | ")}
RENDER_FAMILY: ${RENDER_FAMILIES.map((r) => `"${r}"`).join(" | ")}
VISUAL_STYLE: ${VISUAL_STYLES.map((s) => `"${s}"`).join(" | ")}
STYLE_MODE: ${STYLE_MODES.map((m) => `"${m}"`).join(" | ")}
HUMAN_PRESENCE: ${HUMAN_PRESENCES.map((h) => `"${h}"`).join(" | ")}`;
}
