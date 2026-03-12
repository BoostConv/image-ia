import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: ADVANCED TACTICS & FAQ
// Source: PDF6 — Cognitive biases selection, villain technique,
// FAQ playbook, objection handling, emotional nuances.
// ============================================================

/**
 * The Villain Technique (Makepeace #5 + PDF6 deep dive).
 * Externalize blame to a specific "villain" to channel emotion.
 */
export const VILLAIN_TECHNIQUE = {
  principle: "Never blame abstract concepts. Blame a specific, tangible villain to channel emotion and relieve prospect's guilt.",
  when_to_use: [
    "Prospect feels guilty about their problem (weight, finances, habits)",
    "Market is skeptical of the industry",
    "Need to create us-vs-them dynamic",
    "Product disrupts an established market",
  ],
  types: [
    { villain: "The Industry", example: "Les grandes marques de cosmetique vous mentent depuis 20 ans" },
    { villain: "The Hidden Ingredient", example: "Le sucre cache dans vos cereales 'sante'" },
    { villain: "The Old Method", example: "Les regimes caloriques detruisent votre metabolisme" },
    { villain: "The Establishment", example: "Ce que Big Pharma ne veut pas que vous sachiez" },
    { villain: "The Invisible Enemy", example: "Les micro-plastiques dans votre eau du robinet" },
  ],
  rules: [
    "The villain must be believable and verifiable",
    "Never attack individuals by name — attack systems, industries, methods",
    "The villain explains WHY the prospect failed before (it's not their fault)",
    "Your product is the antidote to the villain's damage",
  ],
} as const;

/**
 * Objection handling strategies for Product Aware prospects.
 */
export const OBJECTION_HANDLERS = {
  price: {
    tactic: "Reframe cost as investment or daily cost",
    techniques: [
      "Cost per day breakdown (less than a coffee)",
      "Compare to cost of NOT solving the problem",
      "Show lifetime value vs one-time cost",
      "Stack value: list everything they get",
    ],
  },
  skepticism: {
    tactic: "Overwhelm with diverse proof types",
    techniques: [
      "Scientific study or clinical trial",
      "Expert endorsement (doctor, specialist)",
      "Mass social proof (numbers)",
      "Before/After transformation",
      "Risk reversal (money-back guarantee)",
    ],
  },
  effort: {
    tactic: "Minimize perceived difficulty",
    techniques: [
      "3-step simplicity (Plug. Press. Enjoy.)",
      "Time to result ('in just 7 days')",
      "Comparison to harder alternatives",
      "Show someone 'just like them' succeeding effortlessly",
    ],
  },
  timing: {
    tactic: "Create urgency without being pushy",
    techniques: [
      "Cost of waiting (problem gets worse)",
      "Limited availability (genuine scarcity)",
      "Seasonal relevance",
      "Social proof of momentum ('joining now')",
    ],
  },
} as const;

/**
 * Emotional nuance tactics for difficult emotions.
 */
export const EMOTIONAL_TACTICS = {
  guilt: {
    problem: "Prospect feels guilty about their problem or inaction",
    solution: "Use the Villain Technique — externalize blame. 'It's not your fault, it's [villain]'.",
    visual: "Show the villain being defeated or exposed. Prospect as the hero who discovers the truth.",
  },
  shame: {
    problem: "Prospect is embarrassed about their situation",
    solution: "Use normalization + empathy. 'You're not alone — 60% of people share this.'",
    visual: "Community imagery, shared experience, 'secret club' aesthetic.",
  },
  overwhelm: {
    problem: "Prospect is paralyzed by too many options",
    solution: "Simplify to ONE clear action. Reduce cognitive load to minimum.",
    visual: "Clean, minimal design. Single product, single CTA, maximum white space.",
  },
  distrust: {
    problem: "Prospect has been burned before by similar products",
    solution: "Lead with guarantee + raw/authentic proof. Acknowledge their skepticism directly.",
    visual: "UGC aesthetic, raw testimonials, money-back badge. Anti-polished look.",
  },
  fomo: {
    problem: "Fear of missing out but also fear of making wrong choice",
    solution: "Social proof + risk reversal combo. 'Join 10,000+ others — risk-free for 30 days'.",
    visual: "Numbers + guarantee badge together. Show community momentum.",
  },
} as const;

/**
 * The "Moments of Truth" technique for Unaware prospects.
 * Ultra-specific life scenes that trigger instant identification.
 */
export const MOMENTS_OF_TRUTH = {
  principle: "Instead of generic pain statements, describe a hyper-specific SCENE from the prospect's daily life",
  method: "Research Reddit/forums for real language and situations. Find the 'moment of truth' — the exact instant they feel the pain.",
  examples: [
    "Going to the park at night to exercise on the swings so nobody sees you",
    "Turning sideways to squeeze past someone in a narrow aisle",
    "Pretending not to hear when someone asks about your skincare",
    "Checking your phone at 3AM because you can't fall back asleep",
  ],
  application: "Use these micro-scenes as the VISUAL CONCEPT of the ad. The prospect sees their exact life and stops scrolling.",
} as const;

/**
 * Advanced headline strengthening techniques (Schwartz ch.4).
 */
export const HEADLINE_STRENGTHENERS = [
  "Measure the size of the claim (bigger numbers)",
  "Measure the SPEED of the claim (faster results)",
  "Compare the claim to something known",
  "Metaphorize the claim (turn abstract into concrete)",
  "Sensitize the claim (engage senses — taste, touch, feel)",
  "Demonstrate with a prime example",
  "Dramatize the claim or its results",
  "State as a paradox (unexpected contradiction)",
  "Remove limitations ('without dieting, pills, or gym')",
  "Associate with aspirational values or people",
  "Show detailed work the product does",
  "State as a question (disguised affirmation)",
  "Tie authority to the claim",
  "Before and after the claim",
  "Stress NEWNESS",
  "Stress EXCLUSIVITY",
  "Turn into a challenge for the reader",
] as const;

/**
 * Get tactics directive for a specific awareness level.
 */
export function getTacticsDirective(awareness: AwarenessLevel): string {
  const tacticsMap: Record<AwarenessLevel, string> = {
    unaware: `TACTIQUES AVANCEES (Unaware):
- Moments de Verite: scenes ultra-specifiques du quotidien du prospect
- Pattern Interrupt: visuel WTF qui force a s'arreter
- Villain: designer l'ennemi pour creer la prise de conscience
- JAMAIS mentionner le produit, la solution ou le prix`,
    problem_aware: `TACTIQUES AVANCEES (Problem Aware):
- Agitation: rendre le probleme URGENT (couts de l'inaction)
- Villain externe: dedouaner le prospect de sa culpabilite
- Empathie: valider le sentiment avant toute solution
- Normalisation: "Vous n'etes pas seul — 60% des gens..."`,
    solution_aware: `TACTIQUES AVANCEES (Solution Aware):
- Mecanisme Unique: montrer COMMENT votre solution differe
- Headline strengtheners: comparer, metaphoriser, dramatiser
- Objection pre-emptive: adresser le scepticisme frontalement
- Us vs Them: tableau comparatif clair et visuel`,
    product_aware: `TACTIQUES AVANCEES (Product Aware):
- Preuve diversifiee: etudes + temoignages + autorite + garantie
- Objection prix: reframer en cout/jour ou en investissement
- Defaut avoue (Pratfall): admettre une faiblesse mineure = credibilite
- Stack de valeur: empiler bonus + garantie + resultat`,
    most_aware: `TACTIQUES AVANCEES (Most Aware):
- Offre pure: prix, reduction, urgence temporelle
- Rarete genuine: stock limite, edition limitee
- Simplification extreme: 1 produit, 1 prix, 1 CTA
- Actualisation temporelle: "sentez la difference en 2 minutes"`,
  };
  return tacticsMap[awareness] || tacticsMap.problem_aware;
}
