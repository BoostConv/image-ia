import type { AwarenessLevel } from "./types";

// ============================================================
// KNOWLEDGE: VISUAL CONCEPTS LIBRARY
// Source: PDF3 — 75 Visual Concepts by Awareness Level
// + Layout logic rules + Style selector
// ============================================================

export interface VisualConceptEntry {
  id: string;
  name: string;
  mechanic: string;
  example: string;
}

/**
 * 75 visual concepts organized by awareness level.
 * The AI picks a concept compatible with the prospect's awareness.
 */
export const VISUAL_CONCEPTS: Record<AwarenessLevel, VisualConceptEntry[]> = {
  unaware: [
    { id: "call_out", name: "L'Appel a l'Identite", mechanic: "Interpeller une caracteristique demographique precise", example: "Pour les hommes de plus de 40 ans qui detestent le cardio" },
    { id: "warning_ad", name: "L'Avertissement", mechanic: "Codes visuels du danger/alerte pour piquer la curiosite", example: "Fond noir/jaune. Attention: Ne lisez pas ceci si..." },
    { id: "visual_analogy", name: "L'Analogie Visuelle", mechanic: "Comparer le probleme a un objet du quotidien", example: "Portefeuille vs hamburger" },
    { id: "notes_app", name: "La Note Manuscrite", mechanic: "Capture d'ecran app Notes iPhone, semble personnel", example: "3 choses que j'aurais aime savoir a 20 ans" },
    { id: "shocking_fact", name: "Le Fait Choquant", mechanic: "Statistique qui brise une croyance etablie", example: "80% de la poussiere chez vous est de la peau morte" },
    { id: "common_error", name: "L'Erreur Commune", mechanic: "Pointer une habitude que l'audience fait mal", example: "Vous brossez vos dents de la mauvaise maniere" },
    { id: "ugly_ad", name: "Le Ugly Ad", mechanic: "Esthetique amateur/brute pour tromper la cecite publicitaire", example: "Photo mal cadree, texte au marqueur" },
    { id: "storytelling", name: "L'Histoire Personnelle", mechanic: "Debut narration intrigante", example: "Mon patron m'a vire, alors j'ai cree ceci..." },
    { id: "hyperbole", name: "L'Hyperbole Humoristique", mechanic: "Exageration evidente pour divertir", example: "Ce cafe est plus fort que votre ex" },
    { id: "native_feel", name: "Le Native Feel", mechanic: "Capture ecran reseau social (Twitter, Reddit)", example: "Tweet: Je viens de decouvrir ce hack" },
    { id: "von_restorff", name: "Le Contraste Von Restorff", mechanic: "Briser le pattern visuel du feed", example: "Image N&B dans un feed colore, image a l'envers" },
    { id: "villain_attack", name: "L'Attaque du Vilain", mechanic: "Designer un ennemi commun", example: "Ce que les banques ne veulent pas que vous sachiez" },
  ],
  problem_aware: [
    { id: "sick_of", name: "La Question Marre de...?", mechanic: "Adresser la frustration frontalement", example: "Fatigue de l'acne adulte qui revient toujours?" },
    { id: "problem_illustration", name: "L'Illustration du Probleme", mechanic: "Representation visuelle de la douleur", example: "Petit personnage sous un nuage noir" },
    { id: "infinite_cycle", name: "Le Cycle Infernal", mechanic: "Montrer la boucle infinie de l'echec", example: "Regime -> Faim -> Craquage -> Culpabilite -> Regime" },
    { id: "visual_metaphor", name: "La Metaphore Visuelle", mechanic: "Comparer le ressenti a une image forte", example: "Batterie sociale a plat" },
    { id: "symptom_checklist", name: "L'Identification par les Symptomes", mechanic: "Checklist de reconnaissance", example: "Si vous avez ces 3 signes, votre foie souffre" },
    { id: "without", name: "Le Sans...", mechanic: "Promesse de resultat - Douleur de l'effort", example: "Un ventre plat SANS faire 1000 abdos" },
    { id: "empathy", name: "L'Empathie Directe", mechanic: "Valider le ressenti difficile", example: "On sait que c'est dur de voir ses enfants echouer" },
    { id: "not_your_fault", name: "Le Pas de votre faute", mechanic: "Dedouaner le prospect", example: "Ce n'est pas vous, c'est votre metabolisme" },
    { id: "if_then", name: "Le Si..., Alors...", mechanic: "Logique conditionnelle simple", example: "Si vous aimez le cafe, alors vous allez adorer ceci" },
    { id: "pain_agitation", name: "L'Agitation de la Douleur", mechanic: "Rendre le probleme urgent", example: "Ignorer ce mal de dos peut vous couter votre mobilite" },
    { id: "stop", name: "Le Stop...", mechanic: "Ordre d'arret d'une action inefficace", example: "Arretez de jeter votre argent par les fenetres" },
    { id: "iceberg", name: "L'Iceberg", mechanic: "Montrer la cause cachee", example: "Visible: Fatigue. Cache: Carence en Magnesium" },
  ],
  solution_aware: [
    { id: "us_vs_them", name: "Us vs Them", mechanic: "Tableau comparatif binaire", example: "Nous (Naturel, Rapide) vs Eux (Chimique, Lent)" },
    { id: "venn_diagram", name: "Le Diagramme de Venn", mechanic: "Intersection de deux benefices rares", example: "Intersection entre Bon et Sante" },
    { id: "old_vs_new", name: "Old vs New Way", mechanic: "Evolution temporelle/technologique", example: "L'ere des pilules est finie. Bienvenue a l'ere du patch" },
    { id: "fake_vs_real", name: "Fake vs Real", mechanic: "Comparaison de qualite visuelle", example: "Ours gelatine (Faux) vs Pot de Miel (Vrai)" },
    { id: "switch", name: "Le Switch", mechanic: "Temoignage de transition", example: "J'ai jete mon cafe pour ce Matcha" },
    { id: "unique_mechanism", name: "Le Mecanisme Unique", mechanic: "Explication scientifique/technique visuelle", example: "Coupe transversale montrant la semelle speciale" },
    { id: "ditch", name: "Le Ditch the...", mechanic: "Incitation a l'abandon de l'obsolete", example: "Jetez votre rasoir en plastique" },
    { id: "not_what_you_think", name: "Le Pas ce que vous pensez", mechanic: "Contrer une idee recue", example: "Ce n'est pas du fond de teint, c'est du soin teinte" },
    { id: "price_comparison", name: "Le Comparatif de Prix", mechanic: "Demontrer l'economie long terme", example: "Un cafe/jour (100$/mois) vs Notre solution (20$/mois)" },
    { id: "x_for_y", name: "Le X pour Y", mechanic: "Ancrage sur reference connue", example: "Le Uber des plombiers" },
    { id: "split_screen", name: "Le Split Screen", mechanic: "Ecran divise 50/50", example: "Gauche: Stresse/Concurrent / Droite: Zen/Notre Produit" },
  ],
  product_aware: [
    { id: "price_objection", name: "L'Objection Prix Frontale", mechanic: "Admettre le prix eleve pour justifier la valeur", example: "Oui, c'est cher. Mais ca dure 10 ans" },
    { id: "testimonial_raw", name: "Le Temoignage Notes App", mechanic: "Avis client brut/authentique", example: "Capture SMS: Wow, ca marche vraiment" },
    { id: "social_proof_mass", name: "La Preuve Sociale de Masse", mechanic: "Gros chiffres d'autorite", example: "100 000 utilisateurs" },
    { id: "authority_expert", name: "L'Autorite Expert", mechanic: "Validation blouse blanche ou logo media", example: "Recommande par les dentistes" },
    { id: "before_after", name: "Le Avant/Apres", mechanic: "Preuve visuelle du resultat", example: "Peau terne vs Peau eclatante" },
    { id: "unboxing", name: "L'Unboxing", mechanic: "Contenu exact (reduire l'incertitude)", example: "Vue a plat de tout dans la boite" },
    { id: "guarantee", name: "La Garantie", mechanic: "Annuler le risque financier", example: "Satisfait ou Rembourse 90 jours" },
    { id: "ugc_in_action", name: "Le UGC en Action", mechanic: "Utilisateur reel utilisant le produit", example: "Selfie miroir d'un client" },
    { id: "pratfall", name: "Le Pratfall (Defaut Avoue)", mechanic: "Admettre une faiblesse mineure", example: "Nos emballages sont moches car on investit dans les ingredients" },
    { id: "feature_spotlight", name: "Le Feature Spotlight", mechanic: "Zoom extreme sur un detail qualite", example: "Zoom sur la couture d'un sac" },
    { id: "founder_story", name: "Le Qui nous sommes", mechanic: "Humaniser la marque", example: "Photo du fondateur dans son garage" },
    { id: "reverse_qualification", name: "La Qualification Inversee", mechanic: "Ne l'achetez pas sauf si...", example: "N'achetez pas ceci sauf si vous detestez repasser" },
  ],
  most_aware: [
    { id: "direct_offer", name: "L'Offre Directe Barree", mechanic: "Le prix est le heros", example: "100E -> 50E" },
    { id: "back_in_stock", name: "Le Back in Stock", mechanic: "Preuve sociale + Rarete", example: "Enfin de retour (pour l'instant)" },
    { id: "flash_sale", name: "La Flash Sale", mechanic: "Urgence temporelle", example: "Finit ce soir a minuit" },
    { id: "bundle", name: "Le Bundle", mechanic: "Augmenter panier moyen / Valeur percue", example: "1 achete = 1 offert" },
    { id: "free_gift", name: "Le Cadeau Gratuit", mechanic: "Incitation bonus", example: "Trousse offerte avec votre commande" },
    { id: "hero_shot", name: "Le Hero Shot Simple", mechanic: "Beaute du produit pur", example: "Produit sur fond uni, eclairage parfait" },
    { id: "low_stock", name: "Le Low Stock Warning", mechanic: "Urgence de quantite", example: "Plus que 5 unites" },
    { id: "shop_now", name: "Le Shop Now Visuel", mechanic: "Style catalogue", example: "Image produit + Bouton d'achat graphique" },
    { id: "exclusivity", name: "L'Exclusivite VIP", mechanic: "Acces privilegie", example: "Acces reserve aux membres" },
    { id: "offer_stack", name: "Le Recapitulatif de l'Offre", mechanic: "Empilement de valeur visuelle", example: "Boite + Bonus 1 + Bonus 2 + Garantie" },
  ],
};

/**
 * Visual style modes (from PDF3 Section 3).
 */
export const STYLE_MODES = {
  raw_ugc: {
    when: "Avatar Sceptique, Marche Sature, Unaware/Problem Aware",
    objective: "Casser la cecite publicitaire",
    lighting: "Natural window light, Phone flash, Slightly underexposed",
    texture: "Grainy, Amateur aesthetic, Selfie angle",
    branding: "MINIMAL ou NUL. Polices standard (Arial, sans-serif)",
  },
  high_end: {
    when: "Retargeting (Most Aware), Statut Social",
    objective: "Eye Candy, Autorite, Confiance institutionnelle",
    lighting: "Studio softbox, Rim light, Cinematic depth of field",
    texture: "Sharp, Glossy, High definition",
    branding: "FORT. Respect strict des codes HEX et polices de marque",
  },
  hybrid: {
    when: "Temoignages, Preuve Sociale",
    objective: "Melange organique + propre",
    lighting: "Mix natural + studio fill",
    texture: "Element organique (main, note manuscrite) sur fond propre",
    branding: "MODERE. Fond marque + element authentique",
  },
} as const;

/**
 * Layout logic rules (from PDF3 Section 2).
 */
export const LAYOUT_RULES = {
  visual_hierarchy: {
    top: "RATIONAL: price, offer, product name, explicit promise (logical brain processes first)",
    bottom: "EMOTIONAL: aspirational benefit, lifestyle, belonging (anchors desire after logic validates)",
  },
  text_image_complementarity: "Text explains (left brain analytical). Image shows emotional RESULT, not feature. If text says 'loses weight', image shows the woman feeling beautiful, NOT just the bottle.",
  disney_method: "Avoid pointy/aggressive shapes for friendly products. Use fluid, pleasant compositions.",
  perceptual_fluency: "Image must be readable in 0.3 seconds. If user squints to understand, you've lost.",
  avatar_alignment: "Visual must validate the target's identity. If targeting 40yo dads, don't show a 20yo athlete.",
  big_idea_test: "If you remove all text, does the image alone communicate the promise?",
} as const;

/**
 * Visual hygiene rules (anti-AI artifacts).
 */
export const VISUAL_HYGIENE = {
  clutter_free: ["Clean composition", "Uncluttered background", "Focus on subject"],
  anti_plastic: ["Visible skin pores", "Natural skin texture", "Peach fuzz", "Micro-imperfections", "Shot on 35mm film"],
} as const;

/**
 * Get visual concepts for a specific awareness level.
 */
export function getConceptsForAwareness(awareness: AwarenessLevel): VisualConceptEntry[] {
  return VISUAL_CONCEPTS[awareness] || VISUAL_CONCEPTS.problem_aware;
}

/**
 * Compact directive for visual concept selection.
 */
export function getVisualConceptDirective(awareness: AwarenessLevel): string {
  const concepts = VISUAL_CONCEPTS[awareness];
  const conceptList = concepts.slice(0, 6).map(c => `- ${c.name}: ${c.mechanic}`).join("\n");
  return `CONCEPTS VISUELS (${awareness}):
${conceptList}
LAYOUT: Rationnel en haut, Emotionnel en bas. Texte explique, image montre le RESULTAT emotionnel.
TEST: L'image seule (sans texte) communique-t-elle la promesse?`;
}
