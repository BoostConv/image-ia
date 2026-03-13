import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: COMPLETE COPYWRITING FRAMEWORK
// Source: base_connaissances_copywriting_ads.pdf + prompt_systeme_agent_ad_creator.pdf
// Full principles, 13 headline mechanisms, emotional levers, rules.
// ============================================================

/**
 * Mark Morgan Ford's 3 fundamental rules of selling.
 */
export const FORD_SELLING_RULES = {
  rule1: {
    principle: "Les gens n'aiment pas qu'on leur vende quelque chose",
    directive: "Le prospect ne doit jamais sentir qu'on lui vend — il doit sentir qu'on l'informe, qu'on le comprend, ou qu'on lui montre quelque chose de pertinent.",
  },
  rule2: {
    principle: "Les gens achetent pour des raisons emotionnelles, pas rationnelles",
    directive: "La headline doit faire RESSENTIR — pas informer. L'information est le job du sous-texte.",
  },
  rule3: {
    principle: "Une fois vendu emotionnellement, le prospect justifie avec la logique",
    directive: "Le sous-texte donne les faits concrets (c'est quoi, fait avec quoi, ca fait quoi). Headline vend au coeur, sous-texte vend a la tete.",
  },
} as const;

/**
 * Core copywriting principles.
 */
export const CORE_PRINCIPLES = {
  hopkins: "La pub c'est de la vente, pas de la litterature. Fine writing is a DISADVANTAGE (Hopkins). Jamais de formulation poetique. Toujours clair, direct, convaincant.",
  feel_test: "You don't KNOW good copy, you FEEL it (Makepeace). Chaque headline doit faire RESSENTIR: choc, reconnaissance, curiosite, desir. Si elle informe juste, elle est ratee.",
  golden_rule: "Specifique, Concret, Zero Deduction. Chaque mot compris instantanement. Nommer le probleme explicitement. Dire ce qu'est le produit dans le sous-texte. Etre specifique au persona.",
  dont_force_tempt: "Don't force. Tempt. (Mark Morgan Ford). Ne pas lister des raisons — decrire l'odeur, le fondant, la texture. Le visuel fait RESSENTIR l'experience.",
  best_concept: "Le meilleur concept n'a pas besoin de beaucoup de mots. Si 50+ mots necessaires, pas fait pour le static ad. Changer de concept.",
} as const;

/**
 * The 7 fundamental emotional motivators.
 */
export const EMOTIONAL_MOTIVATORS = [
  { id: "fear", name: "Peur", description: "Securite physique, financiere, sociale, peur de rater quelque chose." },
  { id: "greed", name: "Avidite", description: "Desir d'avoir plus — argent, prestige, possessions, opportunites." },
  { id: "vanity", name: "Vanite", description: "Apparence, image de soi, comment les autres nous percoivent." },
  { id: "desire", name: "Desir / Plaisir", description: "Experiences sensorielles, confort, satisfaction." },
  { id: "pride", name: "Fierte", description: "Accomplissement, statut, reconnaissance." },
  { id: "envy", name: "Envie", description: "Ce que les autres ont et que je veux aussi." },
  { id: "laziness", name: "Paresse / Facilite", description: "Le chemin le plus simple pour obtenir le resultat." },
] as const;

/**
 * Emotional appeal selection — 3 questions to answer before any ad.
 */
export const EMOTIONAL_SELECTION_FRAMEWORK = {
  question1: "Qu'est-ce qui empeche ce persona de dormir a 3h du matin? (au-dela du probleme de surface)",
  question2: "Qu'est-ce que resoudre ce probleme changerait a son identite? (comment il se verrait differemment)",
  question3: "Quel levier emotionnel adresse le plus directement ce besoin? (identifier le primaire + 1-2 secondaires)",
  prevention_vs_fixing: "Identifier si le persona est en mode prevention (eviter un probleme futur) ou resolution (resoudre un probleme existant).",
} as const;

/**
 * The 13 headline mechanisms — COMPLETE.
 */
export interface HeadlineMechanism {
  id: number;
  name: string;
  description: string;
  why_it_works: string;
  example: string;
  warning?: string;
}

export const HEADLINE_MECHANISMS: HeadlineMechanism[] = [
  { id: 1, name: "Interpellation directe sur le probleme", description: "Nommer le probleme tel quel. Le prospect se reconnait instantanement. Pas de metaphore.", why_it_works: "Le cerveau reagit plus fortement a la reconnaissance d'un probleme vecu qu'a n'importe quel benefice promis.", example: "Ton ado transpire et les deos ne tiennent pas la journee." },
  { id: 2, name: "Situation Recognition", description: "Decrire un moment de vie precis que le prospect vit. Pas le probleme abstrait, le moment concret.", why_it_works: "Le prospect se projette dans la scene et se dit 'c'est exactement ca'. Identification immediate.", example: "15h. Tu as bu 4 cafes et 0 eau." },
  { id: 3, name: "Contraste Avant/Apres", description: "Deux realites opposees cote a cote. Le contraste fait l'argument sans avoir besoin de l'expliquer.", why_it_works: "Le cerveau traite les comparaisons directes plus rapidement que les arguments isoles.", example: "A gauche ce que tu utilises depuis 10 ans. A droite ce que ta peau merite." },
  { id: 4, name: "Loss Aversion / Cout cache", description: "Montrer ce que le prospect perd ou risque en ne changeant pas.", why_it_works: "Kahneman: la douleur de perdre est 2x plus forte que le plaisir de gagner.", example: "Ta bouteille plastique met 450 ans a disparaitre." },
  { id: 5, name: "Social Proof", description: "La preuve par le nombre, le temoignage ou la validation d'un tiers.", why_it_works: "Le cerveau utilise le comportement des autres comme raccourci de decision.", example: "4 millions d'hommes ont lache leur gel douche." },
  { id: 6, name: "Question Hook", description: "Question qui force le cerveau a repondre et cree un scroll-stop.", why_it_works: "Le cerveau est cable pour repondre aux questions — reflexe conditionne depuis l'enfance.", example: "Retourne ton gel douche. Tu comprends quelque chose?" },
  { id: 7, name: "Revelation / Education", description: "Reveler quelque chose que le prospect ne savait pas. Micro-declic educatif.", why_it_works: "L'information nouvelle qui change la perception d'un sujet familier est impossible a ignorer.", example: "43 ingredients dans ton gel douche. Tu en connais zero." },
  { id: 8, name: "Urgence / Rarete", description: "Le temps ou la quantite est limite. Pousse a l'action immediate.", why_it_works: "La peur de manquer une opportunite est un des leviers les plus puissants.", example: "Derniere chance — edition limitee." },
  { id: 9, name: "Resultat specifique", description: "Resultat concret et mesurable, parfois avec une duree. Le chiffre cree la credibilite.", why_it_works: "La specificite active la credibilite — un chiffre precis est plus croyable qu'une promesse vague.", example: "Son corps change. Son deodorant devrait suivre." },
  { id: 10, name: "Identite / Appartenance", description: "Jouer sur qui le prospect veut etre ou a quel groupe il veut appartenir.", why_it_works: "Les decisions d'achat sont souvent identitaires — 'les gens comme moi achetent ca'.", example: "En soiree, personne ne sait que c'est de l'eau." },
  { id: 11, name: "Objection Buster", description: "Casser frontalement une objection ou croyance qui bloque l'achat.", why_it_works: "Adresser l'objection avant qu'elle ne soit formulee la neutralise.", example: "Pas besoin d'alcool pour avoir de la gueule a table." },
  { id: 12, name: "Provocation / Defi", description: "Provoquer une dissonance cognitive. Confronter a une incoherence.", why_it_works: "Le cerveau ne supporte pas la dissonance cognitive — il doit la resoudre.", example: "Tu tracks tes macros mais tu bois de la Cristaline." },
  { id: 13, name: "Disruption / Reverse Psychology", description: "Affirmation exageree ou contraire pour creer un choc cognitif, puis insight dans le sous-texte. Variante 3 temps: Disruption → Sarcasme → Insight.", why_it_works: "Le cerveau ne peut pas ignorer une contradiction avec ce qu'il croit savoir.", example: "Ton gel douche fait son job. C'est juste qu'il ne fait QUE ca.", warning: "UNIQUEMENT marques provocatrices. Inadapte aux marques bienveillantes. Format 3 temps: 35-45 mots max." },
];

/**
 * Copy zones and their jobs.
 */
export const COPY_ZONES = {
  headline: {
    budget: "1-2 lignes max, 10-15 mots max",
    job: "Arreter le scroll en 1 seconde. Creer reconnaissance immediate ('c'est moi', 'c'est exactement ca')",
    rules: [
      "Nommer le probleme/situation/desir explicitement",
      "Specifique au persona cible",
      "Se suffire a elle-meme sans contexte",
      "Doit faire RESSENTIR, pas informer (feel test)",
    ],
  },
  subtext: {
    budget: "1-2 lignes max, 15-25 mots max",
    job: "Informer et convaincre en 3 secondes — c'est quoi? Pour qui? Fait avec quoi? Ca fait quoi?",
    rules: [
      "Minimum: dire ce qu'est le produit + un benefice concret",
      "La logique justifie l'emotion de la headline",
      "DOIT repondre au hook — meme theme, meme champ lexical",
      "JAMAIS deconnecte du hook",
    ],
  },
  cta: {
    budget: "2-5 mots, OPTIONNEL",
    job: "Dire quoi faire maintenant",
    rules: [
      "Refleter l'action reelle du persona",
      "Jamais de CTA-slogan poetique",
      "OK: 'Decouvrir Exode', 'Essayer Dr. Squatch', 'Commander pour mon ado'",
    ],
  },
  asterisk: {
    budget: "1 ligne max, 8-10pt, HORS budget de mots",
    job: "Credibiliser sans alourdir",
    when_to_use: [
      "Terme technique inconnu du prospect ('saponifie a froid*')",
      "Chiffre a sourcer ('180€/an*')",
      "Mecanisme unique a expliquer",
      "Experience sensorielle inconnue ('sent le pin*')",
    ],
    key_rule: "Decrire l'EXPERIENCE, pas le terme. '*Pin: odeur boisee et fraiche qui reste sur ta peau' PAS '*Pin: essence de conifere'.",
  },
} as const;

/**
 * Word budget rules.
 */
export const WORD_BUDGET = {
  total: "20-35 mots (headline + sous-texte + CTA)",
  exception_disruption: "Disruption 3 temps: 35-45 mots max",
  asterisk_excluded: "L'asterisque ne compte PAS dans le budget",
  priority_order: "Clarte d'abord, concision ensuite. La contrainte de mots ne prime JAMAIS sur la clarte.",
  test: "Pour chaque mot: 'est-ce indispensable pour comprendre en 1 seconde?' Si non, couper.",
} as const;

/**
 * Copy/Visual coherence rules (zero micro-latence).
 */
export const COPY_VISUAL_COHERENCE = [
  { rule: "Si tu le dis, montre-le", detail: "Chaque affirmation du copy doit etre visuellement confirmee dans l'image. Copy dit 'a moitie vide' → flacon TRANSPARENT." },
  { rule: "Si tu donnes un chiffre, prouve-le", detail: "Si tu dis '6 ingredients', le visuel doit en montrer 6. Sinon ne pas donner de chiffre precis." },
  { rule: "Les annotations accelerent", detail: "Fleches + micro-labels connectent instantanement copy et image. Eliminent toute ambiguite." },
  { rule: "Asterisque sensoriel", detail: "Quand le copy mentionne une sensation inconnue, l'asterisque decrit l'EXPERIENCE, pas le terme." },
  { rule: "Zero micro-latence = ad hypnotique", detail: "Chaque connexion instantanee: Copy→visuel, Chiffre→preuve, Nom→produit, Technique→explication." },
] as const;

/**
 * Advanced copywriting techniques.
 */
export const ADVANCED_TECHNIQUES = {
  face_on_enemy: "Toujours identifier et nommer l'ennemi. Pas 'les gels douche sont mauvais' mais 'ton gel douche contient 43 ingredients chimiques'. Personnaliser l'ennemi.",
  so_what_test: "Pour chaque affirmation: 'Et alors?' Si pas de benefice concret, couper. Mauvais: 'Notre savon est saponifie a froid.' Bon: 'Saponifie a froid — il nettoie sans decaper.'",
  fab_condensed: "Feature + Advantage + Benefit en une phrase. Ex: 'Savon naturel (F) qui nettoie ET nourrit (A) ta peau des la premiere douche (B)'.",
  even_if: "Casser objections avec 'meme si'. En fin de sous-texte. Ex: 'Meme si tu n'as jamais touche un savon solide.'",
  damaging_admission: "Admettre une limitation pour augmenter la credibilite du reste. Ex: 'C'est juste de l'eau. Mais c'est de l'eau qui a de la gueule.'",
  negativity_technique: "Reformuler positif en negatif (Ben Settle). '10 conseils' → 'Les 10 erreurs que tu fais'. Le cerveau reagit plus fort a l'erreur.",
  direct_address: "TU/TON/TA maximum. Pas 'les hommes qui transpirent' mais 'TON ado transpire'. Adapter tutoiement/vouvoiement au persona ET a la marque.",
  unexpected_sensory: "Decrire un resultat sensoriel inattendu. Ex: 'Le soir, ta serviette sent encore le cedre.' — personne n'associe 'savon' et 'odeur qui dure sur la serviette'.",
} as const;

/**
 * Forbidden formulations — NEVER use.
 */
export const FORBIDDEN_FORMULATIONS = {
  poetic_abstract: [
    "Le rituel naturel qui lui donne l'assurance qu'il merite",
    "Sois celle qui a compris",
    "La ou commence la confiance",
    "Embrasse le changement",
  ],
  dilutive_words: ["peut", "pourrait", "devrait", "a le potentiel de", "cherche a", "est susceptible de"],
  cta_slogans: ["Sois celle qui a compris", "Embrasse le changement"],
  em_dashes: "JAMAIS de tiret long (—) dans le copy — utiliser un point ou une virgule.",
  mechanical_arguments: "Ne JAMAIS coller mecaniquement note Yuka, etoiles, certifications dans chaque ad. Utiliser uniquement quand pertinent au hook specifique.",
  density_errors: ["Plus de 35 mots total", "Headline sur plus de 2 lignes", "Sous-texte sur plus de 2 lignes", "Plus de 5 mots par case dans Collage"],
  generic_copy: "Si on peut remplacer le nom du produit par un autre et que le copy fonctionne toujours, il est trop vague.",
  disconnected_subtext: "Le sous-texte REPOND au hook. Meme theme. Si le hook parle de peau seche, le sous-texte parle de nourrir, PAS d'une note Yuka.",
} as const;

/**
 * Copy validation checklist.
 */
export const COPY_CHECKLIST = [
  "La headline se comprend-elle en 1 seconde sans contexte?",
  "Le sous-texte dit-il ce qu'est le produit?",
  "Le message est-il specifique a ce persona?",
  "Le prospect a-t-il besoin de deduire quoi que ce soit?",
  "Le CTA reflete-t-il une action concrete (si present)?",
  "Le volume total est-il dans le budget de 20-35 mots?",
  "Le test 'So What?' est-il passe pour chaque affirmation?",
  "Le squint test passe-t-il visuellement?",
  "Aucun mot dilutif (peut, pourrait, devrait)?",
  "Aucune formulation poetique ou abstraite?",
  "Le sous-texte REPOND-il au hook (meme theme)?",
  "Chaque chiffre est-il verifiable dans le visuel ou l'asterisque?",
] as const;

/**
 * Brand approach types.
 */
export const BRAND_APPROACHES = {
  classic: {
    description: "Le produit est le heros. La marque s'efface derriere les benefices.",
    examples: "Exode, Novoma, Caps'Me",
    copy_style: "Factuel, benefice-centre, ton neutre a rassurant",
  },
  charismatic: {
    description: "La personnalite de la marque EST le produit. Le ton et l'identite vendent autant.",
    examples: "Liquid Death, Dr. Squatch",
    copy_style: "Personnalite forte, humour possible, ton distinctif",
  },
} as const;

/**
 * Facebook Ad Copy rules (separate deliverable).
 */
export const FACEBOOK_AD_COPY_RULES = {
  headline_facebook: {
    max_chars: 40,
    rule: "Complemente la headline du visuel, ne la DUPLIQUE PAS. C'est un deuxieme hook.",
  },
  primary_text: {
    first_2_lines: "Les plus critiques — visible avant 'Voir plus' (~125 caracteres). Le hook doit donner envie de cliquer.",
    body: "DEVELOPPE ce que le visuel ne peut pas montrer: benefices detailles, storytelling, social proof, objections.",
    ending: "Terminer par un CTA clair ('→ Essayer Dr. Squatch')",
  },
  principle: "Le visuel ACCROCHE. L'ad copy DEVELOPPE. Ils ne se repetent JAMAIS.",
} as const;

// ============================================================
// DIRECTIVE FUNCTIONS
// ============================================================

/**
 * Get copywriting directive tailored for a pipeline stage.
 */
export function getCopywritingFrameworkDirective(stage: "planner" | "composer" | "evaluator"): string {
  switch (stage) {
    case "planner":
      return `PRINCIPES COPYWRITING:
- ${CORE_PRINCIPLES.hopkins}
- ${CORE_PRINCIPLES.feel_test}
- ${CORE_PRINCIPLES.golden_rule}
- ${CORE_PRINCIPLES.dont_force_tempt}
LEVIERS EMOTIONNELS: ${EMOTIONAL_MOTIVATORS.map(m => m.name).join(", ")}
3 QUESTIONS: ${EMOTIONAL_SELECTION_FRAMEWORK.question1} / ${EMOTIONAL_SELECTION_FRAMEWORK.question2} / ${EMOTIONAL_SELECTION_FRAMEWORK.question3}
13 MECANISMES HEADLINE: ${HEADLINE_MECHANISMS.map(m => `#${m.id} ${m.name}`).join(", ")}`;

    case "composer":
      return `REGLES COPY:
HEADLINE: ${COPY_ZONES.headline.budget}. ${COPY_ZONES.headline.job}
SOUS-TEXTE: ${COPY_ZONES.subtext.budget}. ${COPY_ZONES.subtext.job}
CTA: ${COPY_ZONES.cta.budget}. ${COPY_ZONES.cta.rules[0]}
BUDGET: ${WORD_BUDGET.total}. ${WORD_BUDGET.priority_order}
TECHNIQUES: ${Object.entries(ADVANCED_TECHNIQUES).map(([k, v]) => v.split('.')[0]).join(". ")}.
INTERDIT: Formulations poetiques, mots dilutifs (peut/pourrait/devrait), tirets longs, copy generique, sous-texte deconnecte du hook.
COHERENCE: ${COPY_VISUAL_COHERENCE.map(r => r.rule).join(". ")}.`;

    case "evaluator":
      return `CHECKLIST COPY:
${COPY_CHECKLIST.map((c, i) => `${i + 1}. ${c}`).join("\n")}
COHERENCE COPY/VISUEL:
${COPY_VISUAL_COHERENCE.map(r => `- ${r.rule}: ${r.detail}`).join("\n")}`;

    default:
      return "";
  }
}

/**
 * Get detailed description of a specific headline mechanism.
 */
export function getHeadlineMechanismDirective(mechanismId: number): string {
  const m = HEADLINE_MECHANISMS.find(h => h.id === mechanismId);
  if (!m) return "";
  return `MECANISME #${m.id} — ${m.name}
${m.description}
Pourquoi: ${m.why_it_works}
Exemple: "${m.example}"${m.warning ? `\n⚠️ ${m.warning}` : ""}`;
}

/**
 * Get all headline mechanisms as a compact list.
 */
export function getAllHeadlineMechanismsDirective(): string {
  return HEADLINE_MECHANISMS
    .map(m => `#${m.id} ${m.name}: ${m.description} Ex: "${m.example}"`)
    .join("\n");
}
