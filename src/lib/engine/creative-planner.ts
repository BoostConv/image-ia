import Anthropic from "@anthropic-ai/sdk";
import type { FilteredContext, CreativeBrief, BatchLockConfig, MarketingAngle } from "./types";
import { assignRenderProperties } from "./render-mode";

// ============================================================
// LAYER B: CREATIVE PLANNER — Customer-First Approach
//
// NO MORE ARCHETYPES. Instead, this system:
// 1. Analyzes the CUSTOMER (desires, fears, objections, identity)
// 2. For each ad, picks a DIFFERENT marketing angle
// 3. Creates a creative concept that TESTS that angle
// 4. Tags each ad with a LEARNING HYPOTHESIS
//
// Result: each ad in a batch tests a different customer hypothesis.
// When the customer clicks, we learn WHAT motivates them.
// ============================================================

const getClient = () => new Anthropic();

/**
 * All 10 marketing angles available for the batch.
 * The planner distributes them to ensure maximum diversity.
 */
const ALL_ANGLES: MarketingAngle[] = [
  "desire",
  "fear",
  "objection",
  "identity",
  "social_proof",
  "disruption",
  "aspiration",
  "curiosity",
  "urgency",
  "guilt_relief",
];

/**
 * Select diverse marketing angles for a batch.
 * Shuffled for variety. Cycles if count > 10.
 */
function selectAnglesForBatch(count: number): MarketingAngle[] {
  const pool = [...ALL_ANGLES];

  // Shuffle with Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected: MarketingAngle[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(pool[i % pool.length]);
  }
  return selected;
}

export async function planCreatives(
  context: FilteredContext,
  count: number,
  lock?: BatchLockConfig,
  hasProductImages?: boolean
): Promise<CreativeBrief[]> {
  const client = getClient();

  // Select diverse marketing angles for this batch
  const angles = selectAnglesForBatch(count);
  const anglesDescription = angles
    .map((angle, i) => `Concept ${i + 1}: angle "${angle}"`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: `Tu es un stratege publicitaire et directeur creatif de classe mondiale. Tu crees des concepts publicitaires qui PERFORMENT sur Meta.

## TA METHODE : CUSTOMER-FIRST

Avant de penser "jolie image", tu te poses ces questions :
1. **QUI** est le client ? Quel est son quotidien, ses frustrations, ses reves ?
2. **QUEL LEVIER** psychologique va le faire reagir ? (peur ? desir ? identite ? objection ?)
3. **QUELLE SCENE** visuelle va incarner ce levier de maniere irresistible ?
4. **QU'APPREND-ON** si le client clique sur CETTE pub plutot qu'une autre ?

## LES 10 LEVIERS MARKETING

- **desire** : Ce que le client REVE d'obtenir. Le benefice ultime, le plaisir pur.
- **fear** : Ce qui l'INQUIETE. Les consequences de ne pas agir.
- **objection** : Pourquoi il n'a PAS ENCORE achete — et comment casser cette objection.
- **identity** : QUI il veut etre. Le produit comme badge d'identite.
- **social_proof** : Tout le monde le fait deja. FOMO et validation sociale.
- **disruption** : Le produit CASSE les regles de la categorie. Anti-establishment.
- **aspiration** : La vie qu'il veut vivre. Le produit comme cle d'acces.
- **curiosity** : Ouvrir une boucle mentale. "Attends, c'est quoi ce truc ?"
- **urgency** : Maintenant ou jamais. Rarete, temporalite, derniere chance.
- **guilt_relief** : Supprimer la culpabilite d'un comportement actuel.

## REGLES ABSOLUES

1. **customer_insight** = La VERITE CLIENT specifique que cette pub exploite. Pas un benefice produit — une realite de la VIE du client.
   EXCELLENT : "Les parents se sentent coupables de donner des bonbons industriels a leurs enfants mais ne veulent pas les priver de plaisir"
   NUL : "Les clients veulent des bonbons de qualite"

2. **marketing_angle** = Le levier psychologique PRECIS parmi les 10 ci-dessus.

3. **learning_hypothesis** = Ce qu'on APPREND si ce visuel performe. C'est une hypothese TESTABLE.
   EXCELLENT : "Si cette pub performe, notre audience est motivee par la culpabilite parentale plus que par le gout — on doit axer toute la campagne sur 'zero culpabilite'"
   NUL : "Si cette pub performe, c'est que le visuel est bon"

4. **single_visual_idea** = CONCEPT PUBLICITAIRE COMPLET en 3-5 phrases. Une SCENE VISUELLE riche, specifique, cinematique, qui INCARNE le levier marketing. Le produit est VISIBLE et integre naturellement. Sois ULTRA-SPECIFIQUE sur les couleurs, la lumiere, la composition, l'ambiance.
   EXCELLENT : "Un enfant deballe un paquet REBELLE avec des yeux enormes de bonheur. Derriere lui, sa mere sourit sereinement, les bras croises, fiere. Sur la table de la cuisine, le paquet REBELLE est pose a cote d'un gouter sain — fruits, lait. Lumiere chaude d'apres-midi doree filtrant par la fenetre. L'emotion dominante est le SOULAGEMENT parental."
   NUL : "Le produit dans un beau decor avec un eclairage premium"

5. **creative_archetype** = Un label LIBRE que tu inventes pour decrire l'approche visuelle. Pas de liste imposee. Exemples : "scene_emotionnelle_famille", "confrontation_epique_mascotte", "monde_fantastique_produit", "design_graphique_bold", etc.

6. **headline_suggestion** = Punchline PERCUTANTE de 3-8 mots liee au levier marketing.
   Pour "guilt_relief" : "Fais-toi plaisir. Sans l'arriere-gout."
   Pour "fear" : "Tu sais ce qu'il y a dedans ?"
   Pour "identity" : "Les parents qui savent."
   Pour "social_proof" : "500 000 familles ont change."

7. **cta_suggestion** = CTA original, 2-5 mots, JAMAIS "acheter maintenant".

8. Chaque concept doit etre RADICALEMENT different : levier different, univers different, emotion differente, palette differente.

Reponds UNIQUEMENT en JSON valide (array de ${count} objets), sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: `Cree ${count} concepts publicitaires, chacun exploitant un LEVIER MARKETING different.

=== LE CLIENT ===
Tension du client: ${context.audience_tension}
Emotion exploitable: ${context.emotional_angle}
Niveau de conscience: ${context.awareness_level}

=== LE PRODUIT ===
Marque: ${context.brand_name}
Produit: ${context.product_name}
Benefice cle: ${context.product_key_benefit}
Promesse: ${context.promise}
Preuve: ${context.proof}

=== IDENTITE VISUELLE ===
Couleurs: primaire ${context.brand_visual_code.primary_color}, secondaire ${context.brand_visual_code.secondary_color}, accent ${context.brand_visual_code.accent_color}
Typo: ${context.brand_visual_code.font_style}
Ton: ${context.brand_visual_code.visual_tone}
Format: ${context.format_goal}
Contraintes: ${context.constraints.join(", ") || "aucune"}
${context.brief_summary ? `Brief: ${context.brief_summary}` : ""}
${lock ? `\n=== SOCLE STRATEGIQUE ===\nThese: ${lock.campaignThesis}\nPromesse: ${lock.lockedPromise}\nPreuve: ${lock.lockedProof}` : ""}
Images produit: ${hasProductImages ? "OUI — photos du vrai packaging disponibles. IMPORTANT: tu DOIS mixer les styles visuels dans le batch. Utilise 'graphic_design' (fond gradient + photo produit reelle = style Goli/Harry's, pro et clean) pour au moins 1-2 concepts, ET des styles IA (photorealistic, stylized_photo, editorial) pour les autres concepts. VARIE les approches !" : "NON — decrire le produit. N'utilise PAS graphic_design sans images produit."}

=== LEVIERS ASSIGNES (1 par concept) ===
${anglesDescription}

=== FORMAT JSON (array de ${count} objets) ===
[
  {
    "customer_insight": "La VERITE CLIENT que cette pub exploite. Realite de la VIE du client, pas un benefice produit.",
    "marketing_angle": "${angles[0]}",
    "learning_hypothesis": "Si cette pub performe, cela signifie que notre audience... [hypothese testable]",

    "hook_type": "pattern_interrupt|curiosity_gap|social_proof_shock|before_after|us_vs_them|emotional_mirror|instant_benefit|fear_of_missing|authority_signal|identity_call",
    "creative_archetype": "Label LIBRE que tu inventes — pas de liste imposee",
    "single_visual_idea": "SCENE PUBLICITAIRE COMPLETE en 3-5 phrases. Univers visuel riche, specifique, cinematique, qui INCARNE le levier marketing. Produit present et integre. ULTRA-SPECIFIQUE sur couleurs, lumiere, composition.",
    "promise": "Promesse adaptee a cet angle (1 phrase)",
    "proof_to_show": "Element de preuve VISUEL dans l'image",
    "emotional_mechanic": "Emotion PRECISE + COMMENT l'image la declenche",
    "awareness_level": "${context.awareness_level}",
    "meta_goal": "Objectif Meta specifique",
    "why_this_should_stop_scroll": "Raison psychologique PRECISE",
    "risks": "Risque concret si mal execute",
    "copy_safe_zone": "top|bottom|left|right|top-left|top-right|bottom-left|bottom-right",
    "realism_target": "graphic_design (= fond gradient programmatique + vraie photo produit, style Goli/Harry's — SEULEMENT si images produit dispo) | photorealistic (= scene IA realiste) | stylized_photo (= scene IA stylisee) | editorial (= scene IA editoriale) | mixed_media (= scene IA mixte)",
    "headline_suggestion": "Punchline 3-8 mots liee au levier marketing",
    "cta_suggestion": "CTA original 2-5 mots"
  }
]`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Creative planner: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const briefs = JSON.parse(jsonStr.trim()) as CreativeBrief[];

    // Validate and enrich briefs
    briefs.forEach((brief, i) => {
      // Ensure marketing angle matches assignment
      if (!ALL_ANGLES.includes(brief.marketing_angle as MarketingAngle)) {
        brief.marketing_angle = angles[i];
      }

      // Ensure customer_insight and learning_hypothesis exist
      if (!brief.customer_insight) {
        brief.customer_insight = `Insight lié au levier ${angles[i]}`;
      }
      if (!brief.learning_hypothesis) {
        brief.learning_hypothesis = `Si cette pub performe, l'audience réagit au levier ${angles[i]}`;
      }

      // Inject batch lock values
      if (lock) {
        brief.campaignThesis = lock.campaignThesis;
        brief.lockedPromise = lock.lockedPromise;
        brief.lockedProof = lock.lockedProof;
      }

      // Assign render properties based on hook_type and realism_target
      const renderProps = assignRenderProperties(brief, context, !!hasProductImages);
      brief.renderMode = renderProps.renderMode;
      brief.overlayIntent = renderProps.overlayIntent;
      brief.textDensity = renderProps.textDensity;
    });

    console.log("[CreativePlanner] Generated briefs:", briefs.map((b, i) => ({
      concept: i + 1,
      angle: b.marketing_angle,
      insight: b.customer_insight.slice(0, 60) + "...",
      archetype: b.creative_archetype,
      hook: b.hook_type,
      headline: b.headline_suggestion,
      hypothesis: b.learning_hypothesis.slice(0, 60) + "...",
    })));

    return briefs;
  } catch (e) {
    console.error("[CreativePlanner] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`Creative planner: JSON invalide — ${(e as Error).message}`);
  }
}
