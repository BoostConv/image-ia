import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: PSYCHOLOGY & STRATEGY
// Source: PDF5 — Schwartz matrix, Mindstates, Emotion wheel
// Regulatory focus theory + cognitive biases + emotional mechanics.
// ============================================================

/**
 * Regulatory Focus Theory (Will Leach / Marketing to Mindstates).
 * Every prospect oscillates between two motivational profiles.
 */
export const MINDSTATE_PROFILES = {
  optimist: {
    label: "Optimiste (Promotion Focus)",
    wants: "Gagner, reussir, plaisir, devenir meilleur",
    bias_to_use: "Idealisation, Exclusivite, Achievement",
    trigger: "Montrer la victoire finale, le resultat desire",
    visual_tone: "Aspirationnel, lumineux, energique",
    headline_style: "desire",
    example: "Soyez vous-meme, en plus fort",
  },
  prudent: {
    label: "Prudent (Prevention Focus)",
    wants: "Eviter la douleur, pas perdre d'argent, securite",
    bias_to_use: "Aversion a la Perte, Autorite, Preuve Sociale",
    trigger: "Montrer le risque evite, la securite obtenue",
    visual_tone: "Rassurant, autoritaire, sobre",
    headline_style: "pain",
    example: "Ne laissez pas votre poids vous freiner",
  },
} as const;

/**
 * Key cognitive biases and when to use them.
 */
export const COGNITIVE_BIASES = {
  loss_aversion: {
    name: "Aversion a la perte",
    principle: "Losing hurts 2x more than gaining feels good",
    when: "Prevention focus, problem_aware, product_aware",
    application: "Frame as what they'll LOSE by not acting",
    example: "Ne perdez pas 3h/jour a cause de...",
  },
  social_proof: {
    name: "Preuve sociale",
    principle: "If everyone does it, it must be safe/good",
    when: "Prudent profile, solution_aware, product_aware",
    application: "Show numbers, testimonials, crowd validation",
    example: "100 000 utilisateurs satisfaits",
  },
  scarcity: {
    name: "Rarete",
    principle: "Scarce = valuable, triggers FOMO",
    when: "Most_aware, impulse products",
    application: "Limited stock, time-limited offers",
    example: "Plus que 5 unites / Finit ce soir",
  },
  authority: {
    name: "Autorite",
    principle: "Expert validation transfers credibility",
    when: "Solution_aware, product_aware (skeptical)",
    application: "Expert endorsement, lab coats, media logos",
    example: "Recommande par les dermatologues",
  },
  curiosity_gap: {
    name: "Boucle ouverte (Curiosity Gap)",
    principle: "Brain MUST close an open information loop",
    when: "Unaware, problem_aware",
    application: "Promise info without revealing it. Tease.",
    example: "Le secret que les dentistes cachent",
  },
  implicit_egotism: {
    name: "Egoisme implicite",
    principle: "We trust what resembles us or names us",
    when: "Strong identity audience (profession, passion, city)",
    application: "Name the audience explicitly in the ad",
    example: "Approuve par les snobs du cafe",
  },
  temporal_discounting: {
    name: "Actualisation temporelle",
    principle: "Brain irrationally values immediate pleasure over future gain",
    when: "Immediate-result products, most_aware",
    application: "Promise instant results, speed",
    example: "Sentez-vous mieux en 2 minutes",
  },
  perceptual_fluency: {
    name: "Fluidite perceptuelle",
    principle: "If it LOOKS simple, brain judges it as true and safe",
    when: "Technical/high-risk products",
    application: "Clean design, readable fonts, minimal elements",
    example: "Design epure = credibilite accrue",
  },
  barnum_effect: {
    name: "Effet Barnum",
    principle: "People believe vague personality descriptions are specific to them",
    when: "Problem_aware, targeting broad audience",
    application: "Use statements that feel personal but apply to many",
    example: "Vous avez du mal a dormir certaines nuits?",
  },
  von_restorff: {
    name: "Effet Von Restorff",
    principle: "The different item in a group is remembered",
    when: "Saturated market, unaware",
    application: "Break visual pattern of the feed (B&W, inverted, unusual format)",
    example: "Image N&B dans un feed colore",
  },
} as const;

/**
 * Emotion wheel — primary emotions for ad creation.
 */
export const EMOTION_WHEEL = {
  primary_negative: ["fear", "anger", "frustration", "shame", "guilt", "anxiety"],
  primary_positive: ["desire", "pride", "relief", "excitement", "belonging", "curiosity"],
  emotional_sequence: {
    agitation: "Start by activating the pain (fear, frustration, shame)",
    bridge: "Create empathy — 'I understand / It's not your fault'",
    resolution: "Introduce the product as emotional relief",
    projection: "Show the desired emotional state AFTER using the product",
  },
} as const;

/**
 * Pattern Interrupt techniques for unaware markets.
 */
export const PATTERN_INTERRUPT = {
  wtf_visual: "Force brain to ask 'What is this?' — open loop that must be closed",
  physical_contradiction: "Show action that contradicts expected result",
  sensory_contrast: "B&W in color feed, silence in noisy context, unusual texture",
  scale_distortion: "Objects at wrong scale create curiosity",
  context_violation: "Product in unexpected environment",
} as const;

/**
 * Get the right mindstate profile based on awareness level.
 */
export function getMindstateForAwareness(awareness: AwarenessLevel): "optimist" | "prudent" | "both" {
  switch (awareness) {
    case "unaware": return "optimist"; // curiosity-driven
    case "problem_aware": return "prudent"; // pain-driven
    case "solution_aware": return "prudent"; // risk-averse comparison
    case "product_aware": return "both"; // varies
    case "most_aware": return "optimist"; // desire-driven
    default: return "both";
  }
}

/**
 * Get relevant biases for a given awareness level.
 */
export function getBiasesForAwareness(awareness: AwarenessLevel): string[] {
  const biasMap: Record<AwarenessLevel, string[]> = {
    unaware: ["curiosity_gap", "von_restorff", "implicit_egotism"],
    problem_aware: ["barnum_effect", "loss_aversion", "curiosity_gap"],
    solution_aware: ["authority", "social_proof", "perceptual_fluency"],
    product_aware: ["social_proof", "authority", "loss_aversion", "temporal_discounting"],
    most_aware: ["scarcity", "temporal_discounting", "social_proof"],
  };
  return biasMap[awareness] || biasMap.problem_aware;
}

/**
 * Compact directive for injection into prompts.
 */
export function getPsychologyDirective(awareness: AwarenessLevel): string {
  const mindstate = getMindstateForAwareness(awareness);
  const biases = getBiasesForAwareness(awareness);
  const biasDetails = biases
    .map(b => COGNITIVE_BIASES[b as keyof typeof COGNITIVE_BIASES])
    .filter(Boolean)
    .map(b => `- ${b.name}: ${b.application}`)
    .join("\n");

  const profile = mindstate === "both"
    ? "Optimiste OU Prudent selon le contexte"
    : MINDSTATE_PROFILES[mindstate].label;

  return `PSYCHOLOGIE (${awareness}):
Mindstate: ${profile}
Biais cognitifs recommandes:
${biasDetails}
Sequence emotionnelle: Agitation → Empathie → Resolution → Projection du resultat`;
}
