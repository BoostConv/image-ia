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
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import { smartTruncateHeadline } from "./headline-utils";
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
  FORMAT_LAYOUT_MAP,
  formatTaxonomyForPrompt,
  formatTaxonomyCompactForPrompt,
  formatLayoutCompatibilityForPrompt,
  getCompatibleFormats,
  getCompatibleLayouts,
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
import type { FewShotExample } from "../db/queries/creative-memory";
import { formatFewShotDirective } from "../db/queries/creative-memory";
import type { LayoutAnalysis } from "../db/schema";
import { formatLayoutAnalysisCompact } from "./layout-analyzer";
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
  layout_family: LayoutFamily;
  awareness_stage: AwarenessStage;
}

/**
 * Generate diverse strategic skeletons for a batch.
 * Ensures each concept has a different ad_job + marketing_lever + layout combo.
 * Layouts are pre-assigned to guarantee diversity across the batch.
 * If forcedLayouts is provided, those layouts are used (round-robin if fewer than count).
 */
function generateSkeletons(
  count: number,
  awareness: AwarenessStage,
  forcedLayouts?: LayoutFamily[],
  memory?: CreativeMemory,
): ConceptSkeleton[] {
  // Sort jobs and levers by LEAST RECENTLY USED (memory-aware)
  const jobs = sortByLeastUsed([...AD_JOBS], memory?.ad_jobs);
  const levers = sortByLeastUsed([...MARKETING_LEVERS], memory?.marketing_levers);

  const skeletons: ConceptSkeleton[] = [];
  const usedLayouts = new Set<LayoutFamily>();

  for (let i = 0; i < count; i++) {
    const job = jobs[i % jobs.length];
    const lever = levers[i % levers.length];

    // Get compatible formats for this job + awareness
    const compatFormats = getCompatibleFormats(job, awareness);
    const format = compatFormats[i % compatFormats.length];

    let layout: LayoutFamily;

    if (forcedLayouts && forcedLayouts.length > 0) {
      // User forced specific layouts — round-robin through them
      layout = forcedLayouts[i % forcedLayouts.length];
    } else {
      // Auto-pick: prioritize layouts NOT used recently (memory-aware)
      const compatLayouts = sortByLeastUsed(
        [...getCompatibleLayouts(format)],
        memory?.layout_families,
      );
      layout = compatLayouts[0]; // fallback (least used)
      for (const candidate of compatLayouts) {
        if (!usedLayouts.has(candidate)) {
          layout = candidate;
          break;
        }
      }
    }
    usedLayouts.add(layout);

    skeletons.push({
      ad_job: job,
      marketing_lever: lever,
      format_family: format,
      layout_family: layout,
      awareness_stage: awareness,
    });
  }

  return skeletons;
}

/**
 * Sort items by least recently used based on creative memory.
 * Items with 0 or no usage come first (shuffled), then ascending by usage count.
 */
function sortByLeastUsed<T extends string>(items: T[], usageMap?: Record<string, number>): T[] {
  if (!usageMap || Object.keys(usageMap).length === 0) {
    return shuffle(items);
  }
  // Split into never-used and used
  const neverUsed = items.filter(item => !usageMap[item]);
  const used = items.filter(item => usageMap[item]);
  // Shuffle never-used for variety, sort used ascending
  return [
    ...shuffle(neverUsed),
    ...used.sort((a, b) => (usageMap[a] || 0) - (usageMap[b] || 0)),
  ];
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
  forcedLayoutFamilies?: LayoutFamily[],
  fewShotExamples?: FewShotExample[],
  layoutAnalyses?: Map<string, LayoutAnalysis>,
  creativityLevel?: 1 | 2 | 3,
): Promise<{ concepts: ConceptSpec[]; claudeSystemPrompt: string; claudeUserPrompt: string }> {
  const client = getClient();
  const awareness = (context.awareness_level || "problem_aware") as AwarenessStage;
  const level = creativityLevel || 2;

  // Generate exactly the requested count (no over-generation)
  const generateCount = count;

  // Creativity level directives
  const creativityDirective = level === 1
    ? `## MODE CLASSIQUE (niveau 1)
- Rester dans les codes publicitaires prouves et efficaces.
- Privilegier la clarte, la lisibilite et le professionnalisme.
- Pas de prise de risque creative — fiabilite maximale.
- Chaque concept doit ressembler a une pub Meta classique qui performe.
- Utiliser des formats et des angles EPROUVES dans la categorie.`
    : level === 3
    ? `## MODE EXPERIMENTAL (niveau 3)
- AUCUNE LIMITE CREATIVE. Oser l'inattendu, le jamais-vu, le provocant (dans le respect de la marque).
- Chaque concept DOIT surprendre — si ca ressemble a une pub deja vue, RECOMMENCER.
- Explorer des METAPHORES VISUELLES audacieuses, des contrastes forts, des emotions inhabituelles.
- Melanger les registres : humour noir + luxe, naivete + tech, chaos + minimalisme.
- AU MOINS 2 concepts sur ${generateCount} doivent etre "experimentaux" : angle ou visual_device jamais vu dans cette categorie.
- Emprunter des codes visuels a D'AUTRES INDUSTRIES : mode, art contemporain, cinema, architecture, gastronomie, sport.
- Les headlines peuvent etre provocantes, decalees, ironiques.
- Le customer_insight doit toucher une verite PROFONDE et inattendue.`
    : `## MODE CREATIF (niveau 2)
- Equilibrer performance prouvee et originalite.
- AU MOINS 1 concept sur ${generateCount} doit etre "audacieux" : angle inattendu ou visual_device surprenant.
- Varier les registres emotionnels : ne pas rester dans le meme ton.
- Explorer des scenes visuelles inedites tout en restant comprehensible en 1 seconde.`;

  console.log(`[ConceptPlanner] Creativity level: ${level} (${level === 1 ? "classique" : level === 3 ? "experimental" : "creatif"})`);

  // Pre-assign strategic skeletons (respect user-forced layouts if any)
  const skeletons = generateSkeletons(generateCount, awareness, forcedLayoutFamilies, memory);
  const skeletonDescription = skeletons
    .map(
      (s, i) =>
        `Concept ${i + 1}: ad_job="${s.ad_job}", marketing_lever="${s.marketing_lever}", format_family="${s.format_family}", layout_family="${s.layout_family}"`
    )
    .join("\n");

  // Build layout compatibility guide for the prompt
  const skeletonFormats = skeletons.map(s => s.format_family);
  const layoutCompatibility = formatLayoutCompatibilityForPrompt(skeletonFormats);

  // Build brand context block (BEFORE rules, so Claude frames creativity within brand)
  const brandContextBlock = [
    formatPolicyForPrompt(policy),
    daFingerprint ? `=== IDENTITE VISUELLE OBSERVEE ===\n${formatDAFingerprintForPrompt(daFingerprint)}\n→ Respecter le socle visuel observe. Explorer dans les limites de la marque.` : "",
  ].filter(Boolean).join("\n\n");

  const claudeSystemPrompt = `Tu es un directeur creatif senior specialise en ads statiques Meta/Instagram. Tu combines direction artistique, copywriting direct-response et strategie marketing.

PRIORITES (en cas de conflit) : 1. Clarte en 1 seconde > 2. Emotion headline > 3. Originalite visuelle > 4. Diversite batch

## METHODE
AD_JOB (mission funnel) → FORMAT_FAMILY (structure pub) → PROOF_MECHANISM (comment prouver) → VISUAL_DEVICE (scene visuelle). Emotion d'abord (headline), logique ensuite (sous-texte).

${brandContextBlock ? `${brandContextBlock}\n` : ""}${creativityDirective}

## REGLES
1. **visual_device** = SCENE VISUELLE PURE (3-4 phrases). Uniquement ce qu'on VOIT. JAMAIS de texte, typo, badges, fleches, chiffres, graphiques, infographies. Gemini genere mal les elements graphiques complexes.
2. **headline** = FRANCAIS, 15 mots MAX (viser 5-8). Phrase COMPLETE — JAMAIS coupee. INTERDIT de finir sur un article/preposition (de, du, des, a, la, le, les, un, une, que, qui, pour, avec, en, au, sur, par, son, sa, ses, votre, ton, ta). Specifique au produit ET au persona, ancre dans le PRESENT du client. Pas de claims medicales, stats inventees, ni dates.
3. **belief_shift** = "DE '[croyance actuelle]' → VERS '[nouvelle croyance]'" — precis et specifique.
4. **customer_insight** = Verite sur la VIE du client, pas un benefice produit.
5. **cta** = 2-5 mots, action concrete. JAMAIS "Acheter maintenant", "En savoir plus".
6. Chaque concept = RADICALEMENT different : levier, scene, emotion, layout.
7. Composition SIMPLE : max 3 elements visuels, espace negatif pour le texte, pas de split-screen complexe.
8. Champs taxonomiques : TOUJOURS choisir dans les listes fermees ci-dessous.

## UTILISATION DES DONNEES CONTEXTUELLES
- DESIRS PERSONA : L1-L2 = headlines/CTA concrets | L3 = emotion du visual_device | L4-L5 = belief_shift profond
- PROBLEMES DUR : scroll_stop → le plus DOULOUREUX | handle_objection → le plus URGENT | educate → le plus RECONNU
- TRANSFORMATIONS : prove/avant_apres → la plus visuelle | desire → headline sur l'APRES | fear → headline sur l'AVANT
- CITATIONS CLIENTS : inspiration pour headlines (reformuler, pas copier)
- PSYCHOLOGIE ACHAT : handle_objection → adresser la DEFENSE | prove → TRUST BUILDERS | scroll_stop → contourner les RESISTANCES
- PROFIL LINGUISTIQUE : utiliser les trigger words et le ton dans headlines et CTA
- SOCLE STRATEGIQUE : quand present, PRIME sur la promesse/preuve du produit

## EXEMPLE DE BON CONCEPT
{
  "ad_job": "scroll_stop",
  "format_family": "before_after",
  "marketing_lever": "desire",
  "layout_family": "split_comparison",
  "render_family": "photo_led",
  "human_presence": "hand",
  "visual_device": "A gauche, une main fatiguee tient un cafe froid dans un bureau gris et encombre. A droite, la meme main, energique, tient le produit dans une cuisine lumineuse et rangee, baignee de lumiere matinale dorée.",
  "headline": "Tu merites mieux que ton 3eme cafe",
  "cta": "Essayer le vrai boost",
  "belief_shift": "DE 'le cafe suffit pour tenir' → VERS 'il existe une energie saine qui dure'",
  "customer_insight": "Il sait que le cafe est un pansement, mais il n'a jamais trouve d'alternative qui tient vraiment sa promesse"
}
→ Pourquoi ca marche : scene visuelle SIMPLE (2 zones, 1 contraste), headline ancrée dans le quotidien du client, belief_shift precis, customer_insight = verite de VIE (pas benefice produit).

${formatTaxonomyCompactForPrompt()}

Reponds UNIQUEMENT en JSON valide (array de ${generateCount} objets), sans texte avant ou apres.`;

  // ── Deduplicate brand rules ──
  // RED LINES, RÈGLES CONCEPT, and RÈGLES COPY can overlap (global rules are merged into all 3).
  // Deduplicate into a single block to avoid noise.
  const allRules: string[] = [];
  const seenRules = new Set<string>();
  const addRules = (rules: string[] | undefined, prefix: string) => {
    if (!rules?.length) return;
    for (const r of rules) {
      const normalized = r.toLowerCase().trim();
      if (!seenRules.has(normalized)) {
        seenRules.add(normalized);
        allRules.push(`- [${prefix}] ${r}`);
      }
    }
  };
  addRules(context.red_lines, "INTERDIT");
  addRules(context.brand_rules_concept, "CONCEPT");
  addRules(context.brand_rules_copy, "COPY");

  // ── Brief directive adapts to count ──
  const briefDirective = context.brief_summary
    ? generateCount === 1
      ? `\n=== BRIEF UTILISATEUR (PRIORITE HAUTE) ===\n${context.brief_summary}\n→ Le concept DOIT explorer cette direction.\n`
      : `\n=== BRIEF UTILISATEUR (PRIORITE HAUTE) ===\n${context.brief_summary}\n→ AU MOINS ${Math.min(2, generateCount)} concepts sur ${generateCount} doivent explorer cette direction.\n`
    : "";

  // ── Layout analysis: compact for planner, full for art-director ──
  const layoutAnalysisBlock = (() => {
    if (!layoutAnalyses || layoutAnalyses.size === 0) return "";
    const lines: string[] = ["=== LAYOUTS ASSIGNES (structure) ==="];
    const seen = new Set<string>();
    for (const s of skeletons) {
      if (seen.has(s.layout_family)) continue;
      seen.add(s.layout_family);
      const analysis = layoutAnalyses.get(s.layout_family);
      if (analysis) {
        lines.push(formatLayoutAnalysisCompact(s.layout_family, analysis));
      }
    }
    if (lines.length <= 1) return "";
    return lines.join("\n");
  })();

  const claudeUserPrompt = `Cree ${generateCount} concepts publicitaires structures.

=== LE CLIENT ===
Tension: ${context.audience_tension}
Emotion exploitable: ${context.emotional_angle}
Niveau de conscience: ${awareness}
${context.persona_desires ? `DESIRS PERSONA (5 niveaux): ${context.persona_desires}` : ""}
${context.persona_triggers ? `TRIGGERS: ${context.persona_triggers}` : ""}
${context.persona_language_profile ? `PROFIL LINGUISTIQUE: ${context.persona_language_profile}` : ""}
${context.persona_decision_style ? `STYLE DECISION: ${context.persona_decision_style}` : ""}
${context.persona_buying_psychology ? `PSYCHOLOGIE ACHAT: ${context.persona_buying_psychology}` : ""}

=== LE PRODUIT ===
Marque: ${context.brand_name}
Produit: ${context.product_name}
Benefice cle: ${context.product_key_benefit}
Promesse: ${context.promise}
Preuve: ${context.proof}
${context.product_fab_benefits ? `BENEFICES FAB: ${context.product_fab_benefits}` : ""}
${context.product_usp_triptyque ? `USP TRIPTYQUE: ${context.product_usp_triptyque}` : ""}
${context.product_objections ? `OBJECTIONS: ${context.product_objections}` : ""}
${context.product_value_equation ? `VALUE EQUATION: ${context.product_value_equation}` : ""}
${context.product_dur_problems ? `PROBLEMES DUR: ${context.product_dur_problems}` : ""}
${context.product_before_after ? `TRANSFORMATIONS: ${context.product_before_after}` : ""}
${context.product_review_quotes ? `CITATIONS CLIENTS: ${context.product_review_quotes}` : ""}

=== IDENTITE VISUELLE ===
Couleurs: primaire ${context.brand_visual_code.primary_color}, secondaire ${context.brand_visual_code.secondary_color}, accent ${context.brand_visual_code.accent_color}
Typo: ${context.brand_visual_code.font_style}
Ton: ${context.brand_visual_code.visual_tone}
Format: ${context.format_goal}
Contraintes: ${context.constraints.join(", ") || "aucune"}
${briefDirective}${context.brand_combat ? `Combat/Ennemi: ${context.brand_combat}` : ""}
${context.brand_values?.length ? `Valeurs: ${context.brand_values.map(v => `${v.name} (${v.signification})`).join(", ")}` : ""}
${allRules.length > 0 ? `\n⛔ REGLES MARQUE (INTERDITS — NE JAMAIS VIOLER):\n${allRules.join("\n")}` : ""}
${context.angle_epic_type ? `\n=== ANGLE MARKETING (EPIC: ${context.angle_epic_type.toUpperCase()}) ===
Core Benefit: ${context.angle_core_benefit || ""}
Terrain: ${context.angle_terrain || ""}
${context.angle_hooks?.length ? `HOOKS (inspiration):\n${context.angle_hooks.map(h => `  - "${h}"`).join("\n")}` : ""}
${context.angle_narrative ? `NARRATIVE: ${context.angle_narrative}` : ""}
${context.angle_visual_direction ? `DIRECTION VISUELLE: ${context.angle_visual_direction}` : ""}` : ""}
${lock ? `\n=== SOCLE STRATEGIQUE (PRIME SUR LE PRODUIT) ===\nThese: ${lock.campaignThesis}\nPromesse: ${lock.lockedPromise}\nPreuve: ${lock.lockedProof}` : ""}
Images produit: ${hasProductImages ? "OUI — photos du vrai packaging disponibles. Utilise render_family 'design_led' pour 1-2 concepts (fond gradient + photo produit) ET 'photo_led'/'hybrid' pour les autres." : "NON — decrire le produit visuellement. N'utilise PAS render_family 'design_led'."}

=== METHODOLOGIE ===
${(() => {
  const skeletonFormats = skeletons.map(s => s.format_family);
  const brandTone = context.brand_visual_code.visual_tone;
  const k = getKnowledgeForStage("planner", awareness, skeletonFormats, brandTone);
  return [k.methodology, k.visual_rules, k.tactics].filter(Boolean).join("\n\n");
})()}

${memory && memory.totalAds > 0 ? `\n${formatCreativeMemoryDirective(memory)}\n` : ""}
${fewShotExamples && fewShotExamples.length > 0 ? `\n${formatFewShotDirective(fewShotExamples)}\n` : ""}
=== SQUELETTES STRATEGIQUES PRE-ASSIGNES ===
${skeletonDescription}
${level === 3 ? "\n→ MODE EXPERIMENTAL: Tu PEUX changer l'ad_job et le marketing_lever si tu trouves une combinaison plus surprenante. Le layout_family et format_family restent fixes.\n" : ""}

${layoutCompatibility}

${layoutAnalysisBlock}

=== FORMAT JSON (array de ${generateCount} objets) ===
[
  {
    "ad_job": "${skeletons[0].ad_job}",
    "format_family": "${skeletons[0].format_family}",
    "awareness_stage": "${awareness}",
    "marketing_lever": "${skeletons[0].marketing_lever}",
    "layout_family": "${skeletons[0].layout_family}",
    "render_family": "photo_led|design_led|hybrid",
    "human_presence": "none|hand|face|body",

    "visual_device": "SCENE VISUELLE PURE 3-4 phrases. Ce qu'on VOIT uniquement.",
    "product_role": "hero|supporting|contextual|absent",
    "text_zone_spec": "top|bottom|left|right|top-left|top-right|bottom-left|bottom-right",

    "headline": "PUNCHLINE complete (15 mots MAX, vise 5-8)",
    "cta": "2-5 mots originaux en francais",

    "belief_shift": "DE '[croyance actuelle]' → VERS '[nouvelle croyance]'",
    "customer_insight": "Verite sur la VIE du client",
    "contrast_principle": "Tension visuelle qui cree l'impact"
  }
]`;

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 12000,
      system: claudeSystemPrompt,
      messages: [
        {
          role: "user",
          content: claudeUserPrompt,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("ConceptPlanner: pas de reponse textuelle de Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const rawConcepts = JSON.parse(jsonStr.trim()) as ConceptSpec[];

    // Validate and enrich each concept
    const concepts = rawConcepts.map((concept, i) => {
      const skeleton = skeletons[i] || skeletons[0];

      // Enforce skeleton assignments (Claude sometimes drifts)
      // In experimental mode (level 3), accept Claude's ad_job/lever if valid (don't force skeleton)
      concept.ad_job = validateEnum(concept.ad_job, AD_JOBS, skeleton.ad_job);
      concept.marketing_lever = validateEnum(concept.marketing_lever, MARKETING_LEVERS, skeleton.marketing_lever);
      if (level < 3) {
        // In classique/creatif mode, force skeleton values
        concept.ad_job = skeleton.ad_job;
        concept.marketing_lever = skeleton.marketing_lever;
      }
      concept.format_family = validateEnum(concept.format_family, FORMAT_FAMILIES, skeleton.format_family);
      concept.awareness_stage = validateEnum(concept.awareness_stage, AWARENESS_STAGES, skeleton.awareness_stage);

      // Enforce layout_family from skeleton (pre-assigned for diversity)
      // In experimental mode, accept Claude's layout choice if valid
      if (level === 3) {
        concept.layout_family = validateEnum(concept.layout_family, LAYOUT_FAMILIES, skeleton.layout_family);
      } else {
        concept.layout_family = skeleton.layout_family;
      }
      concept.render_family = validateEnum(concept.render_family, RENDER_FAMILIES, getDefaultRender(concept.format_family));
      concept.human_presence = validateEnum(concept.human_presence, HUMAN_PRESENCES, "none");
      concept.product_role = validateEnum(
        concept.product_role,
        ["hero", "supporting", "contextual", "absent"] as const,
        "hero"
      );
      concept.text_zone_spec = validateEnum(
        concept.text_zone_spec,
        ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"] as const,
        "top"
      );

      // Fill defaults for fields no longer asked from Claude (kept for DB compat)
      concept.proof_mechanism = validateEnum(concept.proof_mechanism, PROOF_MECHANISMS, getDefaultProof(concept.format_family));
      concept.rupture_structure = validateEnum(concept.rupture_structure, RUPTURE_STRUCTURES, "frozen_explosion");
      concept.graphic_tension = validateEnum(concept.graphic_tension, GRAPHIC_TENSIONS, "radial_focus");
      concept.visual_style = validateEnum(concept.visual_style, VISUAL_STYLES, "hyper_clean_tech");
      concept.style_mode = validateEnum(concept.style_mode, STYLE_MODES, "brand_native");
      concept.background_treatment = validateEnum(
        concept.background_treatment,
        ["minimal", "contextual", "storytelling", "abstract", "gradient"] as const,
        concept.render_family === "design_led" ? "gradient" : "contextual"
      );

      // Derive realism_target from render_family
      concept.realism_target = concept.render_family === "design_led"
        ? (hasProductImages ? "graphic_design" : "photorealistic")
        : concept.render_family === "hybrid" ? "mixed_media" : "photorealistic";

      // Don't allow graphic_design without product images
      if (concept.realism_target === "graphic_design" && !hasProductImages) {
        concept.realism_target = "photorealistic";
        concept.render_family = "photo_led";
      }

      // Assign render properties deterministically
      concept.render_mode = assignRenderModeV3(concept, hasProductImages);
      concept.overlay_intent = assignOverlayIntentV3(concept);
      concept.text_density = assignTextDensityV3(concept);

      // Fill default scores (no longer self-assessed)
      concept.novelty_score = 5;
      concept.clarity_score = 5;
      concept.brand_fit_score = 5;

      // Ensure required strings exist
      if (!concept.visual_device || concept.visual_device.length < 20) {
        concept.visual_device = `Scene visuelle pour ${concept.format_family} avec ${context.product_name} en role ${concept.product_role}.`;
      }
      // Fix incomplete visual_device — ensure it ends on a complete sentence
      concept.visual_device = fixIncompleteText(concept.visual_device);

      if (!concept.headline || concept.headline.length < 2) {
        concept.headline = context.promise.slice(0, 30);
      }
      // Enforce headline completeness — max 8 words, no dangling prepositions
      concept.headline = enforceHeadlineLength(concept.headline);

      if (!concept.cta || concept.cta.length < 2) {
        concept.cta = "Découvrir";
      }
      // Enforce CTA max 5 words
      const ctaWords = concept.cta.trim().split(/\s+/);
      if (ctaWords.length > 5) {
        concept.cta = ctaWords.slice(0, 5).join(" ");
      }

      // Keep Claude's creative fields when available — only fallback if truly empty
      if (!concept.belief_shift?.trim()) {
        concept.belief_shift = `DE 'statu quo' → VERS '${context.promise}'`;
      }
      if (!concept.customer_insight?.trim()) {
        concept.customer_insight = context.audience_tension;
      }
      if (!concept.learning_hypothesis?.trim()) {
        concept.learning_hypothesis = `Si cette pub performe, l'audience réagit au levier ${concept.marketing_lever}`;
      }
      if (!concept.contrast_principle?.trim()) {
        concept.contrast_principle = `${concept.format_family} — ${concept.render_family}`;
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
        layout: c.layout_family,
        render: c.render_family,
        style: c.visual_style,
        headline: c.headline,
        novelty: c.novelty_score,
      }))
    );

    // Log layout distribution for monitoring
    const layoutCounts: Record<string, number> = {};
    concepts.forEach(c => { layoutCounts[c.layout_family] = (layoutCounts[c.layout_family] || 0) + 1; });
    console.log("[ConceptPlanner v3] Layout distribution:", layoutCounts);

    return { concepts, claudeSystemPrompt, claudeUserPrompt };
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

/**
 * Fix incomplete text (visual_device, etc.) that got cut mid-sentence.
 * Truncates back to the last complete sentence (ending with . ! or ?).
 * If no complete sentence found, adds a period.
 */
function fixIncompleteText(text: string): string {
  if (!text) return text;

  const trimmed = text.trim();

  // Already ends with sentence-ending punctuation
  if (/[.!?]$/.test(trimmed)) return trimmed;

  // Find the last complete sentence
  const lastPeriod = Math.max(
    trimmed.lastIndexOf(". "),
    trimmed.lastIndexOf("! "),
    trimmed.lastIndexOf("? "),
  );

  // Also check for sentence-ending punctuation at the very end of a clause
  const lastTerminator = Math.max(
    trimmed.lastIndexOf("."),
    trimmed.lastIndexOf("!"),
    trimmed.lastIndexOf("?"),
  );

  if (lastTerminator > trimmed.length * 0.5) {
    // There's a sentence terminator in the second half — cut there
    return trimmed.slice(0, lastTerminator + 1);
  }

  if (lastPeriod > trimmed.length * 0.3) {
    // There's a complete sentence before the cut — use it
    return trimmed.slice(0, lastPeriod + 1);
  }

  // No good break point — just add a period to close it
  return trimmed + ".";
}

/** Alias for shared smart truncation utility */
const enforceHeadlineLength = smartTruncateHeadline;

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

  const jsonStr = extractJsonFromResponse(textContent.text);

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
