import type { CreativeArchetypeId } from "./types";

// ============================================================
// CREATIVE ARCHETYPES — 12 narrative ad strategies
// Each archetype defines a CREATIVE CONCEPT for scroll-stopping
// Meta ads. These are NOT photography styles — they are
// storytelling strategies that place products in imaginative worlds.
// ============================================================

export interface CreativeArchetype {
  id: CreativeArchetypeId;
  name: string;
  description: string;
  visual_strategy: string;
  best_for: string[];
  awareness_levels: string[];
  scene_building_hint: string;
  product_integration: string;
  product_role: "hero" | "supporting" | "contextual" | "absent";
  typical_hooks: string[];
  avoid: string[];
  example_descriptions: string[];
}

export const ARCHETYPES: Record<CreativeArchetypeId, CreativeArchetype> = {
  immersive_world: {
    id: "immersive_world",
    name: "Monde Immersif",
    description: "Le produit est projete dans un univers cinematique completement construit. Ring de boxe, station spatiale, fond sous-marin, chateau medieval, jungle luxuriante. L'univers raconte l'histoire du produit.",
    visual_strategy: "Construire un monde complet autour du produit. L'environnement EST le message. Le produit est naturellement integre dans cet univers comme s'il y avait toujours existe.",
    best_for: ["unaware", "problem_aware"],
    awareness_levels: ["unaware", "problem_aware"],
    scene_building_hint: "Choisis un univers INATTENDU mais lie au benefice du produit. Si le produit est energisant → ring de boxe, volcan, course spatiale. Si le produit est relaxant → jardin zen flottant, fond ocean. L'univers doit etre HYPER-DETAILLE : textures, eclairage, atmosphere.",
    product_integration: "Le produit trone au centre de cet univers comme un artefact magique. Il est eclaire differemment du reste — c'est la star de cette scene cinematique.",
    product_role: "hero",
    typical_hooks: ["pattern_interrupt", "curiosity_gap"],
    avoid: ["univers generique", "fond blanc ou studio", "produit qui semble colle", "scene sans rapport avec le benefice"],
    example_descriptions: [
      "Le paquet de bonbons REBELLE sur un ring de boxe professionnel, cordes rouges, eclairage dramatique de stade, des oursons gummy en position de combat autour du packaging, atmosphere de nuit de championnat",
      "Un serum anti-age pose sur un autel de cristal dans une grotte de glace bleue luminescente, stalactites qui brillent, atmosphere mystique et eternelle",
      "Une capsule de cafe reposant au sommet d'un volcan miniature, lave doree coulant autour, fumee/vapeur de cafe se melant aux nuages, ciel dramatique orange et pourpre",
    ],
  },

  epic_confrontation: {
    id: "epic_confrontation",
    name: "Confrontation Épique",
    description: "Le produit (ou ses ingredients/mascots) dans un combat dramatique contre l'ennemi. Le sucre, les dechets, la fatigue, la peau seche — personnifies et mis KO. Action, drame, victoire.",
    visual_strategy: "Creer une scene de bataille ou de confrontation visuelle. Le produit ou ses elements GAGNENT contre l'ennemi du consommateur. Impact visuel violent mais fun.",
    best_for: ["problem_aware", "solution_aware"],
    awareness_levels: ["problem_aware", "solution_aware"],
    scene_building_hint: "Identifie l'ENNEMI du consommateur (sucre, pollution, rides, fatigue...) et personnifie-le. Cree une scene d'affrontement cinematique : ring, arene, champ de bataille, duel western. Le produit/ses ingredients TRIOMPHENT visuellement.",
    product_integration: "Le produit est soit l'arme, soit le champion. Ses ingredients/composants peuvent etre les combattants. Le packaging est visible et intact — c'est le vainqueur.",
    product_role: "hero",
    typical_hooks: ["us_vs_them", "pattern_interrupt"],
    avoid: ["violence realiste", "ennemi trop abstrait", "resultat ambigu (le produit DOIT gagner)", "scene confuse"],
    example_descriptions: [
      "Des oursons gummy REBELLE qui mettent KO des morceaux de sucre blanc sur un ring, arbitre en arriere-plan, eclairage dramatique, confettis qui volent, atmosphere de victoire",
      "Un flacon de nettoyant ecologique qui fait exploser une montagne de bouteilles plastiques, debris qui volent en slow-motion, fond d'explosion heroique bleu et vert",
      "Des grains de cafe premium qui chargent en formation militaire contre une armee de sachets de cafe instantane gris et tristes, eclairage epique de film de guerre",
    ],
  },

  character_adventure: {
    id: "character_adventure",
    name: "Aventure du Personnage",
    description: "Le produit ou sa mascotte en personnage vivant dans une aventure. Road trip, explorateur, surfer, pilote. Fun, dynamique, plein de personnalite.",
    visual_strategy: "Donner vie au produit ou a sa mascotte. Le placer dans une aventure FUN et aspirationnelle. Le produit a une personnalite, il VIT.",
    best_for: ["unaware", "solution_aware"],
    awareness_levels: ["unaware", "solution_aware"],
    scene_building_hint: "Le produit ou sa mascotte est le HEROS d'une micro-aventure. Il conduit, il surfe, il voyage, il danse. L'environnement est aspirationnel : route cotiere, montagne, club VIP, plage paradisiaque. L'ambiance est JOYEUSE et energique.",
    product_integration: "Le produit est anthropomorphise ou accompagne d'une mascotte qui le represente. Le packaging reste reconnaissable meme dans l'aventure. Le produit = le personnage cool que tu veux etre.",
    product_role: "hero",
    typical_hooks: ["identity_call", "emotional_mirror"],
    avoid: ["personnage generique", "aventure ennuyeuse", "produit invisible", "mascotte trop enfantine pour un produit adulte"],
    example_descriptions: [
      "L'ourson gummy REBELLE conduit un cabriolet jaune vintage sur une route cotiere californienne, lunettes de soleil, cheveux au vent, palmiers, coucher de soleil dore, ambiance vacances de luxe",
      "Une bouteille de vin qui fait du surf sur une vague geante au coucher du soleil, eclaboussures dorees, ambiance premium et aventureuse, ciel orange et violet",
      "Le paquet de chips qui fait du parachutisme au-dessus d'un paysage spectaculaire de montagnes, parachute aux couleurs de la marque, ciel bleu intense",
    ],
  },

  surreal_scale: {
    id: "surreal_scale",
    name: "Échelle Surréaliste",
    description: "Jeu d'echelle dramatique. Produit geant dans une ville, mini-personnages qui escaladent le packaging, produit comme monument/building. Le changement d'echelle cree l'emerveillement.",
    visual_strategy: "Transformer le produit en quelque chose de MONUMENTAL par un changement d'echelle radical. Creer un sentiment d'emerveillement et de spectaculaire.",
    best_for: ["unaware", "problem_aware"],
    awareness_levels: ["unaware", "problem_aware"],
    scene_building_hint: "Le produit est soit GEANT dans un environnement normal (gratte-ciel, monument), soit des mini-personnages interagissent avec un produit de taille normale mais pour eux c'est un monde. Utilise la perspective tilt-shift, des ombres dramatiques, des personnages minuscules pour vendre l'echelle.",
    product_integration: "Le packaging EXACT du produit est visible et constitue l'element central — c'est le monument, le building, le paysage. La marque et le design sont parfaitement lisibles.",
    product_role: "hero",
    typical_hooks: ["pattern_interrupt", "curiosity_gap"],
    avoid: ["echelle peu claire", "produit deforme", "personnages trop petits pour etre vus", "scene qui ne fait pas rever"],
    example_descriptions: [
      "Le paquet de bonbons REBELLE geant comme un gratte-ciel au milieu d'une ville miniature, des mini-voitures et mini-pietons autour, eclairage urbain de nuit avec neons, vue en contre-plongee spectaculaire",
      "Des mini-explorateurs en equipement d'escalade qui gravissent un tube de creme geant comme une montagne enneigee, base camp avec petites tentes, eclairage d'aube alpine",
      "La bouteille de parfum posee au centre d'un desert comme un monolithe mysterieux, caravane de chameaux minuscules en arriere-plan, lumiere dorée du desert, atmosphere epique",
    ],
  },

  luxury_staging: {
    id: "luxury_staging",
    name: "Mise en Scène Luxe",
    description: "Le produit eleve au rang d'objet d'art ou de piece de collection. Piedestal de musee, ecrin de velours, lumiere de galerie, traitement VIP. Le produit MERITE d'etre contemple.",
    visual_strategy: "Traiter le produit comme un objet precieux dans un environnement luxueux. Museum-quality staging. Chaque detail respire le premium, la rarete, l'exception.",
    best_for: ["product_aware", "most_aware"],
    awareness_levels: ["product_aware", "most_aware"],
    scene_building_hint: "Cree un environnement ULTRA-PREMIUM pour le produit : galerie d'art minimaliste, coffret VIP, scenographie de bijouterie, surface de marbre italien. L'eclairage est dramatique et precis — chaque reflet est intentionnel. L'ambiance dit 'ceci est rare et precieux'.",
    product_integration: "Le produit est presente comme une piece de musee ou un bijou. Parfaitement eclaire, parfaitement net. Le packaging est magnifie — chaque detail de design est visible et sublime par la lumiere.",
    product_role: "hero",
    typical_hooks: ["identity_call", "authority_signal"],
    avoid: ["luxe generique sans personnalite", "trop de props qui distraient", "eclairage plat", "fond blanc basique"],
    example_descriptions: [
      "Le produit REBELLE presente sur un piedestal de marbre noir dans une galerie d'art contemporain, eclairage spot dramatique, murs blancs, sol reflectant, atmosphere de vernissage exclusif",
      "La montre posee sur un coussin de velours bordeaux dans un coffret en bois precieux, lumiere doree laterale, particules de poussiere d'or flottantes, ambiance de chambre forte",
      "Le serum dans une vitrine de musee en verre, avec un petit cartel dore, fond noir profond, un seul rayon de lumiere qui frappe le flacon et cree des reflets prismatiques",
    ],
  },

  pop_culture_twist: {
    id: "pop_culture_twist",
    name: "Twist Pop Culture",
    description: "Le produit insere dans une reference culturelle reconnaissable. Parodie de film, clin d'oeil artistique, reference a un meme, detournement d'une scene iconique. Humour + reconnaissance = arret du scroll.",
    visual_strategy: "Prendre une reference culturelle CONNUE et y inserer le produit de maniere inattendue mais drole. Le spectateur reconnait la reference et sourit — double engagement.",
    best_for: ["unaware", "problem_aware"],
    awareness_levels: ["unaware", "problem_aware"],
    scene_building_hint: "Choisis une reference culturelle FORTE et RECONNUE : scene de film iconique, tableau celebre, meme populaire, couverture de magazine, affiche de film. Insere le produit comme element cle de la scene. L'humour vient du decalage entre la reference serieuse et le produit.",
    product_integration: "Le produit REMPLACE un element cle de la reference ou s'y insere naturellement. Il est parfaitement integre dans le style visuel de la reference tout en restant 100% reconnaissable.",
    product_role: "hero",
    typical_hooks: ["pattern_interrupt", "curiosity_gap"],
    avoid: ["references trop obscures", "irrespect de la reference", "produit force dans la scene", "droits d'auteur problematiques (rester dans la parodie/hommage)"],
    example_descriptions: [
      "Le paquet REBELLE en mode 'Mona Lisa' — le paquet tenu avec les mains croisees comme la Joconde, fond de paysage italien, cadre dore, eclairage Renaissance, sourire enigmatique (deux oursons gummy forment les yeux)",
      "La bouteille de sauce piquante dans une scene de duel western — deux flacons face a face dans une rue poussiereuse, tumbleweeds, eclairage de midi brulant, typographie de wanted poster",
      "Le packaging pose devant un fond de couverture de magazine Vogue, avec le titre 'Produit de l'annee', eclairage de studio photo fashion, ambiance editoriale haute couture",
    ],
  },

  sensory_explosion: {
    id: "sensory_explosion",
    name: "Explosion Sensorielle",
    description: "Les ingredients, textures, saveurs EXPLOSENT hors du produit. Eclaboussures, particules, eruptions de couleur et de matiere. On SENT et GOUTE le produit a travers l'ecran.",
    visual_strategy: "Creer une explosion visuelle de tout ce qui rend le produit desirable. Ingredients en action, textures en gros plan, couleurs vibrantes, mouvement dynamique. Le spectateur doit RESSENTIR le produit.",
    best_for: ["solution_aware", "product_aware"],
    awareness_levels: ["solution_aware", "product_aware"],
    scene_building_hint: "Le produit s'ouvre, explose, libere son contenu de maniere spectaculaire. Les ingredients volent en slow-motion, les couleurs eclaboussent, les textures se deploient. Utilise des eclats de lumiere, des particules, des eclaboussures. Le fond est soit noir (pour le contraste) soit complementaire aux couleurs du produit.",
    product_integration: "Le packaging est au centre, intact et reconnaissable, MAIS ses ingredients/composants en jaillissent de maniere dynamique. Le produit est la source de toute cette energie visuelle.",
    product_role: "hero",
    typical_hooks: ["instant_benefit", "curiosity_gap"],
    avoid: ["explosion qui cache le produit", "trop de chaos", "ingredients non identifiables", "image degoutante au lieu d'appetissante"],
    example_descriptions: [
      "Le paquet REBELLE qui s'ouvre avec une explosion de petits oursons gummy colores qui volent dans tous les sens, eclats de sucre cristallise, spirales de saveurs fruitees en couleurs vives, fond noir dramatique",
      "La capsule de cafe qui eclate avec un torrent de grains de cafe torrefies, fumee aromatique, eclaboussures de cafe liquide dore en slow-motion, particules de cacao, fond sombre avec eclairage chaud",
      "Le pot de creme qui libere un tourbillon de petales de rose, gouttelettes d'acide hyaluronique, perles dorees, le tout en levitation autour du packaging, fond degrade rose-blanc",
    ],
  },

  absurd_humor: {
    id: "absurd_humor",
    name: "Humour Absurde",
    description: "Situation completement inattendue, bizarre, drole. Le produit dans un contexte tellement WTF que tu ne peux pas ne pas t'arreter. L'absurde = le scroll stop ultime.",
    visual_strategy: "Placer le produit dans une situation ABSURDE qui fait rire et reflechir. Le decalage entre le produit et la situation cree l'humour. Plus c'est inattendu, mieux c'est.",
    best_for: ["unaware", "problem_aware"],
    awareness_levels: ["unaware", "problem_aware"],
    scene_building_hint: "Imagine la situation la plus IMPROBABLE mais visuellement claire. Le produit dans un endroit ou un contexte ou il n'a RIEN a faire — mais d'une maniere qui fait sourire et qui est liee au benefice. L'execution doit etre PREMIUM — l'absurde marche quand c'est bien fait visuellement.",
    product_integration: "Le produit est parfaitement reconnaissable au milieu du chaos. Il est le seul element 'normal' dans une scene folle — ou l'inverse : c'est le produit qui fait quelque chose de fou.",
    product_role: "hero",
    typical_hooks: ["pattern_interrupt", "curiosity_gap"],
    avoid: ["humour vulgaire", "scene incomprehensible", "execution cheap", "absurde sans lien avec le benefice"],
    example_descriptions: [
      "L'ourson gummy REBELLE en costume 3 pieces qui preside une reunion de conseil d'administration, les autres 'membres' sont des morceaux de sucre nerveux, salle de reunion corporate serieuse, ambiance boardroom thriller",
      "Le tube de dentifrice qui prend un bain moussant dans un lavabo miniature, peignoir, bougies, verre de champagne a cote, ambiance spa de luxe, eclairage doux",
      "La boite de cereales qui fait du stand-up comedy devant un public de bols et de cuilleres, projecteur sur scene, micro en metal brillant, rideau rouge de theatre",
    ],
  },

  emotional_snapshot: {
    id: "emotional_snapshot",
    name: "Instant Émotionnel",
    description: "Un moment emotionnel puissant et VRAI ou le produit joue un role central. Joie pure, soulagement, fierte, triomphe, tendresse. L'emotion EST le message — le produit en est le catalyseur.",
    visual_strategy: "Capturer UN moment emotionnel intense. Le produit est present dans la scene mais c'est l'EMOTION qui domine. Le spectateur RESSENT avant de comprendre.",
    best_for: ["solution_aware", "most_aware"],
    awareness_levels: ["solution_aware", "most_aware"],
    scene_building_hint: "Identifie l'emotion la PLUS FORTE liee au benefice du produit. Cree une scene ou cette emotion est VISIBLE sur un visage, dans un geste, dans une atmosphere. La lumiere, les couleurs, la composition servent l'emotion. Le moment est SPECIFIQUE (pas 'une femme heureuse' mais 'une femme qui decouvre que ses rides ont disparu en se regardant dans un miroir embue').",
    product_integration: "Le produit est present dans la scene de maniere NATURELLE — sur la table, dans la main, en arriere-plan visible. Il n'est pas le focus premier mais on comprend qu'il est la CAUSE de cette emotion.",
    product_role: "supporting",
    typical_hooks: ["emotional_mirror", "identity_call"],
    avoid: ["emotion fausse/forcee", "stock photo generic", "sourire sans raison", "produit invisible dans la scene"],
    example_descriptions: [
      "Un enfant avec un ENORME sourire, les joues pleines de bonbons gummy, les yeux brillants, le paquet REBELLE ouvert devant lui, lumiere chaude de cuisine familiale, moment de pur bonheur",
      "Un couple qui eclate de rire en cuisinant ensemble, le produit culinaire sur le plan de travail entre eux, vapeur, ingredients, lumiere doree du soir, joie contagieuse",
      "Une femme qui se regarde dans un miroir avec un sourire de confiance, le serum bien visible sur la tablette du lavabo, lumiere douce du matin, expression de fierte sereine",
    ],
  },

  graphic_statement: {
    id: "graphic_statement",
    name: "Statement Graphique",
    description: "Design graphique bold avec typographie frappante, formes geometriques, couleurs saturees. Le produit flotte dans un univers graphique design. Impact d'affiche.",
    visual_strategy: "Creer un visuel qui a l'impact d'une AFFICHE de designer. Couleurs saturees, formes geometriques, espaces negatifs, typographie comme element graphique. Le produit dans un univers de design pure.",
    best_for: ["product_aware", "most_aware"],
    awareness_levels: ["product_aware", "most_aware"],
    scene_building_hint: "Pense POSTER, pas photo. Fond de couleur unie saturee ou degrade bold. Formes geometriques (cercles, triangles, vagues) comme elements graphiques. Le produit flotte dans cet espace graphique. Les textes sont des ELEMENTS VISUELS — grands, bold, avec une typographie qui fait partie du design.",
    product_integration: "Le produit est photographiquement realiste mais place dans un espace graphique abstrait. Le contraste entre le produit realiste et le fond graphique cree l'impact. Le packaging est NET et bien eclaire.",
    product_role: "hero",
    typical_hooks: ["instant_benefit", "authority_signal"],
    avoid: ["fond blanc sans personnalite", "trop de couleurs", "typo illisible", "produit perdu dans le graphisme"],
    example_descriptions: [
      "Le paquet REBELLE flottant au centre d'un fond jaune vif avec des cercles concentriques orange et rouge, ombre portee graphique, ambiance poster retro modernise, typo bold geometrique",
      "La creme sur fond degrade violet-rose, entouree de formes 3D abstraites metalliques (spheres, tores), style design contemporain, eclairage neon, espace negatif genereux pour le headline",
      "Le produit au centre d'un fond split noir/blanc avec un grand cercle de couleur accent derriere, lignes geometriques fines, typographie helvetica geante, style design suisse minimal mais impactant",
    ],
  },

  transformation_story: {
    id: "transformation_story",
    name: "Histoire de Transformation",
    description: "Une histoire visuelle de changement/metamorphose en une seule image. Le produit est le catalyseur de la transformation. Pas un split-screen — une HISTOIRE visuelle continue.",
    visual_strategy: "Montrer la transformation dans une SEULE image continue. Le changement est visible comme un flux, une metamorphose, une evolution. Le produit est le point de bascule.",
    best_for: ["problem_aware", "solution_aware"],
    awareness_levels: ["problem_aware", "solution_aware"],
    scene_building_hint: "Cree une scene ou la transformation est VISIBLE en un regard. Un cote de l'image montre l'avant (gris, terne, problematique), l'autre montre l'apres (vibrant, resolu, beau), et le produit est AU MILIEU comme le catalyseur. La transition doit etre FLUIDE, pas un split brutal. Pense flux, metamorphose, gradient.",
    product_integration: "Le produit est positionne EXACTEMENT au point de transition — la ou l'avant devient l'apres. Il est le pivot visuel de toute la scene. Net, eclaire, heroique.",
    product_role: "hero",
    typical_hooks: ["before_after", "pattern_interrupt"],
    avoid: ["split screen brutal", "transformation trop subtile", "produit pas au centre du changement", "avant/apres cliche"],
    example_descriptions: [
      "Un paysage qui se transforme de desert sec et gris (gauche) en foret luxuriante et verte (droite), le produit eco-responsable au centre exact, racines qui partent du produit vers la foret, eclairage progressif de gris a dore",
      "Un visage dont la peau passe de terne et fatiguee (gauche) a eclatante et lumineuse (droite), le flacon de serum positionne au centre, la transformation irradie depuis le produit comme des ondes",
      "Une cuisine qui passe de chaotique et sale a immaculee et designee, le produit de nettoyage au centre, les elements sales se metamorphosent en elements propres en spirale autour du produit",
    ],
  },

  social_proof_scene: {
    id: "social_proof_scene",
    name: "Scène de Preuve Sociale",
    description: "Le produit dans une scene qui communique VISUELLEMENT la popularite, la confiance, l'autorite. Files d'attente, rupture de stock, experts qui approuvent, recompenses. La preuve est VISUELLE, pas textuelle.",
    visual_strategy: "Montrer VISUELLEMENT que le produit est populaire, approuve, desire. Pas avec du texte — avec une SCENE qui prouve la desirabilite. Crowd, rarity, authority, awards.",
    best_for: ["product_aware", "most_aware"],
    awareness_levels: ["product_aware", "most_aware"],
    scene_building_hint: "Cree une scene qui CRIE 'tout le monde veut ce produit'. Idees : rayon de supermarche vide sauf un dernier exemplaire sous projecteur / file d'attente de personnages stylises / podium de ceremonie de recompense / expert en blouse qui presente le produit / 5 etoiles geantes dorees. La scene doit etre instantanement lisible.",
    product_integration: "Le produit est l'OBJET de tout le desir/attention de la scene. Il est au centre de la convoitise, de l'attention, de la celebration. Parfaitement visible et desirable.",
    product_role: "hero",
    typical_hooks: ["social_proof_shock", "fear_of_missing"],
    avoid: ["faux temoignages textuels", "scene peu credible", "trop de monde qui distrait", "produit cache par la foule"],
    example_descriptions: [
      "Un rayon de supermarche completement vide, toutes les etageres sont nues SAUF une ou le dernier paquet REBELLE brille sous un projecteur dore, etiquette 'dernier en stock', ambiance de rarete",
      "Le produit sur un podium de premiere place, confettis dores, trophees autour, eclairage de ceremonie de remise de prix, fond de velours rouge, atmosphere de couronnement",
      "Des mains tendues de partout qui essaient d'attraper le produit, eclaire au centre en levitation, halo lumineux, fond sombre, desir collectif palpable, style renaissance revisitee",
    ],
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES) as CreativeArchetypeId[];

/**
 * Select diverse archetypes for a batch, ensuring variety.
 * Avoids repeating the same archetype unless count > 12.
 */
export function selectArchetypesForBatch(
  count: number,
  preferredAwarenessLevels?: string[]
): CreativeArchetypeId[] {
  let pool = [...ARCHETYPE_IDS];

  // If awareness levels specified, prioritize matching archetypes
  if (preferredAwarenessLevels?.length) {
    const prioritized = pool.filter((id) =>
      ARCHETYPES[id].awareness_levels.some((al) =>
        preferredAwarenessLevels.includes(al)
      )
    );
    const rest = pool.filter((id) => !prioritized.includes(id));
    pool = [...prioritized, ...rest];
  }

  // Shuffle with Fisher-Yates for true diversity
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Take first `count` items, cycling if count > 12
  const selected: CreativeArchetypeId[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(pool[i % pool.length]);
  }

  return selected;
}

/**
 * Format archetype library as context for Claude prompts.
 */
export function formatArchetypesForPrompt(archetypeIds: CreativeArchetypeId[]): string {
  return archetypeIds
    .map((id, i) => {
      const a = ARCHETYPES[id];
      return `[Concept ${i + 1}] Archetype: ${a.id} — "${a.name}"
  Description: ${a.description}
  Construction de scene: ${a.scene_building_hint}
  Integration produit: ${a.product_integration}
  Hooks: ${a.typical_hooks.join(", ")}
  Exemples:
  ${a.example_descriptions.map((ex, j) => `  ${j + 1}. ${ex}`).join("\n")}
  Eviter: ${a.avoid.join(", ")}`;
    })
    .join("\n\n");
}
