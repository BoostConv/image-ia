import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: 20 PERSUASIVE PATTERNS + 50+ SUB-TYPES
// Source: base_connaissances_patterns_persuasifs_v3.pdf
// Complete pattern library with selection matrix.
// ============================================================

export interface PatternSubType {
  id: string;
  name: string;
  description: string;
  example_headline: string;
  example_subtext?: string;
}

export interface PersuasivePattern {
  id: string;
  name: string;
  description: string;
  psychological_mechanism: string;
  awareness_levels: AwarenessLevel[];
  natural_layouts: string[];
  headline_mechanisms: string[];
  sub_types: PatternSubType[];
  warning?: string;
}

export const PERSUASIVE_PATTERNS: Record<string, PersuasivePattern> = {
  pas: {
    id: "pas",
    name: "Problem-Agitate-Solve (PAS)",
    description: "Nommer le probleme du prospect, intensifier la douleur, presenter le produit comme solution. Le plus classique et universellement efficace. Pattern 'safe' par defaut.",
    psychological_mechanism: "Le cerveau priorise la resolution de la douleur sur le plaisir. Un probleme nomme cree une tension cognitive que le prospect veut resoudre. Plus le probleme est specifique, plus la tension est forte.",
    awareness_levels: ["problem_aware", "solution_aware"],
    natural_layouts: ["Hero Image", "Split-Screen", "Probleme Zoome", "Infographie"],
    headline_mechanisms: ["Interpellation directe (#1)", "Loss Aversion (#4)", "Question Hook (#6)"],
    sub_types: [
      { id: "pas_classic", name: "PAS Classique", description: "Probleme explicite + solution dans le sous-texte. Le plus direct, universel et sur.", example_headline: "Ton ado transpire et les deos ne tiennent pas la journee.", example_subtext: "Exode — deodorant naturel a l'huile de nigelle qui neutralise les odeurs jusqu'au soir." },
      { id: "pas_symptom", name: "PAS par le symptome", description: "Un symptome specifique comme porte d'entree. Plus cible, plus concret.", example_headline: "Si ta peau tire apres la douche, c'est ton gel douche le probleme.", example_subtext: "Dr. Squatch. Savon naturel saponifie a froid. Il nettoie sans decaper." },
      { id: "pas_enemy", name: "PAS par l'ennemi nomme", description: "On donne un visage a l'ennemi — produit concurrent, ingredient chimique, systeme. Le 'Face on the Enemy' de Makepeace.", example_headline: "Ton gel douche contient 43 ingredients. Tu en connais zero.", example_subtext: "Dr. Squatch. 6 ingredients naturels. Tous lisibles." },
      { id: "pas_negativity", name: "PAS par la negativite retournee (Ben Settle)", description: "Reformuler en erreur/danger au lieu de conseil. Le cerveau reagit plus fort a ce qu'il fait MAL.", example_headline: "Ton gel douche sent le parfum chimique. Pas le vrai pin. Pas le vrai cedre.", example_subtext: "Dr. Squatch. Savon naturel aux huiles essentielles." },
    ],
  },

  us_vs_them: {
    id: "us_vs_them",
    name: "Us vs Them",
    description: "Opposer le produit a l'alternative actuelle. Le contraste cree l'argument sans avoir besoin de l'expliquer. Le layout fait autant de travail que le copy.",
    psychological_mechanism: "Le cerveau traite les comparaisons directes plus rapidement que les arguments isoles. Placer deux options cote a cote force une evaluation instantanee.",
    awareness_levels: ["problem_aware", "solution_aware"],
    natural_layouts: ["Split-Screen", "Comparaison Tableau", "Scale Comparison", "Before/After"],
    headline_mechanisms: ["Contraste (#3)", "Provocation (#12)", "Revelation (#7)"],
    sub_types: [
      { id: "product_vs_product", name: "Produit vs produit concurrent", description: "Comparaison physique directe. Le visuel est l'argument principal.", example_headline: "Ton gel douche dure 2 semaines. Ce savon dure 2 mois." },
      { id: "natural_vs_chemical", name: "Naturel vs chimique", description: "Contraste sur la composition — etiquette chimique illisible vs ingredients naturels reconnaissables.", example_headline: "43 ingredients vs 6." },
      { id: "premium_vs_generic", name: "Premium vs generique", description: "Contraste sur la PERSONNALITE et l'IDENTITE, pas la qualite objective.", example_headline: "Meme rayon. Meme eau. Meme prix. Une seule a de la gueule." },
      { id: "old_vs_new", name: "Ancien reflexe vs nouvelle habitude", description: "Contraste temporel — l'ancienne maniere vs la nouvelle maniere consciente.", example_headline: "Avant tu te lavais. Maintenant tu prends soin de ta peau." },
    ],
  },

  before_after: {
    id: "before_after",
    name: "Before/After emotionnel",
    description: "Montrer la transformation que le produit apporte. Le prospect comprend le delta de changement entre ou il est et ou il pourrait etre.",
    psychological_mechanism: "Le cerveau detecte le changement. Une transformation visible active le desir de la vivre. Le prospect se projette dans le 'after' et cree mentalement le chemin via l'achat.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Before/After", "Split-Screen", "Stacked Comparison", "Hero Image"],
    headline_mechanisms: ["Contraste (#3)", "Resultat specifique (#9)", "Situation Recognition (#2)"],
    sub_types: [
      { id: "visible_transformation", name: "Transformation visible", description: "Resultat physique mesurable — peau, physique, proprete. Le visuel fait tout le travail.", example_headline: "Si ta peau tire apres la douche, c'est ton gel douche le probleme." },
      { id: "emotional_transformation", name: "Transformation emotionnelle", description: "Before = emotion negative, After = emotion positive. Le visuel montre l'expression, le langage corporel.", example_headline: "(Visuel d'un ado confiant et souriant avec ses amis)" },
      { id: "routine_transformation", name: "Transformation de routine", description: "Meme geste transforme en moment de plaisir. Changement dans l'EXPERIENCE, pas le resultat. C'est du 'tempt, don't force'.", example_headline: "Dimanche matin. Cafe lance. Ta douche sent le pin, le cedre et le bois fume." },
    ],
  },

  social_proof: {
    id: "social_proof",
    name: "Social Proof",
    description: "Utiliser la voix, le comportement ou la validation d'autres personnes. Le prospect fait plus confiance a un pair, un expert ou une masse qu'a la marque.",
    psychological_mechanism: "Biais de conformite sociale — quand beaucoup de gens font quelque chose, le cerveau conclut que c'est la bonne chose. Mecanisme de survie evolutif.",
    awareness_levels: ["solution_aware", "product_aware"],
    natural_layouts: ["Testimonial Card", "Star Rating Hero", "Wall of Love", "UGC-Style", "Press/As Seen In", "Counter", "Crowd Shot", "Comment Section"],
    headline_mechanisms: ["Social Proof (#5)", "Resultat specifique (#9)", "Situation Recognition (#2)"],
    sub_types: [
      { id: "mass", name: "Par la masse", description: "Chiffre massif de volume. Plus le chiffre est specifique (4 237 891 vs 'des millions'), plus c'est credible.", example_headline: "4 millions d'hommes ont lache leur gel douche." },
      { id: "individual_testimonial", name: "Par le temoignage individuel", description: "Avis specifique avec details concrets — nom, age, resultat precis, detail sensoriel.", example_headline: "★★★★★ 'Ma peau ne tire plus et je sens le pin toute la journee.' — Thomas, 31 ans" },
      { id: "authority", name: "Par l'autorite", description: "Expert reconnu (dermatologue, nutritionniste) transfere sa credibilite au produit.", example_headline: "Recommande par 2 300 dermatologues." },
      { id: "third_party_reaction", name: "Par la reaction d'un tiers", description: "Le PLUS PUISSANT. Pas le client qui temoigne — quelqu'un de son entourage reagit spontanement au changement.", example_headline: "3 jours que t'as change de savon. Ta copine a deja google la marque." },
      { id: "press", name: "Par la presse", description: "Logos de medias respectes transferent leur credibilite institutionnelle.", example_headline: "Vu dans GQ, Forbes, Le Monde." },
      { id: "community", name: "Par la communaute", description: "Le prospect rejoint un groupe qui partage ses valeurs. L'appartenance EST le benefice.", example_headline: "Rejoins 7 300 hommes qui ont decide de mieux prendre soin d'eux." },
    ],
  },

  education: {
    id: "education",
    name: "Education par la preuve",
    description: "Montrer des faits bruts et laisser le prospect conclure lui-meme. L'information EST l'argument. Le prospect ne percoit pas l'ad comme une pub.",
    psychological_mechanism: "Les conclusions tirees soi-meme sont plus puissantes que celles imposees. Principe d'auto-persuasion — le plus fort niveau de conviction.",
    awareness_levels: ["unaware", "problem_aware"],
    natural_layouts: ["Infographie", "Annotation/Callout", "Myth vs Fact", "Listicle", "Collage"],
    headline_mechanisms: ["Revelation (#7)", "Question Hook (#6)", "Provocation (#12)"],
    sub_types: [
      { id: "shocking_number", name: "Par le chiffre choc", description: "Chiffre specifique et surprenant qui force a reconsiderer. Le chiffre est le heros de la headline.", example_headline: "43 ingredients dans ton gel douche. Tu en connais zero." },
      { id: "myth_buster", name: "Par le mythe casse", description: "Detruire une croyance fausse et la remplacer par la verite. Format 'mythe barre + realite'.", example_headline: "Ton gel douche 'hydratant' ne nourrit rien. Il decape et laisse un film chimique." },
      { id: "direct_action", name: "Par l'action directe", description: "Donner une INSTRUCTION au prospect — retourne, regarde, compare. Il devient acteur de sa propre prise de conscience.", example_headline: "Retourne ton gel douche. Lis la liste d'ingredients. Tu comprends quelque chose?" },
      { id: "factual_comparison", name: "Par la comparaison factuelle", description: "Deux faits cote a cote, pas d'opinion. La neutralite apparente rend l'argument plus puissant.", example_headline: "Ton gel douche: 2 semaines. Ce savon: 2 mois." },
    ],
  },

  desire: {
    id: "desire",
    name: "Desire / Tentation sensorielle",
    description: "Entrer par le PLAISIR, pas le probleme. Decrire une experience sensorielle. C'est le 'tempt, don't force' de Mark Morgan Ford.",
    psychological_mechanism: "Le plaisir anticipe est un puissant motivateur. Quand le cerveau simule une experience agreable, il cree un desir de la vivre reellement.",
    awareness_levels: ["unaware"],
    natural_layouts: ["Hero Image", "Product-in-Context", "Golden Hour", "Texture Fill", "Macro Detail"],
    headline_mechanisms: ["Situation Recognition (#2)", "Resultat specifique (#9)"],
    sub_types: [
      { id: "sensory", name: "Desire sensoriel", description: "Activer les sens — il 'sent' l'odeur, 'touche' la texture. Chaque mot doit etre sensoriel, pas informatif.", example_headline: "Le soir, ta serviette sent encore le cedre et le pin." },
      { id: "aspirational", name: "Desire aspirationnel", description: "Decrire un moment de vie desirable. Le produit est integre naturellement, pas comme heros.", example_headline: "Dimanche matin. Cafe lance. Ta douche sent le pin, le cedre et le bois fume." },
      { id: "unexpected_result", name: "Desire par le resultat inattendu", description: "Reveler un resultat sensoriel que le prospect n'a jamais associe a cette categorie de produit.", example_headline: "Le soir, ta serviette sent encore le cedre et le pin." },
      { id: "experiential_contrast", name: "Desire par le contraste experientiel", description: "Ce que tu vis vs ce que tu pourrais vivre. Ton positif, pas critique.", example_headline: "Ta douche dure 5 minutes. Autant que ce soit les meilleures." },
    ],
  },

  identity_play: {
    id: "identity_play",
    name: "Identity Play",
    description: "Vendre une identite, pas un produit. Le prospect achete ce que posseder cet objet dit de LUI. Marqueur d'appartenance a un groupe ou un style de vie.",
    psychological_mechanism: "Les decisions d'achat sont des decisions identitaires. 'Les gens comme moi utilisent ca.' L'achat renforce l'image de soi — levier profond touchant a l'estime.",
    awareness_levels: ["problem_aware", "solution_aware", "product_aware"],
    natural_layouts: ["Hero Image", "Product-in-Context", "Night Mode", "Text-Heavy", "Meme-Style"],
    headline_mechanisms: ["Identite/Appartenance (#10)", "Provocation (#12)", "Situation Recognition (#2)"],
    sub_types: [
      { id: "belonging", name: "Par appartenance", description: "Le produit est un marqueur d'appartenance a un groupe desirable. Le ticket d'entree dans la tribu.", example_headline: "En soiree, personne ne sait que c'est de l'eau." },
      { id: "rebellion", name: "Par rebellion", description: "Acte de rebellion douce contre la norme. Ton decale, assume, legerement provocateur.", example_headline: "Reunion parents d'eleves. 19h30. Ta seule arme: une Liquid Death." },
      { id: "coherence", name: "Par coherence", description: "Exposer une incoherence entre les standards eleves du prospect et son standard bas pour ce produit. ATTENTION: risque de copy trop long.", example_headline: "Tu tracks tes macros mais tu bois de la Cristaline." },
      { id: "aspiration", name: "Par aspiration", description: "Le produit represente qui tu veux devenir. L'achat est un investissement dans l'identite future.", example_headline: "Pour les hommes qui ont decide de mieux prendre soin d'eux." },
    ],
    warning: "Le sous-type 'coherence' produit souvent du copy trop long pour le static ad. Tester la compatibilite concept/format.",
  },

  disruption: {
    id: "disruption",
    name: "Disruption / Reverse Psychology",
    description: "Affirmation exageree ou contraire a la croyance du prospect pour creer un choc cognitif. Le plus scroll-stop mais aussi le plus risque.",
    psychological_mechanism: "Le cerveau ne peut pas ignorer une contradiction avec ses croyances. Cette pause forcee est l'opportunite de livrer le vrai message.",
    awareness_levels: ["unaware", "problem_aware"],
    natural_layouts: ["Text-Heavy", "Product Focus", "Bold Statement", "Hero Image"],
    headline_mechanisms: ["Disruption (#13)", "Provocation (#12)", "Objection Buster (#11)"],
    sub_types: [
      { id: "simple", name: "Disruption simple (T1+T3)", description: "Headline = choc cognitif, sous-texte = insight reel. Pas de sarcasme. Tient dans 20-35 mots.", example_headline: "Ton gel douche fait son job. C'est juste qu'il ne fait QUE ca." },
      { id: "three_beats", name: "Disruption 3 temps (T1+T2+T3)", description: "Choc + sarcasme + insight dans le meme visuel. Plus puissant mais plus long. Budget 35-45 mots max.", example_headline: "T1: Ton gel douche est parfait. T2: Si tu aimes te laver avec du Sodium Laureth Sulfate. T3: Dr. Squatch. 6 ingredients." },
      { id: "pure_sarcasm", name: "Sarcasme pur (T2 seul)", description: "Le sarcasme seul fait le scroll-stop. Tres risque mais tres efficace quand le ton le permet.", example_headline: "Continue de boire ton eau dans une bouteille plastique molle. On ne juge pas." },
    ],
    warning: "UNIQUEMENT pour marques provocatrices/decalees. Inadapte aux marques bienveillantes, maternelles ou premium/serieuses.",
  },

  humor: {
    id: "humor",
    name: "Humour situationnel",
    description: "Placer le produit dans une situation humoristique que le prospect reconnait. Le rire cree sympathie, memorabilite et partage.",
    psychological_mechanism: "L'humour desactive les defenses anti-publicite. Le prospect baisse sa garde. Une ad qui fait sourire se partage — portee organique multipliee.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Hero Image", "Meme-Style", "UGC-Style", "Text-Heavy", "Dating Profile"],
    headline_mechanisms: ["Situation Recognition (#2)", "Disruption (#13)", "Provocation (#12)"],
    sub_types: [],
    warning: "Reserve aux marques dont le ton le permet. L'humour situationnel (scene drole) fonctionne mieux que l'humour verbal (jeu de mots) en static ad.",
  },

  proof_stacking: {
    id: "proof_stacking",
    name: "Proof Stacking",
    description: "Empiler plusieurs arguments ou preuves dans un seul visuel. L'accumulation cree un effet de masse impossible a ignorer.",
    psychological_mechanism: "Un seul argument peut etre rejete. Cinq arguments accumules creent un poids cumulatif — 'il y a trop de preuves pour que ce soit faux'.",
    awareness_levels: ["solution_aware"],
    natural_layouts: ["Collage", "Listicle", "Infographie", "Annotation/Callout"],
    headline_mechanisms: ["Revelation (#7)", "Social Proof (#5)"],
    sub_types: [],
    warning: "Dans un layout Collage: max 5 mots de texte par case. Les IMAGES portent les arguments, pas le texte.",
  },

  direct_solution: {
    id: "direct_solution",
    name: "Solution directe",
    description: "Pas de probleme, pas de manipulation. Ce qu'est le produit, ce qu'il fait, pour qui. Direct, factuel, clair.",
    psychological_mechanism: "Pour les prospects avances, la clarte et la simplicite sont plus persuasives que la sophistication. Trop de techniques creent de la mefiance.",
    awareness_levels: ["product_aware", "most_aware"],
    natural_layouts: ["Product Focus", "Product-in-Context", "Annotation/Callout", "Unboxing/Flat Lay"],
    headline_mechanisms: ["Resultat specifique (#9)", "Interpellation directe (#1)"],
    sub_types: [],
  },

  loss_aversion: {
    id: "loss_aversion",
    name: "Loss Aversion",
    description: "Montrer ce que le prospect perd, risque ou gache en ne changeant pas. Le cout de l'inaction EST l'argument.",
    psychological_mechanism: "Kahneman: la douleur de perdre est 2x plus forte que le plaisir de gagner. Montrer la perte est mathematiquement 2x plus puissant.",
    awareness_levels: ["problem_aware", "solution_aware"],
    natural_layouts: ["Split-Screen", "Text-Heavy", "Statistique/Data Point", "Before/After"],
    headline_mechanisms: ["Loss Aversion (#4)", "Revelation (#7)", "Question Hook (#6)"],
    sub_types: [],
  },

  urgency_scarcity: {
    id: "urgency_scarcity",
    name: "Urgence / Scarite",
    description: "Le temps ou la quantite est limite. Le declencheur final qui convertit l'intention en action.",
    psychological_mechanism: "FOMO — la rarete percue augmente automatiquement la valeur percue. Ce qui est rare est precieux.",
    awareness_levels: ["product_aware", "most_aware"],
    natural_layouts: ["Countdown", "Flash Sale", "Coupon/Promo Card", "Limited Edition"],
    headline_mechanisms: ["Urgence (#8)", "Loss Aversion (#4)"],
    sub_types: [],
    warning: "L'urgence doit TOUJOURS etre legitime. Fausse urgence = confiance detruite de maniere irreversible.",
  },

  objection_buster: {
    id: "objection_buster",
    name: "Objection Buster",
    description: "Adresser frontalement l'objection principale. Le copy nomme l'objection et la detruit dans la meme phrase.",
    psychological_mechanism: "Une objection non adressee reste active et bloque l'achat silencieusement. L'adresser explicitement la neutralise.",
    awareness_levels: ["solution_aware", "product_aware"],
    natural_layouts: ["User vs Brand", "Text-Heavy", "Hero Image", "Testimonial Card"],
    headline_mechanisms: ["Objection Buster (#11)", "Question Hook (#6)", "Social Proof (#5)"],
    sub_types: [],
  },

  authority_expert: {
    id: "authority_expert",
    name: "Autorite / Expert",
    description: "Positionner le produit comme le choix des experts. La credibilite du tiers se transfere directement au produit.",
    psychological_mechanism: "Biais d'autorite (Milgram) — nous suivons les recommandations des figures d'autorite, meme inconsciemment.",
    awareness_levels: ["solution_aware", "product_aware"],
    natural_layouts: ["Press/As Seen In", "Certification Badge", "Influencer Endorsement", "Editorial/Magazine"],
    headline_mechanisms: ["Social Proof (#5)", "Resultat specifique (#9)"],
    sub_types: [],
  },

  price_value_contrast: {
    id: "price_value_contrast",
    name: "Contraste prix/valeur",
    description: "Recadrer le prix en le comparant a un achat quotidien familier ou au cout de l'alternative. Transformer 'cher' en 'evident'.",
    psychological_mechanism: "Le prix est toujours relatif a un point de reference. Changer le point de reference change la perception.",
    awareness_levels: ["solution_aware", "product_aware"],
    natural_layouts: ["Prix Ancre", "Text-Heavy", "Split-Screen", "Receipt/Ticket de caisse"],
    headline_mechanisms: ["Loss Aversion (#4)", "Resultat specifique (#9)", "Objection Buster (#11)"],
    sub_types: [],
  },

  anti_plastic_engagement: {
    id: "anti_plastic_engagement",
    name: "Anti-plastique / Engagement",
    description: "Positionner le produit comme un choix engage — ecologique, ethique, responsable. L'achat devient un acte militant.",
    psychological_mechanism: "L'achat ethique satisfait le besoin de coherence identitaire. C'est aussi un signal social des valeurs du prospect.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Split-Screen", "Text-Heavy", "Infographie", "Certification Badge"],
    headline_mechanisms: ["Loss Aversion (#4)", "Revelation (#7)", "Identite (#10)"],
    sub_types: [],
  },

  gifting: {
    id: "gifting",
    name: "Gifting / Achat pour un tiers",
    description: "Le prospect achete pour quelqu'un qu'il aime. L'angle 'sauveur/protecteur' est active. Le copy parle a l'ACHETEUR, pas a l'utilisateur.",
    psychological_mechanism: "L'instinct de protection pour les proches est un des motivateurs les plus profonds. Active fierte, amour et responsabilite.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Hero Image", "Gift Card", "Seasonal/Event"],
    headline_mechanisms: ["Interpellation directe (#1)", "Situation Recognition (#2)", "Resultat specifique (#9)"],
    sub_types: [],
  },

  soft_rebellion: {
    id: "soft_rebellion",
    name: "Rebellion douce / Anti-ennui",
    description: "Micro-acte de rebellion contre la monotonie ou la norme. Le prospect achete une dose de caractere dans une vie ordinaire.",
    psychological_mechanism: "Le besoin de se sentir unique et d'exprimer sa personnalite a travers ses choix. L'ennui est un ennemi psychologique puissant.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Hero Image", "Product-in-Context", "Text-Heavy", "Meme-Style", "Night Mode"],
    headline_mechanisms: ["Situation Recognition (#2)", "Identite (#10)", "Provocation (#12)"],
    sub_types: [],
    warning: "Reserve aux marques a forte identite qui se positionnent comme alternatives 'avec du caractere'.",
  },

  damaging_admission: {
    id: "damaging_admission",
    name: "Damaging Admission",
    description: "Admettre volontairement une limitation pour augmenter la credibilite de tout le reste. La vulnerabilite strategique cree la confiance.",
    psychological_mechanism: "Quand une marque admet une faiblesse, le cerveau conclut que tout le reste doit etre vrai. L'antidote au 'trop beau pour etre vrai'.",
    awareness_levels: ["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"],
    natural_layouts: ["Text-Heavy", "Hero Image", "Quote Card", "Confession"],
    headline_mechanisms: ["Disruption (#13)", "Objection Buster (#11)"],
    sub_types: [],
  },
};

// ============================================================
// SELECTION MATRIX — Pattern recommendations by awareness level
// ============================================================

export const PATTERN_SELECTION_MATRIX: Record<AwarenessLevel, { recommended: string[]; entry_strategy: string }> = {
  unaware: {
    recommended: ["desire", "education", "social_proof", "identity_play", "humor", "soft_rebellion"],
    entry_strategy: "Entrer par la curiosite, le plaisir ou la situation de vie. JAMAIS par le produit directement.",
  },
  problem_aware: {
    recommended: ["pas", "us_vs_them", "loss_aversion", "education", "disruption"],
    entry_strategy: "Entrer par le probleme nomme explicitement. Le prospect se reconnait immediatement.",
  },
  solution_aware: {
    recommended: ["us_vs_them", "proof_stacking", "objection_buster", "price_value_contrast", "before_after", "identity_play", "social_proof"],
    entry_strategy: "Entrer par la differenciation. Pourquoi CE produit est different de ce que le prospect connait deja.",
  },
  product_aware: {
    recommended: ["social_proof", "authority_expert", "objection_buster", "direct_solution", "urgency_scarcity", "damaging_admission"],
    entry_strategy: "Entrer par la preuve, la validation externe ou l'offre. Le prospect a besoin d'un dernier push.",
  },
  most_aware: {
    recommended: ["urgency_scarcity", "direct_solution", "gifting", "price_value_contrast"],
    entry_strategy: "Entrer par l'offre, la nouveaute ou le rappel. Le prospect est pret — il faut un declencheur.",
  },
};

// ============================================================
// DIRECTIVE FUNCTIONS
// ============================================================

/**
 * Get a compact directive for a specific pattern.
 */
export function getPatternDirective(patternId: string): string {
  const pattern = PERSUASIVE_PATTERNS[patternId];
  if (!pattern) return "";

  const subTypesStr = pattern.sub_types.length > 0
    ? `\nSous-types:\n${pattern.sub_types.map(st => `- ${st.name}: ${st.description}`).join("\n")}`
    : "";

  const warningStr = pattern.warning ? `\n⚠️ ${pattern.warning}` : "";

  return `PATTERN: ${pattern.name}
${pattern.description}
Mecanisme psy: ${pattern.psychological_mechanism}
Layouts naturels: ${pattern.natural_layouts.join(", ")}
Mecanismes headline: ${pattern.headline_mechanisms.join(", ")}${subTypesStr}${warningStr}`;
}

/**
 * Get recommended patterns directive for an awareness level.
 * P5 optimization: limits to top 6 most relevant patterns with compact format.
 */
export function getPatternsForAwarenessDirective(awareness: AwarenessLevel): string {
  const matrix = PATTERN_SELECTION_MATRIX[awareness];
  // P6: limit to 3 patterns max (Claude only uses 1 per concept anyway)
  const topPatternIds = matrix.recommended.slice(0, 3);
  const patternSummaries = topPatternIds
    .map(id => {
      const p = PERSUASIVE_PATTERNS[id];
      if (!p) return null;
      // Compact format: name + 1-line description + headline mechanisms
      const subTypeCount = p.sub_types.length;
      return `- ${p.name}: ${p.description.split(".")[0]}. Mechanisms: ${p.headline_mechanisms.join(", ")}${subTypeCount > 0 ? ` (${subTypeCount} sous-types)` : ""}`;
    })
    .filter(Boolean);

  return `PATTERNS RECOMMANDES (${awareness}, top ${topPatternIds.length}):
${matrix.entry_strategy}
${patternSummaries.join("\n")}`;
}

/**
 * Get full recommended patterns directive (unfiltered).
 * Use for stages that need the complete list.
 */
export function getAllPatternsForAwarenessDirective(awareness: AwarenessLevel): string {
  const matrix = PATTERN_SELECTION_MATRIX[awareness];
  const patternNames = matrix.recommended
    .map(id => PERSUASIVE_PATTERNS[id]?.name)
    .filter(Boolean);

  return `PATTERNS RECOMMANDES (${awareness}):
${matrix.entry_strategy}
Patterns: ${patternNames.join(", ")}`;
}

/**
 * Combinatorics reminder for batch diversity.
 */
export const COMBINATORICS_REMINDER = `La diversite vient du croisement:
20 patterns x 50+ sous-types x 13 mecanismes headline x 100 layouts = MILLIONS de combinaisons.
Explorer les combinaisons inhabituelles — pas seulement les affinites naturelles.
Si un meme concept utilise le meme pattern + sous-type + mecanisme + layout qu'un autre, CHANGER.`;
