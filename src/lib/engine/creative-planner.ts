import Anthropic from "@anthropic-ai/sdk";
import type {
  FilteredContext,
  CreativeBrief,
  ConceptSpec,
  BatchLockConfig,
  MarketingAngle,
  RenderMode,
  OverlayIntent,
  TextDensity,
} from "./types";
import type { BrandStylePolicy } from "./brand-style-policy";
import { assignRenderProperties } from "./render-mode";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { getKnowledgeForStage } from "./knowledge";
import type { AwarenessLevel } from "./knowledge";
import {
  AD_JOBS,
  FORMAT_FAMILIES,
  LAYOUT_FAMILIES,
  PROOF_MECHANISMS,
  RUPTURE_STRUCTURES,
  GRAPHIC_TENSIONS,
  RENDER_FAMILIES,
  HUMAN_PRESENCES,
  VISUAL_STYLES,
  STYLE_MODES,
  AWARENESS_STAGES,
  MARKETING_LEVERS,
  formatTaxonomyForPrompt,
  formatTaxonomyCompactForPrompt,
  getCompatibleFormats,
  getDefaultLayout,
  getDefaultProof,
  getDefaultRender,
} from "./taxonomy";
import type {
  AdJob,
  FormatFamily,
  LayoutFamily,
  ProofMechanism,
  RuptureStructure,
  GraphicTension,
  RenderFamily,
  HumanPresence,
  VisualStyle,
  StyleMode,
  AwarenessStage,
  MarketingLever,
} from "./taxonomy";
import { formatPolicyForPrompt } from "./brand-style-policy";
import type { CreativeMemory } from "../db/queries/creative-memory";
import { formatCreativeMemoryDirective } from "../db/queries/creative-memory";
import type { BrandDAFingerprint } from "./brand-da-analyzer";
import { formatDAFingerprintForPrompt } from "./brand-da-analyzer";

// ============================================================
// LAYER B: CONCEPT PLANNER — Pipeline v3
//
// Replaces the old CreativePlanner. Now generates ConceptSpec[]
// with closed taxonomies instead of free-form CreativeBrief[].
//
// Key changes from v2:
//   - ad_job is the TOP strategic layer (not marketing_lever)
//   - All visual choices come from closed taxonomy lists
//   - Over-generates count×2 so the critic can filter
//   - Brand style policy constrains style choices
//   - Taxonomy injected in prompt (Claude MUST choose from lists)
//   - Post-parse validation rejects invalid taxonomy values
//
// The old planCreatives() is kept for backward compat.
// ============================================================

const getClient = () => new Anthropic();

// ─── STRATEGIC SPINE ────────────────────────────────────────
// For each concept, we pre-assign the strategic backbone.
// Claude fills in the creative flesh.

interface ConceptSkeleton {
  ad_job: AdJob;
  marketing_lever: MarketingLever;
  format_family: FormatFamily;
  awareness_stage: AwarenessStage;
}

/**
 * Generate diverse strategic skeletons for a batch.
 * Ensures each concept has a different ad_job + marketing_lever combo.
 */
function generateSkeletons(
  count: number,
  awareness: AwarenessStage
): ConceptSkeleton[] {
  // Shuffle ad jobs
  const jobs = shuffle([...AD_JOBS]);
  // Shuffle marketing levers
  const levers = shuffle([...MARKETING_LEVERS]);

  const skeletons: ConceptSkeleton[] = [];

  for (let i = 0; i < count; i++) {
    const job = jobs[i % jobs.length];
    const lever = levers[i % levers.length];

    // Get compatible formats for this job + awareness
    const compatFormats = getCompatibleFormats(job, awareness);
    // Pick a format — cycle through compatible ones
    const format = compatFormats[i % compatFormats.length];

    skeletons.push({
      ad_job: job,
      marketing_lever: lever,
      format_family: format,
      awareness_stage: awareness,
    });
  }

  return skeletons;
}

// ─── MAIN PLANNER v3 ───────────────────────────────────────

/**
 * Plan concepts using closed taxonomies.
 * Over-generates `count * 2` concepts for the critic to filter.
 *
 * @param context     Filtered brand/product context
 * @param count       FINAL desired count (will generate count×2)
 * @param policy      Brand style policy for constraints
 * @param lock        Batch lock config (optional)
 * @param hasProductImages Whether product photos are available
 * @returns ConceptSpec[] (count×2 concepts, un-filtered)
 */
export async function planConcepts(
  context: FilteredContext,
  count: number,
  policy: BrandStylePolicy,
  lock?: BatchLockConfig,
  hasProductImages?: boolean,
  memory?: CreativeMemory,
  daFingerprint?: BrandDAFingerprint,
): Promise<ConceptSpec[]> {
  const client = getClient();
  const awareness = (context.awareness_level || "problem_aware") as AwarenessStage;

  // Over-generate for critic filtering (minimum 3)
  const generateCount = Math.max(3, count * 2);

  // Pre-assign strategic skeletons
  const skeletons = generateSkeletons(generateCount, awareness);
  const skeletonDescription = skeletons
    .map(
      (s, i) =>
        `Concept ${i + 1}: ad_job="${s.ad_job}", marketing_lever="${s.marketing_lever}", format_family="${s.format_family}"`
    )
    .join("\n");

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: `Tu es un expert senior en creation d'ads statiques pour le e-commerce DTC. Tu combines les competences d'un directeur artistique, d'un copywriter direct-response, et d'un stratege marketing. Tu produis des ads 'banger' — des ads qui arretent le scroll, creent une emotion, et generent du clic.

## TES PRINCIPES FONDATEURS (Mark Morgan Ford + Hopkins + Makepeace)

1. LA PUB C'EST DE LA VENTE, PAS DE LA LITTERATURE (Hopkins) — Pas de formulations poetiques. Un vendeur qui parle a une personne. Chaque mot doit vendre, pas impressionner.
2. SPECIFIQUE, CONCRET, ZERO DEDUCTION — Si le prospect doit reflechir pour comprendre, le copy est rate. Compris en 1 seconde.
3. EMOTION D'ABORD, LOGIQUE ENSUITE — La headline fait RESSENTIR. Le sous-texte INFORME. Toujours dans cet ordre.
4. DON'T FORCE. TEMPT. — Ne pas lister des arguments. Faire ressentir l'experience. Le visuel et le copy tentent, pas forcent.
5. LE MEILLEUR CONCEPT N'A PAS BESOIN DE BEAUCOUP DE MOTS — Si un concept a besoin de 50+ mots, il n'est pas fait pour le format static ad.

## TA METHODE : CONCEPT-FIRST (Pipeline v3)

Tu DOIS penser dans cet ORDRE :
1. **AD_JOB** : Quelle est la MISSION de cette pub dans le funnel ? (scroll_stop, educate, prove, handle_objection, convert_offer)
2. **FORMAT_FAMILY** : Quel BLUEPRINT pub sert cette mission ? (comparaison, temoignage, offre, etc.)
3. **PROOF_MECHANISM** : Comment cette pub PROUVE sa promesse ? (ingredient, data, social_proof, etc.)
4. **VISUAL_DEVICE** : Quelle SCENE visuelle incarne tout ca ?

## REGLES ABSOLUES

1. **visual_device** = SCENE VISUELLE PURE en 3-4 phrases. Decris UNIQUEMENT ce qu'on VOIT.
   INTERDIT : texte, typographie, headlines, badges, fleches, chiffres, prix, CTA, labels.
   Le Compositeur ajoutera le texte APRES.

2. **belief_shift** = La transformation mentale PRECISE.
   Format : "DE '[croyance actuelle]' → VERS '[nouvelle croyance]'"
   EXCELLENT : "DE 'Les bonbons bio sont fades' → VERS 'REBELLE prouve que bio = explosion de saveurs'"
   NUL : "DE 'pas bien' → VERS 'bien'"

3. **customer_insight** = Une VERITE sur la VIE du client, PAS un benefice produit.
   Framework: Reponds mentalement a: "Qu'est-ce qui empeche ce persona de dormir a 3h du matin?"

4. **Chaque concept = RADICALEMENT different** : levier different, scene differente, emotion differente.
   Diversifier: patterns, sous-types, mecanismes headline, layouts, registres emotionnels.

5. **Tous les champs taxonomiques DOIVENT venir des listes fermees ci-dessous.**

## LES 13 MECANISMES DE HEADLINE

1. Interpellation directe (probleme nomme): "Ton ado transpire et les deos ne tiennent pas"
2. Situation Recognition (moment de vie precis): "15h. Tu as bu 4 cafes et 0 eau."
3. Contraste Avant/Apres: "A gauche ce que tu utilises. A droite ce que ta peau merite."
4. Loss Aversion / Cout cache: "Ta bouteille plastique met 450 ans a disparaitre."
5. Social Proof: "4 millions d'hommes ont lache leur gel douche."
6. Question Hook: "Retourne ton gel douche. Tu comprends quelque chose?"
7. Revelation / Education: "43 ingredients dans ton gel douche. Tu en connais zero."
8. Urgence / Rarete: "Derniere chance — edition limitee."
9. Resultat specifique: "Son corps change. Son deodorant devrait suivre."
10. Identite / Appartenance: "En soiree, personne ne sait que c'est de l'eau."
11. Objection Buster: "Pas besoin d'alcool pour avoir de la gueule a table."
12. Provocation / Defi: "Tu tracks tes macros mais tu bois de la Cristaline."
13. Disruption / Reverse Psychology: "Ton gel douche fait son job. C'est juste qu'il ne fait QUE ca."

## COPY REQUIREMENTS (Phase 5+ — FRANCAIS OBLIGATOIRE)

=== HEADLINE (obligatoire) ===
- FRANCAIS uniquement
- Budget: 10-15 mots max, 1-2 lignes visuellement
- Job: Arreter le scroll en 1 seconde, faire RESSENTIR (feel test de Makepeace)
- DOIT nommer le probleme, la situation, ou le desir EXPLICITEMENT
- Specifique a CE persona — si le copy peut s'appliquer a n'importe qui, il ne parle a personne
- Se suffit a elle-meme sans contexte ni visuel

=== SUBTITLE (optionnel) ===
- FRANCAIS uniquement
- Budget: 15-25 mots max
- Job: Repondre aux questions: c'est quoi? Pour qui? Fait avec quoi? Ca fait quoi?
- Minimum: dire ce qu'est le produit + un benefice concret
- DOIT REPONDRE au hook de la headline (meme theme, meme champ lexical)

=== CTA (obligatoire) ===
- FRANCAIS uniquement
- 2-5 mots — action concrete, PAS un slogan
- JAMAIS "Acheter maintenant", "Cliquez ici", "En savoir plus"
- JAMAIS de CTA-slogan ("Sois celle qui a compris", "Embrasse le changement")
- BON: "Je veux essayer", "Voir le resultat", "C'est pour moi", "Decouvrir le secret"

=== BUDGET TOTAL ===
- headline + sous-texte + CTA = 20-35 mots MAXIMUM
- Si au-dessus de 35 mots → couper ou changer de concept
- La clarte ne se sacrifie JAMAIS pour la concision

## FORMULATIONS INTERDITES

- Formulations poetiques/abstraites: "Le rituel naturel qui lui donne l'assurance qu'il merite"
- Copy qui necessite une deduction du prospect
- Copy generique applicable a n'importe quel produit
- Sous-texte deconnecte du hook (le sous-texte REPOND a la headline)
- Mots dilutifs: peut, pourrait, devrait, a le potentiel de, cherche a
- Tirets longs (—) dans le copy — utiliser point ou virgule
- Utilisation mecanique des arguments (note Yuka, etoiles dans CHAQUE ad)

${formatTaxonomyCompactForPrompt()}

${formatPolicyForPrompt(policy)}

Reponds UNIQUEMENT en JSON valide (array de ${generateCount} objets), sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Cree ${generateCount} concepts publicitaires structures.

=== LE CLIENT ===
Tension: ${context.audience_tension}
Emotion exploitable: ${context.emotional_angle}
Niveau de conscience: ${awareness}
${context.persona_desires ? `\nDESIRS PERSONA (5 niveaux): ${context.persona_desires}` : ""}
${context.persona_triggers ? `TRIGGERS: ${context.persona_triggers}` : ""}
${context.persona_language_profile ? `\n=== PROFIL LINGUISTIQUE PERSONA (UTILISER POUR LE COPY) ===
${context.persona_language_profile}
→ UTILISE ces trigger words et ce ton dans les headlines et CTA!` : ""}
${context.persona_decision_style ? `STYLE DECISION: ${context.persona_decision_style}` : ""}

=== LE PRODUIT ===
Marque: ${context.brand_name}
Produit: ${context.product_name}
Benefice cle: ${context.product_key_benefit}
Promesse: ${context.promise}
Preuve: ${context.proof}
${context.product_fab_benefits ? `\nBENEFICES FAB: ${context.product_fab_benefits}` : ""}
${context.product_usp_triptyque ? `USP TRIPTYQUE: ${context.product_usp_triptyque}` : ""}
${context.product_objections ? `OBJECTIONS: ${context.product_objections}` : ""}
${context.product_value_equation ? `VALUE EQUATION: ${context.product_value_equation}` : ""}

=== IDENTITE VISUELLE ===
Couleurs: primaire ${context.brand_visual_code.primary_color}, secondaire ${context.brand_visual_code.secondary_color}, accent ${context.brand_visual_code.accent_color}
Typo: ${context.brand_visual_code.font_style}
Ton: ${context.brand_visual_code.visual_tone}
Format: ${context.format_goal}
Contraintes: ${context.constraints.join(", ") || "aucune"}
${context.brief_summary ? `Brief: ${context.brief_summary}` : ""}
${context.brand_combat ? `Combat/Ennemi: ${context.brand_combat}` : ""}
${context.brand_values?.length ? `Valeurs: ${context.brand_values.map(v => `${v.name} (${v.signification})`).join(", ")}` : ""}
${context.red_lines?.length ? `\n⛔ RED LINES (INTERDITS ABSOLUS — NE JAMAIS VIOLER):\n${context.red_lines.map(r => `- ${r}`).join("\n")}` : ""}
${daFingerprint ? `\n${formatDAFingerprintForPrompt(daFingerprint)}` : ""}
${context.angle_epic_type ? `\n=== ANGLE MARKETING SELECTIONNE (EPIC: ${context.angle_epic_type.toUpperCase()}) ===
Core Benefit: ${context.angle_core_benefit || ""}
Terrain: ${context.angle_terrain || ""}
${context.angle_hooks?.length ? `HOOKS PRE-ECRITS (utiliser comme inspiration):\n${context.angle_hooks.map(h => `  - "${h}"`).join("\n")}` : ""}
${context.angle_narrative ? `NARRATIVE: ${context.angle_narrative}` : ""}` : ""}
${lock ? `\n=== SOCLE STRATEGIQUE ===\nThese: ${lock.campaignThesis}\nPromesse: ${lock.lockedPromise}\nPreuve: ${lock.lockedProof}` : ""}
Images produit: ${hasProductImages ? "OUI — photos du vrai packaging disponibles. Utilise render_family 'design_led' pour 1-2 concepts (fond gradient + photo produit) ET 'photo_led'/'hybrid' pour les autres." : "NON — decrire le produit visuellement. N'utilise PAS render_family 'design_led'."}

=== METHODOLOGIE ===
${(() => {
  const skeletonFormats = skeletons.map(s => s.format_family);
  const k = getKnowledgeForStage("planner", awareness, skeletonFormats);
  return [k.methodology, k.visual_rules, k.tactics].filter(Boolean).join("\n\n");
})()}

${memory && memory.totalAds > 0 ? `\n${formatCreativeMemoryDirective(memory)}\n` : ""}
=== SQUELETTES STRATEGIQUES PRE-ASSIGNES ===
${skeletonDescription}

=== FORMAT JSON (array de ${generateCount} objets) ===
[
  {
    "ad_job": "${skeletons[0].ad_job}",
    "format_family": "${skeletons[0].format_family}",
    "awareness_stage": "${awareness}",
    "marketing_lever": "${skeletons[0].marketing_lever}",

    "belief_shift": "DE '[croyance actuelle]' → VERS '[nouvelle croyance]'",
    "proof_mechanism": "ingredient|mechanism|texture|transformation|social_proof|authority|comparison|data|offer|certification",
    "proof_text": "Texte de preuve visible (ex: '4.8★ · 12 000 avis') ou null",

    "layout_family": "left_copy_right_product|center_hero_top_claim|split_screen|card_stack|quote_frame|badge_cluster|vertical_story_stack|diagonal_split|hero_with_bottom_offer|macro_with_side_copy",
    "render_family": "photo_led|design_led|hybrid",
    "rupture_structure": "hyper_scale|frozen_explosion|hybrid_fusion|dry_levitation|cutaway|mirror_symmetry|radical_minimalism|anachronism|macro_texture|visual_humor",
    "graphic_tension": "diagonal_split|framing_in_frame|low_angle_hero|negative_space_block|radial_focus|shadow_play|z_pattern|color_block_contrast|verticality|spotlight",
    "visual_style": "quiet_luxury|hyper_clean_tech|editorial_fashion|organic_earthy|vibrant_street|gritty_industrial|dreamcore|pop_high_saturation",
    "style_mode": "brand_native|brand_adjacent|stretch",
    "human_presence": "none|hand|face|body",

    "visual_device": "SCENE VISUELLE PURE 3-4 phrases. Ce qu'on VOIT uniquement.",
    "product_role": "hero|supporting|contextual|absent",
    "background_treatment": "minimal|contextual|storytelling|abstract|gradient",
    "contrast_principle": "La tension visuelle qui drive la composition",

    "headline": "3-8 mots percutants",
    "cta": "2-5 mots originaux",
    "offer_module": "null ou texte offre (ex: '-20% code REBELLE20')",
    "text_zone_spec": "top|bottom|left|right|top-left|top-right|bottom-left|bottom-right",

    "customer_insight": "Verite VIE du client, pas benefice produit",
    "learning_hypothesis": "Si cette pub performe, cela signifie que...",

    "novelty_score": 7,
    "clarity_score": 8,
    "brand_fit_score": 8,

    "realism_target": "photorealistic|stylized_photo|editorial|graphic_design|mixed_media"
  }
]`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("ConceptPlanner: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const rawConcepts = JSON.parse(jsonStr.trim()) as ConceptSpec[];

    // Validate and enrich each concept
    const concepts = rawConcepts.map((concept, i) => {
      const skeleton = skeletons[i] || skeletons[0];

      // Enforce skeleton assignments (Claude sometimes drifts)
      concept.ad_job = validateEnum(concept.ad_job, AD_JOBS, skeleton.ad_job);
      concept.marketing_lever = validateEnum(concept.marketing_lever, MARKETING_LEVERS, skeleton.marketing_lever);
      concept.format_family = validateEnum(concept.format_family, FORMAT_FAMILIES, skeleton.format_family);
      concept.awareness_stage = validateEnum(concept.awareness_stage, AWARENESS_STAGES, skeleton.awareness_stage);

      // Validate all taxonomy fields
      concept.layout_family = validateEnum(concept.layout_family, LAYOUT_FAMILIES, getDefaultLayout(concept.format_family));
      concept.proof_mechanism = validateEnum(concept.proof_mechanism, PROOF_MECHANISMS, getDefaultProof(concept.format_family));
      concept.render_family = validateEnum(concept.render_family, RENDER_FAMILIES, getDefaultRender(concept.format_family));
      concept.rupture_structure = validateEnum(concept.rupture_structure, RUPTURE_STRUCTURES, "frozen_explosion");
      concept.graphic_tension = validateEnum(concept.graphic_tension, GRAPHIC_TENSIONS, "radial_focus");
      concept.visual_style = validateEnum(concept.visual_style, VISUAL_STYLES, "hyper_clean_tech");
      concept.style_mode = validateEnum(concept.style_mode, STYLE_MODES, "brand_native");
      concept.human_presence = validateEnum(concept.human_presence, HUMAN_PRESENCES, "none");

      // Validate other fields
      concept.product_role = validateEnum(
        concept.product_role,
        ["hero", "supporting", "contextual", "absent"] as const,
        "hero"
      );
      concept.background_treatment = validateEnum(
        concept.background_treatment,
        ["minimal", "contextual", "storytelling", "abstract", "gradient"] as const,
        "minimal"
      );
      concept.text_zone_spec = validateEnum(
        concept.text_zone_spec,
        ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"] as const,
        "top"
      );
      concept.realism_target = validateEnum(
        concept.realism_target,
        ["photorealistic", "stylized_photo", "editorial", "graphic_design", "mixed_media"] as const,
        "photorealistic"
      );

      // Don't allow graphic_design without product images
      if (concept.realism_target === "graphic_design" && !hasProductImages) {
        concept.realism_target = "photorealistic";
        concept.render_family = "photo_led";
      }

      // Assign render properties deterministically
      concept.render_mode = assignRenderModeV3(concept, hasProductImages);
      concept.overlay_intent = assignOverlayIntentV3(concept);
      concept.text_density = assignTextDensityV3(concept);

      // Ensure scores are numbers in range
      concept.novelty_score = clampScore(concept.novelty_score);
      concept.clarity_score = clampScore(concept.clarity_score);
      concept.brand_fit_score = clampScore(concept.brand_fit_score);

      // Ensure required strings exist
      if (!concept.visual_device || concept.visual_device.length < 20) {
        concept.visual_device = `Scene visuelle pour ${concept.format_family} avec ${context.product_name} en role ${concept.product_role}.`;
      }
      if (!concept.headline || concept.headline.length < 2) {
        concept.headline = context.promise.slice(0, 30);
      }
      if (!concept.cta || concept.cta.length < 2) {
        concept.cta = "Découvrir";
      }
      if (!concept.belief_shift) {
        concept.belief_shift = `DE 'statu quo' → VERS '${context.promise}'`;
      }
      if (!concept.customer_insight) {
        concept.customer_insight = context.audience_tension;
      }
      if (!concept.learning_hypothesis) {
        concept.learning_hypothesis = `Si cette pub performe, l'audience réagit au levier ${concept.marketing_lever}`;
      }
      if (!concept.contrast_principle) {
        concept.contrast_principle = `Tension entre ${concept.rupture_structure} et ${concept.graphic_tension}`;
      }

      // Inject batch lock values
      if (lock) {
        concept.campaign_thesis = lock.campaignThesis;
        concept.locked_promise = lock.lockedPromise;
        concept.locked_proof = lock.lockedProof;
      }

      // Handle null offer_module from JSON
      if (concept.offer_module === null || concept.offer_module === "null") {
        concept.offer_module = undefined;
      }

      return concept;
    });

    console.log(
      "[ConceptPlanner v3] Generated concepts:",
      concepts.map((c, i) => ({
        concept: i + 1,
        job: c.ad_job,
        lever: c.marketing_lever,
        format: c.format_family,
        render: c.render_family,
        style: c.visual_style,
        headline: c.headline,
        novelty: c.novelty_score,
      }))
    );

    return concepts;
  } catch (e) {
    console.error("[ConceptPlanner v3] JSON parse error:", jsonStr.slice(0, 400));
    throw new Error(`ConceptPlanner: JSON invalide — ${(e as Error).message}`);
  }
}

// ─── RENDER MODE ASSIGNMENT (v3, ConceptSpec-aware) ─────────

function assignRenderModeV3(concept: ConceptSpec, hasProductImages?: boolean): RenderMode {
  if (hasProductImages && concept.render_family === "photo_led" && concept.product_role === "hero") {
    if (concept.ad_job === "handle_objection" || concept.ad_job === "prove") {
      return "product_first";
    }
  }
  return "scene_first";
}

function assignOverlayIntentV3(concept: ConceptSpec): OverlayIntent {
  // Convert offer → full ad
  if (concept.ad_job === "convert_offer" || concept.offer_module) {
    return "full_ad";
  }
  // Scroll stop → minimal (let the image do the work)
  if (concept.ad_job === "scroll_stop") {
    return "minimal";
  }
  // Proof-heavy formats → badge proof
  if (concept.proof_mechanism === "social_proof" || concept.proof_mechanism === "data" || concept.proof_mechanism === "certification") {
    return "badge_proof";
  }
  // Objection handling → full ad
  if (concept.ad_job === "handle_objection") {
    return "full_ad";
  }
  return "headline_cta";
}

function assignTextDensityV3(concept: ConceptSpec): TextDensity {
  if (concept.ad_job === "scroll_stop") return "low";
  if (concept.ad_job === "convert_offer") return "high";
  if (concept.ad_job === "handle_objection") return "medium";
  if (concept.ad_job === "educate") return "medium";
  return "medium";
}

// ─── UTILITIES ──────────────────────────────────────────────

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function validateEnum<T extends string>(
  value: T | undefined,
  validValues: readonly T[],
  fallback: T
): T {
  if (value && validValues.includes(value)) return value;
  return fallback;
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

// ============================================================
// LEGACY: planCreatives() — @deprecated
// Kept for backward compat during migration.
// Will be removed once pipeline.ts is fully on v3.
// ============================================================

const ALL_ANGLES: MarketingAngle[] = [
  "desire", "fear", "objection", "identity", "social_proof",
  "disruption", "aspiration", "curiosity", "urgency", "guilt_relief",
];

function selectAnglesForBatch(count: number): MarketingAngle[] {
  const pool = shuffle([...ALL_ANGLES]);
  const selected: MarketingAngle[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(pool[i % pool.length]);
  }
  return selected;
}

/** @deprecated Use planConcepts() instead. */
export async function planCreatives(
  context: FilteredContext,
  count: number,
  lock?: BatchLockConfig,
  hasProductImages?: boolean
): Promise<CreativeBrief[]> {
  const client = getClient();
  const angles = selectAnglesForBatch(count);
  const anglesDescription = angles
    .map((angle, i) => `Concept ${i + 1}: angle "${angle}"`)
    .join("\n");

  const response = await callClaudeWithRetry(() => client.messages.create({
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

1. **customer_insight** = La VERITE CLIENT specifique que cette pub exploite.
2. **marketing_angle** = Le levier psychologique PRECIS.
3. **learning_hypothesis** = Ce qu'on APPREND si ce visuel performe.
4. **single_visual_idea** = SCENE VISUELLE PURE en 3-4 phrases.
5. **creative_archetype** = Un label LIBRE.
6. **headline_suggestion** = Punchline 3-8 mots.
7. **cta_suggestion** = CTA original, 2-5 mots.
8. Chaque concept = RADICALEMENT different.

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
Images produit: ${hasProductImages ? "OUI" : "NON"}

=== METHODOLOGIE ===
${(() => {
  const awareness = (context.awareness_level || "problem_aware") as AwarenessLevel;
  const k = getKnowledgeForStage("planner", awareness);
  return [k.methodology, k.visual_rules, k.tactics].filter(Boolean).join("\n\n");
})()}

=== LEVIERS ASSIGNES ===
${anglesDescription}

=== FORMAT JSON (array de ${count} objets) ===
[
  {
    "customer_insight": "Verite VIE client",
    "marketing_angle": "${angles[0]}",
    "learning_hypothesis": "Si cette pub performe...",
    "hook_type": "pattern_interrupt|curiosity_gap|social_proof_shock|before_after|us_vs_them|emotional_mirror|instant_benefit|fear_of_missing|authority_signal|identity_call",
    "creative_archetype": "Label libre",
    "single_visual_idea": "Scene visuelle pure 3-4 phrases",
    "promise": "Promesse 1 phrase",
    "proof_to_show": "Preuve visuelle",
    "emotional_mechanic": "Emotion + comment",
    "awareness_level": "${context.awareness_level}",
    "meta_goal": "Objectif Meta",
    "why_this_should_stop_scroll": "Raison psychologique",
    "risks": "Risque concret",
    "copy_safe_zone": "top|bottom|left|right|top-left|top-right|bottom-left|bottom-right",
    "realism_target": "photorealistic|stylized_photo|editorial|graphic_design|mixed_media",
    "headline_suggestion": "Punchline 3-8 mots",
    "cta_suggestion": "CTA 2-5 mots"
  }
]`,
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Creative planner: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const briefs = JSON.parse(jsonStr.trim()) as CreativeBrief[];

    briefs.forEach((brief, i) => {
      if (!ALL_ANGLES.includes(brief.marketing_angle as MarketingAngle)) {
        brief.marketing_angle = angles[i];
      }
      if (!brief.customer_insight) {
        brief.customer_insight = `Insight lié au levier ${angles[i]}`;
      }
      if (!brief.learning_hypothesis) {
        brief.learning_hypothesis = `Si cette pub performe, l'audience réagit au levier ${angles[i]}`;
      }
      if (lock) {
        brief.campaignThesis = lock.campaignThesis;
        brief.lockedPromise = lock.lockedPromise;
        brief.lockedProof = lock.lockedProof;
      }
      const renderProps = assignRenderProperties(brief, context, !!hasProductImages);
      brief.renderMode = renderProps.renderMode;
      brief.overlayIntent = renderProps.overlayIntent;
      brief.textDensity = renderProps.textDensity;
    });

    return briefs;
  } catch (e) {
    console.error("[CreativePlanner] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`Creative planner: JSON invalide — ${(e as Error).message}`);
  }
}
