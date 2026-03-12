import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: SCHWARTZ PERSUASION METHODOLOGY
// Source: PDF2 — Breakthrough Advertising (Eugene Schwartz)
// 5 awareness levels + sophistication stages + headline techniques.
// ============================================================

/**
 * Schwartz's 5 awareness levels with strategy for each.
 */
export interface AwarenessStrategy {
  level: AwarenessLevel;
  label_fr: string;
  prospect_thinks: string;
  headline_strategy: string;
  visual_strategy: string;
  copy_length: "short" | "medium" | "long";
  forbidden: string[];
}

export const AWARENESS_STRATEGIES: Record<AwarenessLevel, AwarenessStrategy> = {
  most_aware: {
    level: "most_aware",
    label_fr: "Tres Conscient",
    prospect_thinks: "Je connais cette marque, j'hesite juste sur le prix ou le moment.",
    headline_strategy: "Nom du produit + offre irresistible (prix, reduction, urgence). Pas d'explication.",
    visual_strategy: "Image simple du produit avec prix/offre. Hero shot pur. CTA direct.",
    copy_length: "short",
    forbidden: ["expliquer le mecanisme", "agiter la douleur", "long storytelling"],
  },
  product_aware: {
    level: "product_aware",
    label_fr: "Conscient du Produit",
    prospect_thinks: "J'ai vu ce produit, mais est-ce qu'il marche vraiment mieux?",
    headline_strategy: "Renforcer la superiorite et la preuve. Temoignages, nouvelle fonctionnalite.",
    visual_strategy: "Comparatif Us vs Them, demonstration, preuve sociale, avant/apres.",
    copy_length: "medium",
    forbidden: ["ignorer la concurrence", "faire du storytelling generique"],
  },
  solution_aware: {
    level: "solution_aware",
    label_fr: "Conscient de la Solution",
    prospect_thinks: "Je veux resoudre mon probleme, mais je ne connais pas ta marque.",
    headline_strategy: "Prouver que ton mecanisme est superieur. Introduire le 'comment ca marche'.",
    visual_strategy: "Mecanisme unique, coupe transversale, explication scientifique, differenciation.",
    copy_length: "medium",
    forbidden: ["parler que du prix", "assumer la notoriete de la marque"],
  },
  problem_aware: {
    level: "problem_aware",
    label_fr: "Conscient du Probleme",
    prospect_thinks: "J'ai mal / je suis frustre, mais je ne sais pas qu'une solution existe.",
    headline_strategy: "Empathie + agitation de la douleur. Valider le sentiment, puis introduire la solution.",
    visual_strategy: "Visuel montrant la douleur, metaphore visuelle, cycle infernal, question 'Marre de...?'.",
    copy_length: "long",
    forbidden: ["mentionner le produit en premier", "faire une offre directe"],
  },
  unaware: {
    level: "unaware",
    label_fr: "Totalement Inconscient",
    prospect_thinks: "C'est la vie / Je suis juste comme ca.",
    headline_strategy: "Identification pure, histoire intrigante ou pattern interrupt. JAMAIS le produit/prix/solution.",
    visual_strategy: "Appel a l'identite, fait choquant, histoire personnelle, ugly ad, contraste Von Restorff.",
    copy_length: "long",
    forbidden: ["parler du produit", "mentionner le prix", "la solution dans le titre"],
  },
};

/**
 * Schwartz's 5 stages of market sophistication.
 */
export const SOPHISTICATION_STAGES = [
  {
    stage: 1,
    description: "First in market",
    strategy: "Be simple, direct. State the claim or need in headline. People are enthusiastic.",
  },
  {
    stage: 2,
    description: "Second in market",
    strategy: "Copy the working claim and enlarge it. Bigger promise, more proof.",
  },
  {
    stage: 3,
    description: "Market has heard all claims",
    strategy: "Introduce a NEW MECHANISM that makes claims fresh. Shift perspective.",
  },
  {
    stage: 4,
    description: "Mechanisms are exhausted too",
    strategy: "Elaborate on the mechanism — make it easier, quicker, solve more of the problem.",
  },
  {
    stage: 5,
    description: "Market no longer believes",
    strategy: "Get prospect through IDENTIFICATION with the ad. Sell identity, not product.",
  },
] as const;

/**
 * 7 core techniques of breakthrough copy (Schwartz).
 */
export const BREAKTHROUGH_TECHNIQUES = [
  "Intensification: Expand vague desires into vivid scenes of fulfillment",
  "Identification: Build saleable personality into product (character roles + achievement roles)",
  "Gradualization: Start with accepted truth, lead to conclusion through chain of acceptances",
  "Redefinition: Reframe the product in terms the prospect already accepts",
  "Mechanization: Introduce a new mechanism that makes old claims fresh",
  "Concentration: Focus all selling power on single dominant performance",
  "Camouflage: Disguise the ad so it doesn't look like an ad (native feel)",
] as const;

/**
 * Schwartz's key principle: Mass Desire dimensions.
 */
export const MASS_DESIRE_DIMENSIONS = {
  urgency: "Intensity or degree of demand to be satisfied",
  staying_power: "Degree of repetition, inability to become satiated",
  scope: "Number of people who share this desire",
} as const;

/**
 * Compact directive for injection into prompts.
 */
export function getSchwartzDirective(awareness: AwarenessLevel): string {
  const strategy = AWARENESS_STRATEGIES[awareness];
  return `STRATEGIE SCHWARTZ (${strategy.label_fr}):
- Prospect pense: "${strategy.prospect_thinks}"
- Headline: ${strategy.headline_strategy}
- Visuel: ${strategy.visual_strategy}
- Longueur copy: ${strategy.copy_length}
- INTERDIT: ${strategy.forbidden.join(", ")}`;
}
