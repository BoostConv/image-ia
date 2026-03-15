// ============================================================
// GOLDEN BRIEFS — Reference test fixtures
//
// 5 hand-crafted ConceptSpecs that represent IDEAL output
// from the ConceptPlanner. Used for:
//   - Before/after quality comparison
//   - Unit testing the critic (all should PASS)
//   - Regression testing (pipeline changes shouldn't break these)
//   - Documentation (what a good concept looks like)
//
// Each fixture covers a different:
//   - ad_job (scroll_stop, educate, prove, handle_objection, convert_offer)
//   - awareness_stage
//   - render_family
//   - marketing_lever
// ============================================================

import type { ConceptSpec, FilteredContext } from "../types";
import type { BrandStylePolicy } from "../brand-style-policy";

// ─── GOLDEN CONTEXT: REBELLE (bonbons bio) ──────────────────

export const GOLDEN_CONTEXT: FilteredContext = {
  audience_tension:
    "Les parents veulent faire plaisir à leurs enfants avec des bonbons mais culpabilisent à cause du sucre et des additifs industriels.",
  promise: "Des bonbons qui font plaisir aux enfants ET aux parents exigeants.",
  proof: "Bio certifié, sans colorants artificiels, fabriqué en France.",
  emotional_angle: "guilt_relief",
  awareness_level: "problem_aware",
  brand_visual_code: {
    primary_color: "#FF6B35",
    secondary_color: "#1A1A2E",
    accent_color: "#F7C948",
    font_style: "Bold, rounded, playful sans-serif",
    visual_tone: "Fun, bold, audacieux mais premium",
  },
  format_goal: "Meta feed ad, 1080×1080",
  constraints: [
    "Packaging REBELLE doit être visible et reconnaissable",
    "Pas de représentation négative d'enfants",
    "Couleurs vives autorisées",
  ],
  brief_summary: "Campagne de lancement REBELLE — bonbons bio pour enfants exigeants",
  product_name: "REBELLE Oursons Fruités Bio",
  product_key_benefit: "Bonbons bio sans additifs qui ont le goût de vrais fruits",
  brand_name: "REBELLE",
};

// ─── GOLDEN POLICY ──────────────────────────────────────────

export const GOLDEN_POLICY: BrandStylePolicy = {
  brand_name: "REBELLE",
  style_permissions: {
    brand_native: {
      quiet_luxury: "stretch",
      hyper_clean_tech: "stretch",
      editorial_fashion: "allowed",
      organic_earthy: "allowed",
      vibrant_street: "allowed",
      gritty_industrial: "forbidden",
      dreamcore: "allowed",
      pop_high_saturation: "allowed",
    },
    brand_adjacent: {
      quiet_luxury: "stretch",
      hyper_clean_tech: "allowed",
      editorial_fashion: "allowed",
      organic_earthy: "allowed",
      vibrant_street: "allowed",
      gritty_industrial: "forbidden",
      dreamcore: "allowed",
      pop_high_saturation: "allowed",
    },
    stretch: {
      quiet_luxury: "stretch",
      hyper_clean_tech: "stretch",
      editorial_fashion: "stretch",
      organic_earthy: "stretch",
      vibrant_street: "stretch",
      gritty_industrial: "forbidden",
      dreamcore: "stretch",
      pop_high_saturation: "stretch",
    },
  },
  preferred_render_families: ["photo_led", "hybrid", "design_led"],
  human_presence_allowed: ["none", "hand", "face", "body"],
  max_stretch_per_batch: 2,
  color_constraints: {
    require_brand_primary: false,
    forbidden_backgrounds: [],
    allow_neon: true,
  },
  product_constraints: {
    require_product_visible: true,
    min_product_scale: 0.15,
    allow_occlusion: true,
    require_exact_packaging: false,
  },
  copy_constraints: {
    max_headline_chars: 40,
    forbidden_cta_words: ["acheter maintenant", "buy now", "cliquez ici"],
    tone_rules: ["fun", "bold", "jamais condescendant"],
  },
};

// ─── GOLDEN CONCEPT 1: scroll_stop × unaware × photo_led ───

export const GOLDEN_CONCEPT_1: ConceptSpec = {
  // Strategy
  ad_job: "scroll_stop",
  format_family: "visual_metaphor",
  awareness_stage: "unaware",
  marketing_lever: "curiosity",

  // Belief
  belief_shift:
    "DE 'Les bonbons bio sont fades et tristes' → VERS 'Les bonbons bio peuvent être un spectacle de saveurs'",
  proof_mechanism: "transformation",
  proof_text: undefined,

  // Visual direction
  layout_family: "hero_image",
  render_family: "photo_led",
  rupture_structure: "frozen_explosion",
  graphic_tension: "radial_focus",
  visual_style: "pop_high_saturation",
  style_mode: "brand_native",
  human_presence: "none",

  // Scene
  visual_device:
    "Le paquet REBELLE Oursons Fruités explose en slow-motion, libérant des dizaines d'oursons gummy colorés qui volent dans toutes les directions. Chaque ourson est entouré d'un halo de poudre de fruit — fraise rose, mangue dorée, myrtille violette. Fond noir profond pour maximiser le contraste. Éclairage latéral dramatique qui fait briller chaque particule de sucre. L'explosion est radiale, centrée sur le paquet.",
  product_role: "hero",
  background_treatment: "minimal",
  contrast_principle: "Explosion colorée violente sur fond noir = arrêt du scroll immédiat",

  // Copy
  headline: "C'est quoi ce truc ?!",
  cta: "Goûte le chaos",
  offer_module: undefined,
  text_zone_spec: "top",

  // Intelligence
  customer_insight:
    "Les parents qui scrollent sont saturés de visuels 'sains et sages'. Un bonbon qui EXPLOSE de couleur crée un pattern interrupt viscéral.",
  learning_hypothesis:
    "Si cette pub performe, notre audience réagit à la disruption visuelle plus qu'au message santé — le scroll_stop pur est notre meilleur levier top-funnel.",

  // Self-scores
  novelty_score: 9,
  clarity_score: 7,
  brand_fit_score: 8,

  // Render
  render_mode: "scene_first",
  overlay_intent: "headline_cta",
  text_density: "low",
  realism_target: "stylized_photo",
};

// ─── GOLDEN CONCEPT 2: educate × problem_aware × hybrid ────

export const GOLDEN_CONCEPT_2: ConceptSpec = {
  ad_job: "educate",
  format_family: "ingredient_spotlight",
  awareness_stage: "problem_aware",
  marketing_lever: "guilt_relief",

  belief_shift:
    "DE 'Je culpabilise de donner des bonbons à mes enfants' → VERS 'REBELLE me permet de dire oui sans culpabilité'",
  proof_mechanism: "ingredient",
  proof_text: "100% bio · 0 colorant artificiel",

  layout_family: "macro_detail",
  render_family: "hybrid",
  rupture_structure: "macro_texture",
  graphic_tension: "framing_in_frame",
  visual_style: "organic_earthy",
  style_mode: "brand_native",
  human_presence: "hand",

  visual_device:
    "Gros plan macro sur un ourson gummy REBELLE tenu entre le pouce et l'index d'une main d'enfant. L'ourson est translucide, on distingue de vrais morceaux de fruits à l'intérieur — fraise, mangue. Derrière, un bol de vrais fruits frais floutés. Lumière naturelle douce de fenêtre, ambiance cuisine familiale. La texture gélatineuse de l'ourson brille sous la lumière.",
  product_role: "hero",
  background_treatment: "contextual",
  contrast_principle: "Macro-texture gourmande vs message santé = résolution du conflit parental",

  headline: "Du vrai fruit. Dedans.",
  cta: "Regarde la liste",
  offer_module: undefined,
  text_zone_spec: "right",

  customer_insight:
    "Les parents qui savent que les bonbons classiques sont pleins de chimie veulent une PREUVE visuelle que REBELLE est différent — pas un label, une démonstration.",
  learning_hypothesis:
    "Si cette pub performe, la preuve par les ingrédients (montrer le 'dedans') est plus puissante que la certification bio — on doit axer les campagnes sur la transparence ingredient.",

  novelty_score: 7,
  clarity_score: 9,
  brand_fit_score: 9,

  render_mode: "scene_first",
  overlay_intent: "badge_proof",
  text_density: "medium",
  realism_target: "photorealistic",
};

// ─── GOLDEN CONCEPT 3: prove × solution_aware × design_led ──

export const GOLDEN_CONCEPT_3: ConceptSpec = {
  ad_job: "prove",
  format_family: "comparison",
  awareness_stage: "solution_aware",
  marketing_lever: "disruption",

  belief_shift:
    "DE 'Les bonbons bio sont une niche hors de prix' → VERS 'REBELLE est le choix malin des parents informés'",
  proof_mechanism: "comparison",
  proof_text: "4.8★ · 12 000 avis",

  layout_family: "split_screen",
  render_family: "design_led",
  rupture_structure: "mirror_symmetry",
  graphic_tension: "color_block_contrast",
  visual_style: "vibrant_street",
  style_mode: "brand_native",
  human_presence: "none",

  visual_device:
    "Composition split-screen nette. Côté gauche : fond gris terne, un bonbon industriel triste, emballage générique, ambiance froide et clinique. Côté droit : fond orange vif REBELLE (#FF6B35), le paquet REBELLE éclatant avec des oursons colorés qui débordent, ambiance chaude et joyeuse. Le contraste est brutal et instantané. Le produit REBELLE occupe 40% du cadre droit.",
  product_role: "hero",
  background_treatment: "gradient",
  contrast_principle: "Gris terne vs orange REBELLE = choix évident en 0.3s",

  headline: "Le goût. Sans la chimie.",
  cta: "Fais le switch",
  offer_module: undefined,
  text_zone_spec: "top",

  customer_insight:
    "Les parents solution_aware comparent activement les alternatives. Leur montrer le contraste brutal entre 'l'ancien monde' et REBELLE les pousse à la décision.",
  learning_hypothesis:
    "Si cette pub performe, la comparaison directe (us vs them) est le levier de conversion le plus efficace pour les solution_aware — on doit créer une série 'REBELLE vs' complète.",

  novelty_score: 6,
  clarity_score: 10,
  brand_fit_score: 9,

  render_mode: "scene_first",
  overlay_intent: "full_ad",
  text_density: "medium",
  realism_target: "graphic_design",
};

// ─── GOLDEN CONCEPT 4: handle_objection × product_aware × photo_led ─

export const GOLDEN_CONCEPT_4: ConceptSpec = {
  ad_job: "handle_objection",
  format_family: "objection_crusher",
  awareness_stage: "product_aware",
  marketing_lever: "social_proof",

  belief_shift:
    "DE 'Bio = sûrement pas bon, mes enfants n'aimeront pas' → VERS '12 000 familles ne peuvent pas se tromper'",
  proof_mechanism: "social_proof",
  proof_text: "12 847 familles conquises",

  layout_family: "negative_space",
  render_family: "photo_led",
  rupture_structure: "visual_humor",
  graphic_tension: "spotlight",
  visual_style: "editorial_fashion",
  style_mode: "brand_native",
  human_presence: "face",

  visual_device:
    "Un enfant d'environ 6 ans avec une expression de surprise ravie exagérée, bouche grande ouverte, yeux écarquillés, en train de découvrir le goût d'un ourson REBELLE. Il tient l'ourson devant lui comme un trésor. Derrière lui, on distingue le paquet REBELLE posé sur une table. Éclairage studio doux mais avec un spot principal qui illumine l'expression de l'enfant. Fond épuré, couleurs chaudes.",
  product_role: "supporting",
  background_treatment: "minimal",
  contrast_principle: "Expression authentique d'un enfant = preuve plus forte que n'importe quel argument",

  headline: "Mais c'est trop bon !",
  cta: "Prouve-le toi-même",
  offer_module: undefined,
  text_zone_spec: "left",

  customer_insight:
    "Le parent product_aware connaît REBELLE mais hésite car 'bio = moins bon'. L'expression d'un VRAI enfant qui adore est la preuve ultime.",
  learning_hypothesis:
    "Si cette pub performe, la preuve par la réaction enfant bat les certifications et les chiffres — on doit investir en UGC/témoignages enfants.",

  novelty_score: 7,
  clarity_score: 8,
  brand_fit_score: 8,

  render_mode: "scene_first",
  overlay_intent: "badge_proof",
  text_density: "medium",
  realism_target: "photorealistic",
};

// ─── GOLDEN CONCEPT 5: convert_offer × most_aware × design_led ─

export const GOLDEN_CONCEPT_5: ConceptSpec = {
  ad_job: "convert_offer",
  format_family: "offer_led",
  awareness_stage: "most_aware",
  marketing_lever: "urgency",

  belief_shift:
    "DE 'J'achèterai REBELLE un jour' → VERS 'C'est MAINTENANT — cette offre ne reviendra pas'",
  proof_mechanism: "offer",
  proof_text: "-25% avec le code REBELLE25",

  layout_family: "product_focus",
  render_family: "design_led",
  rupture_structure: "radical_minimalism",
  graphic_tension: "negative_space_block",
  visual_style: "hyper_clean_tech",
  style_mode: "brand_adjacent",
  human_presence: "none",

  visual_device:
    "Le paquet REBELLE Oursons Fruités centré sur un fond dégradé linéaire du noir profond (#1A1A2E) vers l'orange REBELLE (#FF6B35). Le paquet est photographié avec un éclairage studio parfait, ombres nettes, reflets premium sur l'emballage. Autour du paquet, un halo doré subtil (#F7C948). Composition ultra-minimale — juste le produit et la lumière. Grand espace négatif en haut et en bas pour le texte.",
  product_role: "hero",
  background_treatment: "gradient",
  contrast_principle: "Produit premium isolé + urgence = action immédiate",

  headline: "Dernières 48h. -25%.",
  cta: "J'en profite",
  offer_module: "-25% code REBELLE25",
  text_zone_spec: "bottom",

  customer_insight:
    "Le parent most_aware a déjà tout compris sur REBELLE. Il procrastine. Seule une offre limitée avec un deadline clair le pousse à l'action.",
  learning_hypothesis:
    "Si cette pub performe, notre audience most_aware convertit mieux sur urgence + promo que sur branding — on doit créer des fenêtres de conversion régulières.",

  novelty_score: 5,
  clarity_score: 10,
  brand_fit_score: 7,

  render_mode: "product_first",
  overlay_intent: "full_ad",
  text_density: "high",
  realism_target: "graphic_design",
};

// ─── ALL GOLDEN CONCEPTS ────────────────────────────────────

export const GOLDEN_CONCEPTS: ConceptSpec[] = [
  GOLDEN_CONCEPT_1,
  GOLDEN_CONCEPT_2,
  GOLDEN_CONCEPT_3,
  GOLDEN_CONCEPT_4,
  GOLDEN_CONCEPT_5,
];

// ─── Validation helper ──────────────────────────────────────

/**
 * Validate that all golden concepts have valid taxonomy values.
 * Run this as a smoke test after taxonomy changes.
 */
export function validateGoldenConcepts(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Import taxonomy arrays for validation
  const { AD_JOBS, FORMAT_FAMILIES, LAYOUT_FAMILIES, PROOF_MECHANISMS,
    RUPTURE_STRUCTURES, GRAPHIC_TENSIONS, RENDER_FAMILIES,
    HUMAN_PRESENCES, VISUAL_STYLES, STYLE_MODES, AWARENESS_STAGES,
    MARKETING_LEVERS } = require("../taxonomy");

  GOLDEN_CONCEPTS.forEach((concept, i) => {
    const prefix = `Golden concept ${i + 1}`;

    if (!AD_JOBS.includes(concept.ad_job)) {
      errors.push(`${prefix}: invalid ad_job "${concept.ad_job}"`);
    }
    if (!FORMAT_FAMILIES.includes(concept.format_family)) {
      errors.push(`${prefix}: invalid format_family "${concept.format_family}"`);
    }
    if (!LAYOUT_FAMILIES.includes(concept.layout_family)) {
      errors.push(`${prefix}: invalid layout_family "${concept.layout_family}"`);
    }
    if (!PROOF_MECHANISMS.includes(concept.proof_mechanism)) {
      errors.push(`${prefix}: invalid proof_mechanism "${concept.proof_mechanism}"`);
    }
    if (!RUPTURE_STRUCTURES.includes(concept.rupture_structure)) {
      errors.push(`${prefix}: invalid rupture_structure "${concept.rupture_structure}"`);
    }
    if (!GRAPHIC_TENSIONS.includes(concept.graphic_tension)) {
      errors.push(`${prefix}: invalid graphic_tension "${concept.graphic_tension}"`);
    }
    if (!RENDER_FAMILIES.includes(concept.render_family)) {
      errors.push(`${prefix}: invalid render_family "${concept.render_family}"`);
    }
    if (!HUMAN_PRESENCES.includes(concept.human_presence)) {
      errors.push(`${prefix}: invalid human_presence "${concept.human_presence}"`);
    }
    if (!VISUAL_STYLES.includes(concept.visual_style)) {
      errors.push(`${prefix}: invalid visual_style "${concept.visual_style}"`);
    }
    if (!STYLE_MODES.includes(concept.style_mode)) {
      errors.push(`${prefix}: invalid style_mode "${concept.style_mode}"`);
    }
    if (!AWARENESS_STAGES.includes(concept.awareness_stage)) {
      errors.push(`${prefix}: invalid awareness_stage "${concept.awareness_stage}"`);
    }
    if (!MARKETING_LEVERS.includes(concept.marketing_lever)) {
      errors.push(`${prefix}: invalid marketing_lever "${concept.marketing_lever}"`);
    }
  });

  return { valid: errors.length === 0, errors };
}
