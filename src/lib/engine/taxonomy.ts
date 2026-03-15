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
// 31 layouts from Notion reference library, organized in 5 categories.

export type LayoutFamily =
  // Éducatifs
  | "story_sequence"
  | "listicle"
  | "annotation_callout"
  | "flowchart"
  // Centrés Image
  | "hero_image"
  | "product_focus"
  | "product_in_context"
  | "probleme_zoome"
  | "golden_hour"
  | "macro_detail"
  | "action_shot"
  | "ingredient_showcase"
  | "scale_shot"
  | "destruction_shot"
  | "texture_fill"
  | "negative_space"
  // Social Proof
  | "testimonial_card"
  | "ugc_style"
  | "press_as_seen_in"
  | "wall_of_love"
  | "statistique_data_point"
  | "tweet_post_screenshot"
  // Comparatifs
  | "split_screen"
  | "timeline_compare"
  | "avant_apres"
  // Centrés Texte
  | "text_heavy"
  | "single_word"
  | "fill_the_blank"
  | "two_truths"
  | "manifesto"
  | "quote_card";

export const LAYOUT_FAMILIES: LayoutFamily[] = [
  // Éducatifs
  "story_sequence", "listicle", "annotation_callout", "flowchart",
  // Centrés Image
  "hero_image", "product_focus", "product_in_context", "probleme_zoome",
  "golden_hour", "macro_detail", "action_shot", "ingredient_showcase",
  "scale_shot", "destruction_shot", "texture_fill", "negative_space",
  // Social Proof
  "testimonial_card", "ugc_style", "press_as_seen_in", "wall_of_love",
  "statistique_data_point", "tweet_post_screenshot",
  // Comparatifs
  "split_screen", "timeline_compare", "avant_apres",
  // Centrés Texte
  "text_heavy", "single_word", "fill_the_blank", "two_truths", "manifesto", "quote_card",
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

/** Visual definition of each rupture structure — injected in Gemini prompt */
export const RUPTURE_STRUCTURE_DEFS: Record<RuptureStructure, string> = {
  hyper_scale: "Produit ou sujet surdimensionné (>50% du cadre), grand-angle, perspective forcée, environnement miniaturisé autour",
  frozen_explosion: "Éléments en suspension dans l'air, mouvement figé net, particules/gouttes/fragments visibles, impression de vitesse arrêtée",
  hybrid_fusion: "Fusion de deux mondes visuels dans la même image, transition fluide entre deux univers (nature/tech, organique/géométrique)",
  dry_levitation: "Objet flottant sans support visible, ombre au sol, fond épuré, sensation d'apesanteur calme",
  cutaway: "Coupe transversale ou éclatée de l'objet, intérieur visible, structure révélée, rendu technique précis",
  mirror_symmetry: "Symétrie parfaite ou quasi-parfaite, axe central net, reflet ou dédoublement, équilibre visuel strict",
  radical_minimalism: "Extrême dépouillement, un seul sujet, fond uniforme, maximum d'espace vide, aucun élément superflu",
  anachronism: "Mélange d'époques ou de contextes incongrus, objet moderne dans un décor ancien (ou inverse), contraste temporel",
  macro_texture: "Vue très rapprochée, texture visible en détail (grain, fibre, goutte, matière), profondeur de champ très courte",
  visual_humor: "Situation inattendue ou absurde, décalage comique, expression exagérée, mise en scène théâtrale",
};

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

/** Visual definition of each graphic tension — injected in Gemini prompt */
export const GRAPHIC_TENSION_DEFS: Record<GraphicTension, string> = {
  diagonal_split: "Composition coupée par une diagonale forte, deux zones contrastées, dynamisme et mouvement directionnel",
  framing_in_frame: "Sujet encadré par un élément de la scène (porte, fenêtre, arche, mains), cadre dans le cadre, profondeur renforcée",
  low_angle_hero: "Contre-plongée, sujet vu d'en bas, impression de puissance et de grandeur, ciel ou plafond visible",
  negative_space_block: "Grande zone vide intentionnelle (>40% du cadre), sujet isolé, respiration visuelle, espace pour le texte",
  radial_focus: "Lignes de composition convergent vers le sujet central, vignettage progressif, attention aspirée vers le centre",
  shadow_play: "Ombres portées dramatiques, contraste clair-obscur marqué, formes créées par la lumière, atmosphère cinématographique",
  z_pattern: "Œil guidé en Z : haut-gauche → haut-droite → diagonale → bas-gauche → bas-droite, points d'accroche aux 4 coins",
  color_block_contrast: "Grandes aplats de couleurs contrastées, séparation nette par la couleur, graphisme fort, impact chromatique",
  verticality: "Composition verticale dominante, lignes ascendantes, hauteur accentuée, format portrait exploité",
  spotlight: "Source lumineuse directionnelle unique, sujet éclairé sur fond sombre, effet théâtral, isolation dramatique du sujet",
};

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
  problem_solution: ["probleme_zoome", "split_screen", "annotation_callout", "story_sequence", "text_heavy"],
  proof_demo: ["hero_image", "macro_detail", "ingredient_showcase", "statistique_data_point", "annotation_callout"],
  offer_led: ["product_focus", "hero_image", "text_heavy", "single_word"],
  testimonial: ["testimonial_card", "ugc_style", "wall_of_love", "tweet_post_screenshot", "quote_card"],
  comparison: ["split_screen", "avant_apres", "timeline_compare", "two_truths", "listicle"],
  editorial: ["hero_image", "golden_hour", "negative_space", "manifesto", "texture_fill"],
  ugc_hybrid: ["ugc_style", "testimonial_card", "tweet_post_screenshot", "product_in_context"],
  visual_metaphor: ["hero_image", "negative_space", "destruction_shot", "scale_shot", "action_shot"],
  objection_crusher: ["two_truths", "split_screen", "annotation_callout", "fill_the_blank", "listicle"],
  ingredient_spotlight: ["macro_detail", "ingredient_showcase", "annotation_callout", "product_focus"],
  benefit_closeup: ["macro_detail", "hero_image", "product_focus", "golden_hour", "action_shot"],
  before_after: ["avant_apres", "split_screen", "timeline_compare", "story_sequence"],
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
  const layouts = FORMAT_LAYOUT_MAP[format];
  return layouts[Math.floor(Math.random() * layouts.length)];
}

export function getCompatibleLayouts(format: FormatFamily): LayoutFamily[] {
  return FORMAT_LAYOUT_MAP[format] || LAYOUT_FAMILIES.slice(0, 5);
}

/**
 * Format the layout compatibility table for injection into the planner prompt.
 * Shows which layouts work best for each format_family assigned in the skeletons.
 */
export function formatLayoutCompatibilityForPrompt(skeletonFormats: FormatFamily[]): string {
  // Only show entries relevant to the skeletons in this batch
  const uniqueFormats = [...new Set(skeletonFormats)];

  const LAYOUT_LABELS: Record<LayoutFamily, string> = {
    // Éducatifs
    story_sequence: "Narration en etapes sequentielles",
    listicle: "Liste numerotee / items empiles",
    annotation_callout: "Image + callouts / labels pointes",
    flowchart: "Processus / flux directionnel",
    // Centrés Image
    hero_image: "Image dominante plein cadre + headline overlay",
    product_focus: "Produit centre sur fond clean",
    product_in_context: "Produit en situation lifestyle",
    probleme_zoome: "Gros plan sur le probleme",
    golden_hour: "Ambiance lumiere chaude / mood",
    macro_detail: "Gros plan extreme / texture",
    action_shot: "Produit en mouvement / dynamique",
    ingredient_showcase: "Ingredients disposes autour du produit",
    scale_shot: "Comparaison de taille avec un objet",
    destruction_shot: "Impact dramatique / eclatement",
    texture_fill: "Texture plein cadre",
    negative_space: "Espace vide genereux + produit minimal",
    // Social Proof
    testimonial_card: "Carte temoignage : avatar + citation",
    ugc_style: "Style contenu utilisateur / amateur",
    press_as_seen_in: "Logos medias / presse",
    wall_of_love: "Mur de temoignages multiples",
    statistique_data_point: "Chiffre cle geant mis en avant",
    tweet_post_screenshot: "Capture de post social",
    // Comparatifs
    split_screen: "50/50 cote a cote",
    timeline_compare: "Progression temporelle",
    avant_apres: "Avant / Apres transformation",
    // Centrés Texte
    text_heavy: "Copy dominant, produit en support",
    single_word: "Un mot geant + impact",
    fill_the_blank: "Phrase a trous interactive",
    two_truths: "Deux affirmations contrastees",
    manifesto: "Declaration de marque",
    quote_card: "Citation encadree",
  };

  const lines = uniqueFormats.map((format) => {
    const layouts = FORMAT_LAYOUT_MAP[format];
    const layoutDescs = layouts
      .map((l) => `    - "${l}" → ${LAYOUT_LABELS[l] || l}`)
      .join("\n");
    return `  ${format}:\n${layoutDescs}`;
  });

  return `=== LAYOUTS COMPATIBLES PAR FORMAT ===
Tu DOIS choisir un layout dans la liste compatible avec le format_family assigne.
Si tu choisis un layout hors liste, il sera remplace automatiquement.

${lines.join("\n\n")}`;
}

export function getDefaultProof(format: FormatFamily): ProofMechanism {
  const proofs = FORMAT_PROOF_MAP[format];
  return proofs[Math.floor(Math.random() * proofs.length)];
}

export function getDefaultRender(format: FormatFamily): RenderFamily {
  const renders = FORMAT_RENDER_MAP[format];
  return renders[Math.floor(Math.random() * renders.length)];
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
