// ============================================================
// KNOWLEDGE: EVALUATOR CALIBRATION (Few-Shot)
// Textual reference examples for score calibration.
// Prevents score inflation by anchoring Claude to concrete
// examples of what each score level looks like.
// ============================================================

export interface CalibrationExample {
  score: number;
  label: string;
  description: string;
  expected_craft: number;
  expected_ad: number;
  rationale: string;
}

export const BASE_IMAGE_CALIBRATION: CalibrationExample[] = [
  {
    score: 2.5,
    label: "Faible — Image AI generique",
    description: "Image generee par IA sans direction. Produit deforme ou absent. Perspective cassee (lignes qui ne convergent pas). Eclairage plat et uniforme. Texture plastique. Aucune zone libre pour du texte. Le fond et le sujet se confondent.",
    expected_craft: 3,
    expected_ad: 2,
    rationale: "Craft minimal (deformations, perspective cassee). Potentiel pub quasi nul (pas de scroll-stop, produit non identifiable, pas de safe zone).",
  },
  {
    score: 5.5,
    label: "Moyen — Photo studio correcte",
    description: "Image propre type photo studio. Produit fidele et bien eclaire. Composition equilibree. MAIS : zero contexte emotionnel, zero storytelling. L'image pourrait etre un packshot e-commerce. Rien n'arrete le scroll. Pas de 'pourquoi' visible. Safe zone presente mais sous-exploitee.",
    expected_craft: 8,
    expected_ad: 4,
    rationale: "Craft correct (eclairage pro, produit net). Mais potentiel pub faible : pas de scroll-stop, pas d'emotion, pas de promesse visible. Un packshot n'est pas une pub.",
  },
  {
    score: 8.0,
    label: "Fort — Scene lifestyle immersive",
    description: "Scene lifestyle immersive et credible. Produit integre naturellement avec ombres coherentes. Eclairage directionnel qui cree de la profondeur. Safe zone claire et exploitable pour headline. Le scroll s'arrete. On comprend la promesse sans texte. L'image raconte une histoire — on 'sent' le benefice.",
    expected_craft: 8,
    expected_ad: 8,
    rationale: "Craft pro (scene realiste, produit integre). Fort potentiel pub : scroll-stop evident, promesse visible, safe zone claire, emotion presente.",
  },
];

export const COMPOSED_AD_CALIBRATION: CalibrationExample[] = [
  {
    score: 2.5,
    label: "Faible — Texte illisible",
    description: "Texte mal place qui chevauche le produit. Police trop petite pour mobile. Pas de hierarchie — headline, CTA et proof ont la meme taille. Couleur du texte proche du fond (contraste < 3:1). Le message n'est pas comprehensible en 1 seconde.",
    expected_craft: 3,
    expected_ad: 2,
    rationale: "Composition amateure. Texte illisible sur mobile. Pas de CTA identifiable. Message confus.",
  },
  {
    score: 5.5,
    label: "Moyen — Composition fonctionnelle",
    description: "Texte lisible avec contraste suffisant. Headline visible. CTA present mais pas assez mis en avant. La hierarchie existe mais n'est pas optimale — l'oeil ne suit pas un chemin clair. Le message est compris en 2-3 secondes, pas 1.",
    expected_craft: 6,
    expected_ad: 5,
    rationale: "Fonctionnel mais pas optimise. Manque de punch visuel. Le CTA ne 'saute pas aux yeux'. Message trop lent a decoder.",
  },
  {
    score: 8.0,
    label: "Fort — Pub pro Meta-ready",
    description: "Hierarchie visuelle impeccable : headline dominant → image → CTA. Texte parfaitement lisible sur mobile (police 48px+ headline). Contraste fort. L'oeil suit un path clair (Z-pattern ou F-pattern). Le message est compris en < 1 seconde. Le CTA est visible et 'cliquable'. Coherence marque evidente.",
    expected_craft: 8,
    expected_ad: 8,
    rationale: "Pub pro prete pour le feed. Hierarchie claire, lisibilite mobile, scroll-stop + conversion dans un seul visuel.",
  },
];

/**
 * Get calibration directive for base image evaluation.
 */
export function getBaseImageCalibrationDirective(): string {
  const examples = BASE_IMAGE_CALIBRATION.map(
    (ex) =>
      `Score ~${ex.score} (${ex.label}): "${ex.description}" → craft=${ex.expected_craft}, ad=${ex.expected_ad}. ${ex.rationale}`
  ).join("\n\n");

  return `=== CALIBRATION (ANCRAGE DES SCORES) ===
${examples}

REGLE DE DISTRIBUTION: Sur 10 evaluations, la distribution attendue est :
- 1-2 notes > 8 (exceptionnel)
- 3-4 notes 6-7 (pro correct)
- 2-3 notes 4-5 (moyen, ameliorable)
- 1-2 notes < 4 (faible, a refaire)

Un 7 = professionnel correct mais sans eclat. Un 9 = exceptionnel, rare. Sois SEVERE et DISCRIMINANT.`;
}

/**
 * Get calibration directive for composed ad evaluation.
 */
export function getComposedAdCalibrationDirective(): string {
  const examples = COMPOSED_AD_CALIBRATION.map(
    (ex) =>
      `Score ~${ex.score} (${ex.label}): "${ex.description}" → overall=${ex.expected_ad}. ${ex.rationale}`
  ).join("\n\n");

  return `=== CALIBRATION (ANCRAGE DES SCORES) ===
${examples}

REGLE DE DISTRIBUTION: Sur 10 evaluations, la distribution attendue est :
- 1-2 notes > 8 (exceptionnel)
- 3-4 notes 6-7 (pro correct)
- 2-3 notes 4-5 (moyen)
- 1-2 notes < 4 (faible)

Un 7 = professionnel correct. Un 9 = exceptionnel et rare. Sois SEVERE et DISCRIMINANT. Si deux pubs sont mediocres, dis-le.`;
}
