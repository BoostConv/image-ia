import Anthropic from "@anthropic-ai/sdk";
import type {
  ConceptSpec,
  AdDirectorSpec,
  ArtDirection,
  FilteredContext,
  CreativeBrief,
} from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";

// ============================================================
// LAYER C: AD DIRECTOR (v3)
//
// Transforms each ConceptSpec into executable AD direction.
// Thinks like a CREATIVE DIRECTOR building a Meta ad — not just
// a photographer on set.
//
// Routes by render_family:
//   - photo_led: full photography specs (camera, lighting, env)
//   - design_led: graphic specs (gradients, geometry, blocks)
//   - hybrid: blend of both
//
// Output includes AD STRUCTURE (reading path, grid, modules)
// in addition to visual direction.
//
// IMPORTANT: Text is NEVER in the generated image. The Composer
// adds text AFTER via SVG overlay with Sharp. The art director
// must plan SPACE for text but never request it in the image.
// ============================================================

// ─── META ADS CONSTRAINTS (Phase 5+) ────────────────────────

export const META_ADS_CONSTRAINTS = {
  // Thumb-readability: texte lisible a 250px de large
  minTextSizeAt1080: 24,  // 24px min sur image 1080px

  // Safe zones Stories (9:16)
  storiesSafeZone: {
    topCutoff: 0.15,      // Stories coupe le haut (15%)
    bottomCutoff: 0.20,   // Stories coupe le bas (20%)
    safeCenterHeight: 0.65, // Zone safe = 65% au centre
  },

  // 20% text rule (Facebook)
  maxTextCoverage: 0.20,

  // Aspect ratio specific layouts
  aspectRatioLayouts: {
    "1:1": ["center_hero_top_claim", "card_stack", "badge_cluster", "left_copy_right_product"],
    "4:5": ["left_copy_right_product", "split_screen", "hero_with_bottom_offer"],
    "9:16": ["vertical_story_stack", "hero_with_bottom_offer", "center_hero_top_claim"],
    "16:9": ["split_screen", "left_copy_right_product", "macro_with_side_copy"],
  } as Record<string, string[]>,

  // Product scale recommendations by role
  productScaleByRole: {
    hero: { min: 0.35, max: 0.60, recommended: 0.45 },
    supporting: { min: 0.15, max: 0.35, recommended: 0.25 },
    contextual: { min: 0.05, max: 0.20, recommended: 0.12 },
    absent: { min: 0, max: 0, recommended: 0 },
  } as Record<string, { min: number; max: number; recommended: number }>,
};

/**
 * Get Stories-safe constraints for 9:16 format.
 */
export function getStoriesSafeZone(): { topOffset: number; bottomOffset: number; safeHeight: number } {
  return {
    topOffset: META_ADS_CONSTRAINTS.storiesSafeZone.topCutoff,
    bottomOffset: META_ADS_CONSTRAINTS.storiesSafeZone.bottomCutoff,
    safeHeight: META_ADS_CONSTRAINTS.storiesSafeZone.safeCenterHeight,
  };
}

/**
 * Get recommended layouts for an aspect ratio.
 */
export function getRecommendedLayouts(aspectRatio: string): string[] {
  return META_ADS_CONSTRAINTS.aspectRatioLayouts[aspectRatio] || META_ADS_CONSTRAINTS.aspectRatioLayouts["1:1"];
}

/**
 * Get recommended product scale for a role.
 */
export function getRecommendedProductScale(role: "hero" | "supporting" | "contextual" | "absent"): number {
  return META_ADS_CONSTRAINTS.productScaleByRole[role]?.recommended || 0;
}

const getClient = () => new Anthropic();

/**
 * Direct a single concept into a full AdDirectorSpec.
 */
export async function directAd(
  concept: ConceptSpec,
  context: FilteredContext,
  hasProductImages: boolean,
  daDirective?: string,
): Promise<AdDirectorSpec> {
  const client = getClient();

  const renderBlock = buildRenderFamilyBlock(concept);

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `Tu es un directeur creatif senior pour Meta ads. Tu transformes un concept publicitaire structure en direction EXECUTABLE.

Tu penses comme un CD d'agence qui brief son equipe :
1. AD PURPOSE : "Quand la personne voit cette image, elle comprend immediatement que..."
2. BELIEF SHIFT : FROM "[croyance actuelle]" → TO "[nouvelle croyance]"
3. STRUCTURE PUB : parcours de lecture, grille, hierarchie attention
4. MODULES PUB : placement headline, preuve, CTA, badge, offre
5. DIRECTION PRODUIT : echelle, placement, ancrage
6. DIRECTION VISUELLE : composition, eclairage, couleurs, texture
7. ZONES avec positions precises : headline_zone, cta_zone, forbidden_zones

=== AD PURPOSE (OBLIGATOIRE) ===
Tu dois TOUJOURS specifier clairement le BUT de l'image.
Format: "Quand la personne voit cette image, elle comprend que [message cle]"
Exemple: "Quand la personne voit cette image, elle comprend que ce serum est la solution rapide a ses problemes de peau"

=== LAYOUT STRUCTURE (OBLIGATOIRE) ===
Tu dois specifier :
- grid_system : grille precise (ex: "3-column: left 40% copy | center 20% negative space | right 40% product")
- reading_order : parcours exact (ex: "Z-pattern: headline top-left → product center-right → CTA bottom-right")
- eye_path : description du chemin visuel
- attention_anchor : ce qui capte l'oeil EN PREMIER
- forbidden_zones : zones ou JAMAIS placer de texte (ex: "zone produit centrale", "visage modele")

=== FOCUS (OBLIGATOIRE) ===
- product_scale : proportion exacte (0.0-1.0)
- product_placement : position precise (ex: "right-third, slightly below center, ~40% of frame")

=== META ADS CONSTRAINTS ===
- Mobile-first : tout doit etre lisible a 250px de large
- Stories (9:16) : top 15% et bottom 20% peuvent etre coupes
- Regle 20% texte Facebook : texte < 20% de l'image

Chaque champ doit etre assez precis pour qu'un generateur d'images produise EXACTEMENT l'image souhaitee, et qu'un compositeur (Sharp + SVG) place les elements texte parfaitement.

IMPORTANT : Le texte est TOUJOURS ajoute APRES par le Composer (SVG overlay).
L'image generee doit etre SANS TEXTE mais avec des zones claires reservees.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Direction artistique complete pour ce concept :

=== CONCEPT (taxonomies v3) ===
Ad Job: ${concept.ad_job}
Format Family: ${concept.format_family}
Layout Family: ${concept.layout_family}
Awareness: ${concept.awareness_stage}
Marketing Lever: ${concept.marketing_lever}
Proof Mechanism: ${concept.proof_mechanism}
Proof Text: ${concept.proof_text || "aucun"}
Rupture Structure: ${concept.rupture_structure}
Graphic Tension: ${concept.graphic_tension}
Render Family: ${concept.render_family}
Visual Style: ${concept.visual_style}
Style Mode: ${concept.style_mode}
Human Presence: ${concept.human_presence}
Product Role: ${concept.product_role}
Background: ${concept.background_treatment}

=== SCENE ===
Visual Device: ${concept.visual_device}
Contrast Principle: ${concept.contrast_principle}
Belief Shift: ${concept.belief_shift}

=== COPY (place par le Composer APRES — PAS dans l'image) ===
Headline: "${concept.headline}" (${concept.headline.length} chars)
CTA: "${concept.cta}"
Proof: "${concept.proof_text || ""}"
Offer: ${concept.offer_module || "aucun"}
Text Zone: ${concept.text_zone_spec}
Overlay Intent: ${concept.overlay_intent}
Text Density: ${concept.text_density}

=== MARQUE ===
Nom: ${context.brand_name}
Produit: ${context.product_name} — ${context.product_key_benefit}
Couleur primaire: ${context.brand_visual_code.primary_color}
Couleur secondaire: ${context.brand_visual_code.secondary_color}
Couleur accent: ${context.brand_visual_code.accent_color}
Style typo: ${context.brand_visual_code.font_style}
Ton visuel: ${context.brand_visual_code.visual_tone}

${daDirective ? `\n${daDirective}\n` : ""}
=== CONTRAINTES ===
${context.constraints.join("\n") || "Aucune contrainte specifique"}
Format: ${context.format_goal}
Images produit: ${hasProductImages ? "OUI — utiliser comme reference de fidelite" : "NON — decrire visuellement"}
Realisme: ${concept.realism_target}

${renderBlock}

=== FORMAT JSON ATTENDU ===
{
  "reading_order": "parcours de lecture (ex: 'Z: badge top-left > headline > produit center > proof > CTA bottom-right')",
  "eye_path": "chemin visuel naturel",
  "attention_anchor": "element qui capte l'oeil en premier",
  "grid_system": "grille (ex: '3 colonnes: copy left | produit center | badge right')",
  "headline_container_style": "style conteneur headline (ex: 'pill blanc, 48px bold, ombre douce')",
  "proof_block_style": "style bloc preuve ou null",
  "offer_module_position": "position module offre ou null",
  "cta_prominence": "subtle|medium|dominant",
  "brand_bar": "barre marque ou null",
  "product_scale": 0.4,
  "product_placement": "position produit (ex: 'right-third, slightly below center')",
  "product_anchoring": {
    "position": "center|left-third|right-third|bottom-center|top-center",
    "scale": 0.4,
    "perspective_angle": 15,
    "contact_shadow_required": true,
    "occlusion_allowed": false,
    "packaging_geometry_locked": ${hasProductImages}
  },
  "composition": "description composition",
  "focal_point": "element focal",
  "camera": "specs camera",
  "framing": "cadrage",
  "lighting": "eclairage complet",
  "environment": "environnement/decor",
  "color_direction": "palette avec roles",
  "texture_priority": "texture dominante",
  "prop_list": ["prop1", "prop2"],
  "safe_zone": { "position": "${concept.text_zone_spec}", "percentage": 25 },
  "overlay_map": {
    "headline_zone": "zone headline",
    "cta_zone": "zone CTA",
    "badge_zone": "zone badge ou null",
    "proof_zone": "zone preuve ou null",
    "forbidden_zones": ["zone ou texte interdit"],
    "quiet_zones": ["zone calme"]
  },
  "negative_space_shape": "forme espace negatif (ex: 'bloc L en haut-gauche')",
  "text_density_budget": "${concept.text_density}",
  "character_budget_headline": ${Math.min(50, concept.headline.length + 10)},
  "must_keep": ["element non negociable 1"],
  "avoid": ["a eviter 1"],
  "render_family_specs": ${buildRenderFamilySpecsTemplate(concept)},
  "reference_strategy": {
    "use_product_ref": ${hasProductImages},
    "product_ref_role": "${hasProductImages ? "exact_reproduction" : "style_guide"}",
    "use_style_ref": false,
    "style_ref_description": null
  }
}`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Art director: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const raw = JSON.parse(jsonStr.trim());
    const direction = normalizeAdDirectorSpec(raw, concept, context, hasProductImages);

    console.log("[AdDirector] Direction for", concept.ad_job, "/", concept.format_family, ":", {
      grid: direction.grid_system.slice(0, 60),
      reading: direction.reading_order.slice(0, 60),
      render: concept.render_family,
    });

    return direction;
  } catch (e) {
    console.error("[AdDirector] JSON parse error:", jsonStr.slice(0, 300));
    console.warn("[AdDirector] Using default specs for", concept.ad_job);
    return buildDefaultAdDirectorSpec(concept, context, hasProductImages);
  }
}

// ─── RENDER FAMILY BLOCKS ──────────────────────────────────

function buildRenderFamilyBlock(concept: ConceptSpec): string {
  switch (concept.render_family) {
    case "photo_led":
      return `=== DIRECTION SPECIFIQUE : PHOTO-LED ===
Pense comme un photographe publicitaire premium. Specs requises :
- Camera : objectif, focale, ouverture, angle de vue
- Eclairage : source, direction, temperature couleur, ratio key/fill
- Environnement : decor, surfaces, props, ambiance, heure du jour
- Texture : matiere dominante a rendre avec le plus de soin
- Style photo : ${concept.visual_style}
- Presence humaine : ${concept.human_presence}`;

    case "design_led":
      return `=== DIRECTION SPECIFIQUE : DESIGN-LED ===
Pense comme un directeur artistique graphique. Specs requises :
- Gradient : direction, couleurs, transitions
- Geometrie : formes, lignes, blocs, patterns
- Fond : traitement graphique (${concept.background_treatment})
- Produit : integration sur fond graphique
- Contraste : ${concept.contrast_principle}
PAS de specs camera/eclairage detaillees — c'est du graphisme.
Le champ camera doit contenir "N/A — design_led" et lighting "flat studio pour packshot".`;

    case "hybrid":
      return `=== DIRECTION SPECIFIQUE : HYBRID ===
Melange photo + graphisme. Specs requises :
- Scene photo partielle : description de la partie photographique
- Elements graphiques : superpositions, blocs, lignes, patterns
- Blend mode : comment photo et design fusionnent
- Presence humaine : ${concept.human_presence}
- Background : ${concept.background_treatment}`;

    default:
      return "";
  }
}

function buildRenderFamilySpecsTemplate(concept: ConceptSpec): string {
  switch (concept.render_family) {
    case "design_led":
      return `{
    "gradient_spec": "specification gradient (ex: linear 135deg, #1a1a2e > #16213e)",
    "geometry_elements": "elements geometriques (cercle, lignes, blocs)"
  }`;
    case "hybrid":
      return `{
    "photo_scene_spec": "description scene photo partielle",
    "blend_mode": "comment photo + design fusionnent",
    "geometry_elements": "elements graphiques superposes"
  }`;
    case "photo_led":
    default:
      return `{
    "photo_scene_spec": "description complete de la scene photo"
  }`;
  }
}

// ─── NORMALIZATION ─────────────────────────────────────────

function normalizeAdDirectorSpec(
  raw: Record<string, unknown>,
  concept: ConceptSpec,
  context: FilteredContext,
  hasProductImages: boolean
): AdDirectorSpec {
  return {
    // Ad structure
    reading_order: str(raw.reading_order) || `${concept.layout_family}: anchor → headline → proof → CTA`,
    eye_path: str(raw.eye_path) || "Z-pattern naturel",
    attention_anchor: str(raw.attention_anchor) || concept.visual_device.slice(0, 60),
    grid_system: str(raw.grid_system) || "2 colonnes, produit + copy",

    // Ad modules
    headline_container_style: str(raw.headline_container_style) || "bold sur fond semi-transparent",
    proof_block_style: str(raw.proof_block_style) || undefined,
    offer_module_position: str(raw.offer_module_position) || undefined,
    cta_prominence: (
      ["subtle", "medium", "dominant"].includes(raw.cta_prominence as string)
        ? raw.cta_prominence
        : "medium"
    ) as "subtle" | "medium" | "dominant",
    brand_bar: str(raw.brand_bar) || undefined,

    // Product
    product_scale: num(raw.product_scale, 0.4, 0.05, 0.9),
    product_placement: str(raw.product_placement) || "center",
    product_anchoring: normalizeProductAnchoring(raw.product_anchoring, hasProductImages),

    // Visual direction
    composition: str(raw.composition) || concept.visual_device,
    focal_point: str(raw.focal_point) || "produit principal",
    camera: str(raw.camera) || "85mm f/2.8, angle neutre",
    framing: str(raw.framing) || "plan moyen, cadrage publicitaire",
    lighting: str(raw.lighting) || "eclairage studio professionnel, key light 45deg",
    environment: str(raw.environment) || "fond sobre adapte au produit",
    color_direction: str(raw.color_direction) ||
      `${context.brand_visual_code.primary_color} dominante, ${context.brand_visual_code.accent_color} accent`,
    texture_priority: str(raw.texture_priority) || "surface produit",
    prop_list: arr(raw.prop_list),

    // Zones
    safe_zone: {
      position: str((raw.safe_zone as Record<string, unknown>)?.position) || concept.text_zone_spec,
      percentage: num((raw.safe_zone as Record<string, unknown>)?.percentage, 25, 10, 50),
    },
    overlay_map: normalizeOverlayMap(raw.overlay_map),
    negative_space_shape: str(raw.negative_space_shape) || undefined,

    // Constraints
    text_density_budget: concept.text_density,
    character_budget_headline: num(raw.character_budget_headline, 40, 10, 60),
    must_keep: arr(raw.must_keep).length > 0 ? arr(raw.must_keep) : [context.product_name],
    avoid: arr(raw.avoid).length > 0 ? arr(raw.avoid) : ["texte dans l'image", "composition plate"],

    // Render family specific
    render_family_specs: (raw.render_family_specs as AdDirectorSpec["render_family_specs"]) || undefined,

    // Reference strategy
    reference_strategy: {
      use_product_ref: hasProductImages,
      product_ref_role: hasProductImages ? "exact_reproduction" : "style_guide",
      use_style_ref: false,
    },
  };
}

function normalizeProductAnchoring(
  raw: unknown,
  hasProductImages: boolean
): AdDirectorSpec["product_anchoring"] {
  const defaults = {
    position: "center" as const,
    scale: 0.4,
    perspective_angle: 15,
    contact_shadow_required: true,
    occlusion_allowed: false,
    packaging_geometry_locked: hasProductImages,
  };

  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Record<string, unknown>;
  const validPositions = ["center", "left-third", "right-third", "bottom-center", "top-center"];

  return {
    position: (validPositions.includes(obj.position as string)
      ? obj.position
      : "center") as typeof defaults.position,
    scale: num(obj.scale, 0.4, 0.05, 0.9),
    perspective_angle: num(obj.perspective_angle, 15, 0, 45),
    contact_shadow_required: typeof obj.contact_shadow_required === "boolean" ? obj.contact_shadow_required : true,
    occlusion_allowed: typeof obj.occlusion_allowed === "boolean" ? obj.occlusion_allowed : false,
    packaging_geometry_locked: typeof obj.packaging_geometry_locked === "boolean"
      ? obj.packaging_geometry_locked
      : hasProductImages,
  };
}

function normalizeOverlayMap(raw: unknown): AdDirectorSpec["overlay_map"] {
  const defaults = {
    headline_zone: "tiers superieur, pleine largeur",
    cta_zone: "coin bas-droit",
    forbidden_zones: [] as string[],
    quiet_zones: [] as string[],
  };

  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Record<string, unknown>;
  return {
    headline_zone: str(obj.headline_zone) || defaults.headline_zone,
    cta_zone: str(obj.cta_zone) || defaults.cta_zone,
    badge_zone: str(obj.badge_zone) || undefined,
    proof_zone: str(obj.proof_zone) || undefined,
    forbidden_zones: arr(obj.forbidden_zones),
    quiet_zones: arr(obj.quiet_zones),
  };
}

function buildDefaultAdDirectorSpec(
  concept: ConceptSpec,
  context: FilteredContext,
  hasProductImages: boolean
): AdDirectorSpec {
  return normalizeAdDirectorSpec({}, concept, context, hasProductImages);
}

// ─── TYPE HELPERS ──────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function num(v: unknown, fallback: number, min = 0, max = 100): number {
  if (typeof v === "number" && !isNaN(v)) return Math.max(min, Math.min(max, v));
  return fallback;
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

// ─── V2 COMPAT: AdDirectorSpec → ArtDirection ──────────────
// Used by downstream modules not yet migrated (renderer).

export function adDirectorToArtDirection(spec: AdDirectorSpec): ArtDirection {
  return {
    composition: spec.composition,
    focal_point: spec.focal_point,
    camera: spec.camera,
    framing: spec.framing,
    lighting: spec.lighting,
    environment: spec.environment,
    prop_list: spec.prop_list,
    product_role: spec.product_anchoring.scale > 0.5 ? "hero"
      : spec.product_anchoring.scale > 0.2 ? "supporting"
      : "contextual",
    background_role: "contextual",
    safe_zone: spec.safe_zone,
    texture_priority: spec.texture_priority,
    realism_target: "photorealistic",
    color_direction: spec.color_direction,
    must_keep: spec.must_keep,
    avoid: spec.avoid,
    reference_strategy: spec.reference_strategy,
    overlay_map: spec.overlay_map,
    product_anchoring: spec.product_anchoring,
  };
}

// ─── BATCH PROCESSING ──────────────────────────────────────

/**
 * Direct art for a batch of ConceptSpecs.
 * Runs sequentially to avoid API rate limits.
 */
export async function directAdBatchV3(
  concepts: ConceptSpec[],
  context: FilteredContext,
  hasProductImages: boolean,
  daDirective?: string,
): Promise<AdDirectorSpec[]> {
  const directions: AdDirectorSpec[] = [];
  for (let i = 0; i < concepts.length; i++) {
    const direction = await directAd(concepts[i], context, hasProductImages, daDirective);
    directions.push(direction);
    if (i < concepts.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return directions;
}

/**
 * @deprecated Use directAdBatchV3 instead.
 * Kept for backward compatibility during migration.
 */
export async function directArtBatch(
  briefs: CreativeBrief[],
  context: FilteredContext,
  hasProductImages: boolean
): Promise<ArtDirection[]> {
  // Fallback: create minimal ConceptSpec-like objects from briefs
  // This should rarely be used — pipeline v3 calls directAdBatchV3 directly.
  console.warn("[AdDirector] Using deprecated directArtBatch — prefer directAdBatchV3");
  const specs: AdDirectorSpec[] = [];

  for (let i = 0; i < briefs.length; i++) {
    const brief = briefs[i];
    const defaultSpec = buildDefaultAdDirectorSpec(
      {
        ad_job: "scroll_stop",
        format_family: "editorial",
        awareness_stage: (brief.awareness_level || "problem_aware") as ConceptSpec["awareness_stage"],
        marketing_lever: (brief.marketing_angle || "desire") as ConceptSpec["marketing_lever"],
        belief_shift: brief.promise || "",
        proof_mechanism: "mechanism",
        proof_text: brief.proof_to_show,
        layout_family: "center_hero_top_claim",
        render_family: "photo_led",
        rupture_structure: "radical_minimalism",
        graphic_tension: "spotlight",
        visual_style: "quiet_luxury",
        style_mode: "brand_native",
        human_presence: "none",
        visual_device: brief.single_visual_idea,
        product_role: "hero",
        background_treatment: "contextual",
        contrast_principle: "",
        headline: brief.headline_suggestion || "",
        cta: brief.cta_suggestion || "Decouvrir",
        text_zone_spec: brief.copy_safe_zone,
        customer_insight: brief.customer_insight,
        learning_hypothesis: brief.learning_hypothesis,
        novelty_score: 5,
        clarity_score: 5,
        brand_fit_score: 5,
        render_mode: brief.renderMode || "scene_first",
        overlay_intent: brief.overlayIntent || "headline_cta",
        text_density: brief.textDensity || "medium",
        realism_target: brief.realism_target,
      } satisfies ConceptSpec,
      context,
      hasProductImages
    );
    specs.push(defaultSpec);
  }

  return specs.map(adDirectorToArtDirection);
}
