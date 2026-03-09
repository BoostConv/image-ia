import Anthropic from "@anthropic-ai/sdk";
import type { CreativeBrief, ArtDirection, FilteredContext } from "./types";
import { ARCHETYPES } from "./archetypes";

// ============================================================
// LAYER C: ART DIRECTOR
// Transforms each creative brief into executable visual direction.
// Thinks like a senior photographer/art director on set.
// Output is precise enough for a prompt engineer to build from.
// ============================================================

const getClient = () => new Anthropic();

export async function directArt(
  brief: CreativeBrief,
  context: FilteredContext,
  hasProductImages: boolean
): Promise<ArtDirection> {
  const client = getClient();
  const archetype = ARCHETYPES[brief.creative_archetype];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Tu es un directeur artistique senior specialise en photographie publicitaire premium pour Meta ads. Tu traduis un concept creatif en direction visuelle EXECUTABLE.

Tu penses comme un photographe de pub qui prepare son shoot :
- Camera, objectif, angle, distance
- Eclairage precis (source, direction, temperature, ratio)
- Composition (regle, focal point, lignes directrices)
- Environnement, surfaces, props
- Traitement couleur et atmosphere

Chaque champ doit etre assez precis pour qu'un generateur d'images produise EXACTEMENT ce que tu vois dans ta tete.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: `Donne la direction artistique complete pour ce concept :

=== CONCEPT ===
Archetype: ${archetype.name} — ${archetype.description}
Strategie visuelle archetype: ${archetype.visual_strategy}
Construction de scene: ${archetype.scene_building_hint}
Integration produit: ${archetype.product_integration}
Role produit archetype: ${archetype.product_role}
Eviter: ${archetype.avoid.join(", ")}

=== BRIEF CREATIF ===
Idee visuelle: ${brief.single_visual_idea}
Hook: ${brief.hook_type}
Promesse: ${brief.promise}
Preuve visible: ${brief.proof_to_show}
Mecanique emotionnelle: ${brief.emotional_mechanic}
Zone safe pour texte: ${brief.copy_safe_zone}
Cible realisme: ${brief.realism_target}
Mode rendu: ${brief.renderMode || "scene_first"}
Intent overlay: ${brief.overlayIntent || "headline_cta"}
Densite texte: ${brief.textDensity || "medium"}

=== CODE VISUEL MARQUE ===
Couleur primaire: ${context.brand_visual_code.primary_color}
Couleur secondaire: ${context.brand_visual_code.secondary_color}
Couleur accent: ${context.brand_visual_code.accent_color}
Style typo: ${context.brand_visual_code.font_style}
Ton visuel: ${context.brand_visual_code.visual_tone}

=== CONTRAINTES ===
${context.constraints.join("\n") || "Aucune contrainte specifique"}
Format: ${context.format_goal}
Images produit disponibles: ${hasProductImages ? "OUI — utiliser comme reference de fidelite" : "NON — decrire le produit visuellement"}

=== FORMAT DE SORTIE ===
{
  "composition": "Description precise de la composition (regle des tiers, golden ratio, symetrie, etc.) et placement de chaque element",
  "focal_point": "L'element exact qui attire l'oeil en premier et pourquoi",
  "camera": "Type d'objectif, focale equivalente, ouverture, angle de vue (ex: '85mm f/1.8, angle legèrement plongeant 15 degres')",
  "framing": "Cadrage precis (ex: 'plan moyen serre, produit au tiers droit, espace negatif a gauche pour le copy')",
  "lighting": "Setup d'eclairage complet (sources, direction, temperature couleur, ratio key/fill, effets speciaux)",
  "environment": "Description complete de l'environnement/decor (surfaces, fond, ambiance, heure du jour si pertinent)",
  "prop_list": ["prop 1", "prop 2", "prop 3"],
  "product_role": "hero|supporting|contextual|absent",
  "background_role": "minimal|contextual|storytelling|abstract",
  "safe_zone": { "position": "${brief.copy_safe_zone}", "percentage": 25 },
  "texture_priority": "La texture/matiere dominante a rendre avec le plus de soin (ex: 'acier brosse avec reflets dores')",
  "realism_target": "${brief.realism_target}",
  "color_direction": "Palette precise avec roles (ex: 'dominante noir mat #1a1a1a, accent dore #c9a96e sur produit, touche blanche #f5f5f0 en highlights')",
  "must_keep": ["element non negociable 1", "element 2"],
  "avoid": ["a eviter absolument 1", "a eviter 2"],
  "reference_strategy": {
    "use_product_ref": ${hasProductImages},
    "product_ref_role": "${hasProductImages ? "exact_reproduction" : "style_guide"}",
    "use_style_ref": false,
    "style_ref_description": null
  },
  "overlay_map": {
    "headline_zone": "description de la zone ideale pour le headline (ex: 'tiers droit, bande verticale 30% largeur')",
    "cta_zone": "description de la zone CTA (ex: 'coin bas-droit, 25% largeur x 10% hauteur')",
    "badge_zone": "zone pour badge/preuve optionnelle (null si pas pertinent)",
    "proof_zone": "zone pour preuve textuelle optionnelle (null si pas pertinent)",
    "forbidden_zones": ["zone 1 ou le texte ne doit JAMAIS etre place"],
    "quiet_zones": ["zone visuellement calme mais pas prioritaire pour le texte"]
  },
  "product_anchoring": {
    "position": "center|left-third|right-third|bottom-center|top-center",
    "scale": <0.0-1.0, proportion du produit dans l'image>,
    "perspective_angle": <0-45, angle en degres>,
    "contact_shadow_required": <true|false>,
    "occlusion_allowed": <true|false, le produit peut-il etre partiellement cache>,
    "packaging_geometry_locked": <true|false, la forme du packaging doit-elle etre exacte>
  }
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Art director: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const direction = JSON.parse(jsonStr.trim()) as ArtDirection;
    console.log("[ArtDirector] Direction for", brief.creative_archetype, ":", {
      camera: direction.camera,
      lighting: direction.lighting.slice(0, 60) + "...",
      props: direction.prop_list.length,
    });
    return direction;
  } catch (e) {
    console.error("[ArtDirector] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`Art director: JSON invalide — ${(e as Error).message}`);
  }
}

/**
 * Process art direction for an entire batch of briefs.
 * Runs sequentially to avoid API rate limits.
 */
export async function directArtBatch(
  briefs: CreativeBrief[],
  context: FilteredContext,
  hasProductImages: boolean
): Promise<ArtDirection[]> {
  const directions: ArtDirection[] = [];
  for (const brief of briefs) {
    const direction = await directArt(brief, context, hasProductImages);
    directions.push(direction);
  }
  return directions;
}
