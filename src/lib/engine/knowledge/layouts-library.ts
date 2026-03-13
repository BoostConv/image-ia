// ============================================================
// KNOWLEDGE: 100 LAYOUTS FOR STATIC ADS
// Source: 100_layouts_ads_statiques_v2_2.pdf
// 8 categories, 100 layouts, pattern affinities.
// ============================================================

export interface LayoutEntry {
  id: number;
  name: string;
  category: string;
  description: string;
  principle: string;
  patterns: string[];
  use_cases: string;
}

export const LAYOUT_CATEGORIES = [
  "Image-Centered (1-20)",
  "Text-Centered (21-30)",
  "Comparative (31-40)",
  "Social Proof (41-55)",
  "Educational (56-70)",
  "Promotional (71-80)",
  "Format-Mimetic (81-95)",
  "Emotional/Narrative (96-100)",
] as const;

export const LAYOUTS: LayoutEntry[] = [
  // ─── CATEGORY 1: IMAGE-CENTERED (1-20) ──────────────────
  { id: 1, name: "Hero Image", category: "Image-Centered", description: "Image dominante 70-80% du visuel, copy en overlay (haut, bas ou cote).", principle: "Une seule image forte fait tout le travail visuel.", patterns: ["PAS", "Desire", "Identity", "Transformation", "Social Proof"], use_cases: "Ads lifestyle, emotionnelles, aspirationnelles, mise en situation produit" },
  { id: 2, name: "Product Focus", category: "Image-Centered", description: "Produit isole au centre, heroïse par l'eclairage. Fond uni, texture ou degrade.", principle: "Le produit EST le visuel.", patterns: ["Desire", "Product Demo", "Scarcity", "Value"], use_cases: "Lancement produit, gamme, retargeting, editions limitees, promotions" },
  { id: 3, name: "Product-in-Context", category: "Image-Centered", description: "Produit integre dans une scene de vie reelle, reste le heros.", principle: "Montrer le produit la ou il vit.", patterns: ["Desire", "Solution directe", "Lifestyle", "Identity"], use_cases: "Ads contextuelles, usage reel, integration quotidien" },
  { id: 4, name: "Probleme Zoome", category: "Image-Centered", description: "Gros plan extreme sur le probleme — peau seche, tache, desordre. Volontairement inconfortable.", principle: "Le malaise visuel cree l'urgence d'agir.", patterns: ["PAS", "Fear", "Urgency", "Education"], use_cases: "Skincare, nettoyage, sante, hygiene, tout probleme visible" },
  { id: 5, name: "Behind the Scenes", category: "Image-Centered", description: "Coulisses — fabrication artisanale, atelier, mains du fondateur, labo.", principle: "La transparence du process cree la confiance.", patterns: ["Authority", "Trust", "Brand Story", "Education"], use_cases: "Marques artisanales, made in France, premium, savoir-faire" },
  { id: 6, name: "Macro Detail", category: "Image-Centered", description: "Zoom ultra serre sur texture ou detail — grain, bulles, fibres, particules.", principle: "Rendre visible ce qui est invisible a l'oeil nu.", patterns: ["Desire", "Quality proof", "Sensory", "Education"], use_cases: "Produits premium, food, cosmetique, textile" },
  { id: 7, name: "Action Shot", category: "Image-Centered", description: "Produit en pleine utilisation, mouvement fige — splash, spray, application.", principle: "L'energie du mouvement cree du dynamisme et de l'envie.", patterns: ["Desire", "Product Demo", "Energy", "Lifestyle"], use_cases: "Boissons, sprays, cosmetiques, sport" },
  { id: 8, name: "Ingredient Showcase", category: "Image-Centered", description: "Ingredient star heroïse au premier plan, produit en position secondaire.", principle: "L'ingredient EST l'argument visuel.", patterns: ["Education", "Trust", "Desire", "Transparency"], use_cases: "Cosmetique naturel, alimentaire, complements" },
  { id: 9, name: "Scale Shot", category: "Image-Centered", description: "Produit a cote d'un objet quotidien pour montrer la taille reelle.", principle: "La comparaison physique donne une information immediate.", patterns: ["Education", "Objection-busting", "Simplification"], use_cases: "E-commerce, produits physiques, gadgets" },
  { id: 10, name: "Destruction Shot", category: "Image-Centered", description: "Produit casse, coupe en deux, ouvert pour reveler l'interieur.", principle: "La transparence radicale cree la confiance.", patterns: ["Trust", "Education", "Transparency", "Quality proof"], use_cases: "Alimentaire, cosmetique, tech, packaging" },
  { id: 11, name: "Texture Fill", category: "Image-Centered", description: "Texture liee au produit remplit tout le cadre — mousse, liquide, poudre, tissu.", principle: "Visuel immersif et sensoriel, fait ressentir le produit.", patterns: ["Desire", "Sensory", "Brand statement", "Premium"], use_cases: "Cosmetique, food, boisson, textile" },
  { id: 12, name: "Environmental Portrait", category: "Image-Centered", description: "Visage en gros plan, expression faciale porte l'emotion. Produit visible mais secondaire.", principle: "L'identification humaine domine, l'emotion cree le lien.", patterns: ["Identification", "Empathy", "Social Proof", "Transformation"], use_cases: "Skincare, bien-etre, sante mentale" },
  { id: 13, name: "Aerial / Bird's Eye", category: "Image-Centered", description: "Vue plongeante du dessus sur une scene avec produit integre.", principle: "La perspective inhabituelle accroche l'oeil dans le feed.", patterns: ["Context", "Lifestyle", "Routine", "Education"], use_cases: "Food, flat lay ameliore, routines" },
  { id: 14, name: "Silhouette", category: "Image-Centered", description: "Produit ou personne en silhouette noire sur fond colore vif.", principle: "Graphique, bold, minimalisme maximal.", patterns: ["Intrigue", "Brand statement", "Teasing", "Identity"], use_cases: "Marques bold, lancement, teasing" },
  { id: 15, name: "Shadow Play", category: "Image-Centered", description: "Produit projette une ombre qui raconte une autre histoire — resultat ou transformation.", principle: "Double lecture dans un seul visuel.", patterns: ["Transformation", "Storytelling", "Desire", "Intrigue"], use_cases: "Avant/apres subtil, aspirationnel" },
  { id: 16, name: "Reflection Shot", category: "Image-Centered", description: "Produit reflete dans miroir, surface d'eau ou vitre.", principle: "Le reflet ajoute profondeur, elegance ou double lecture.", patterns: ["Desire", "Premium", "Storytelling", "Identity"], use_cases: "Beaute, parfum, luxe, lifestyle" },
  { id: 17, name: "Negative Space", category: "Image-Centered", description: "Produit volontairement petit dans un immense espace vide.", principle: "Le vide cree la tension et attire l'oeil vers le seul element.", patterns: ["Intrigue", "Minimalism", "Premium", "Brand statement"], use_cases: "Marques premium, tech, design" },
  { id: 18, name: "Golden Hour", category: "Image-Centered", description: "Scene baignee dans la lumiere doree lever/coucher de soleil.", principle: "La lumiere chaude sublime le produit et cree l'aspiration.", patterns: ["Desire", "Lifestyle", "Emotion", "Warmth"], use_cases: "Outdoor, boissons, bien-etre, lifestyle" },
  { id: 19, name: "Night Mode", category: "Image-Centered", description: "Scene nocturne — neons, lumiere artificielle contrastee, reflets urbains.", principle: "L'ambiance brute et energique cree une identite visuelle forte.", patterns: ["Identity", "Belonging", "Energy", "Provocation"], use_cases: "Boissons, mode urbaine, nightlife, energy drinks" },
  { id: 20, name: "Weather Scene", category: "Image-Centered", description: "Produit en contexte meteo fort — pluie, neige, chaleur, vent.", principle: "Le contexte meteo montre la resistance ou ancre l'usage saisonnier.", patterns: ["Product Demo", "Durability", "Seasonal", "Context"], use_cases: "Outdoor, vetements techniques, saisonnier" },

  // ─── CATEGORY 2: TEXT-CENTERED (21-30) ──────────────────
  { id: 21, name: "Text-Heavy", category: "Text-Centered", description: "Le texte EST le visuel. Peu ou pas d'image. Message fort sur fond couleur.", principle: "La force des mots seuls cree l'impact.", patterns: ["Brand Statement", "Provocation", "Disruption", "Education"], use_cases: "Marques a forte identite, awareness" },
  { id: 22, name: "Quote Card", category: "Text-Centered", description: "Message de marque ou phrase forte — guillemets, signature, fond sobre.", principle: "Format partageable et memorable.", patterns: ["Brand Voice", "Inspiration", "Social Proof", "Values"], use_cases: "Positionnement de marque, valeurs" },
  { id: 23, name: "Single Word", category: "Text-Centered", description: "Un seul mot geant occupe tout le visuel. Sous-texte explicatif en petit.", principle: "Impact par la simplicite radicale.", patterns: ["Intrigue", "Provocation", "Teasing", "Brand statement"], use_cases: "Teasing, lancement, awareness" },
  { id: 24, name: "Question Hook", category: "Text-Centered", description: "Question provocante en typographie enorme. Reponse en plus petit.", principle: "La question cree le scroll-stop par curiosite.", patterns: ["Curiosity", "Problem-Aware", "Education", "Disruption"], use_cases: "Education, prise de conscience, disruption" },
  { id: 25, name: "Headline Clash", category: "Text-Centered", description: "Deux phrases empilees — premiere barree (mythe), seconde corrige (verite).", principle: "Le contraste barre/pas barre cree un effet de correction.", patterns: ["Myth-busting", "Education", "Repositioning", "Us vs Them"], use_cases: "Disruption de croyances, repositionnement" },
  { id: 26, name: "Dictionary Entry", category: "Text-Centered", description: "Format fausse definition de dictionnaire — mot en gras, phonetique, definition.", principle: "Le format encyclopedique donne une impression d'objectivite.", patterns: ["Education", "Humour", "Repositioning", "Brand Voice"], use_cases: "Repositionnement, clarification" },
  { id: 27, name: "Manifesto", category: "Text-Centered", description: "Long texte en bloc, declaration de marque, lettre ouverte.", principle: "Le volume de texte EST le signal de conviction.", patterns: ["Brand Story", "Values", "Identity", "Emotional"], use_cases: "Marques engagees, prise de position" },
  { id: 28, name: "Bold Statement", category: "Text-Centered", description: "Phrase choc en typographie massive. Zero image, zero decoration.", principle: "Brutalite et simplicite = impact maximum.", patterns: ["Provocation", "Disruption", "Brand statement", "Urgency"], use_cases: "Awareness, scroll-stop" },
  { id: 29, name: "Two Truths", category: "Text-Centered", description: "Deux affirmations — vraie et fausse — differenciees par couleur/style.", principle: "Le contraste force la reflexion.", patterns: ["Education", "Myth-busting", "Curiosity", "Repositioning"], use_cases: "Casser des croyances, repositionner" },
  { id: 30, name: "Fill the Blank", category: "Text-Centered", description: "Format a trou — '_______ c'est pour les gens qui _______'.", principle: "L'engagement cognitif est force, le cerveau cherche a completer.", patterns: ["Curiosity", "Engagement", "Identification", "Humour"], use_cases: "Engagement, quiz, identification" },

  // ─── CATEGORY 3: COMPARATIVE (31-40) ────────────────────
  { id: 31, name: "Split-Screen", category: "Comparative", description: "Ecran coupe en deux zones distinctes (gauche/droite ou haut/bas).", principle: "Le contraste visuel fait l'argument sans mots.", patterns: ["Us vs Them", "Before/After", "Comparison", "Problem-Solution"], use_cases: "Comparaisons, repositionnement" },
  { id: 32, name: "Before/After", category: "Comparative", description: "Etat 'avant' et etat 'apres'. La transformation est le heros.", principle: "Montrer le changement concret dans le temps.", patterns: ["Transformation", "Social Proof", "PAS", "Desire"], use_cases: "Skincare, fitness, nettoyage, renovation" },
  { id: 33, name: "Comparaison Tableau", category: "Comparative", description: "Format 'nous vs eux' avec colonnes, checkmarks verts et croix rouges.", principle: "La logique visuelle du tableau rend l'argument imparable.", patterns: ["Us vs Them", "Proof Stacking", "Education", "Logic"], use_cases: "SaaS, complements, personas analytiques" },
  { id: 34, name: "Us vs Them Visuel", category: "Comparative", description: "Deux univers visuels opposes dans un meme cadre sans separation nette.", principle: "Le contraste ambiance fait l'argument.", patterns: ["Us vs Them", "Desire", "Lifestyle", "Transformation"], use_cases: "Lifestyle, transformation, aspiration" },
  { id: 35, name: "Prix Ancre", category: "Comparative", description: "Comparaison de prix avec objet quotidien — 'Le prix d'un cafe par jour'.", principle: "Le recadrage financier casse l'objection prix.", patterns: ["Objection-busting", "Value", "Logic", "Simplification"], use_cases: "Abonnements, produits premium percus chers" },
  { id: 36, name: "Scale Comparison", category: "Comparative", description: "Produit et concurrent photographies cote a cote physiquement.", principle: "La proximite rend les differences immediatement evidentes.", patterns: ["Us vs Them", "Quality proof", "Education", "Product Demo"], use_cases: "E-commerce, packaging, produit physique" },
  { id: 37, name: "Timeline Compare", category: "Comparative", description: "Meme moment, deux realites differentes selon usage du produit ou non.", principle: "Deux vies paralleles illustrent l'impact du produit.", patterns: ["Before/After", "FOMO", "Desire", "Lifestyle"], use_cases: "Productivite, sante, lifestyle" },
  { id: 38, name: "Stacked Comparison", category: "Comparative", description: "Empile verticalement — 'avant' en haut (barre, floute) et 'apres' en bas (net, vibrant).", principle: "Le scroll naturel va du probleme vers la solution.", patterns: ["Before/After", "Transformation", "Problem-Solution"], use_cases: "Format vertical feed/story" },
  { id: 39, name: "Expectation vs Reality", category: "Comparative", description: "Format meme detourne — attente idealisee vs realite encore meilleure.", principle: "Inverser la blague classique pour surprendre positivement.", patterns: ["Humor", "Social Proof", "Desire", "Virality"], use_cases: "Ads virales, produits qui surperforment" },
  { id: 40, name: "Zoom In / Zoom Out", category: "Comparative", description: "Deux niveaux de zoom — plan large + medaillon detail.", principle: "Relier le macro et le micro en un seul visuel.", patterns: ["Education", "Proof", "Quality", "Detail"], use_cases: "Detail invisible, qualite" },

  // ─── CATEGORY 4: SOCIAL PROOF (41-55) ───────────────────
  { id: 41, name: "Testimonial Card", category: "Social Proof", description: "Avis client premium — etoiles, citation, nom, photo.", principle: "La voix d'un vrai client est plus credible que la marque.", patterns: ["Social Proof", "Trust", "Identification", "Conversion"], use_cases: "Tous produits, conversion MOFU/BOFU" },
  { id: 42, name: "UGC-Style", category: "Social Proof", description: "Imite du contenu organique — screenshot conversation, story, post.", principle: "Casser le filtre mental 'c'est une pub'.", patterns: ["Social Proof", "Authenticity", "Native", "Identification"], use_cases: "Scroll-stop, audiences jeunes" },
  { id: 43, name: "Press / As Seen In", category: "Social Proof", description: "Logos de medias ou citations de presse integres.", principle: "Transfert de credibilite des medias vers le produit.", patterns: ["Authority", "Trust", "Premium", "Credibility"], use_cases: "Marques premium, lancement, credibilite" },
  { id: 44, name: "Polaroid / Photo Stack", category: "Social Proof", description: "Photos empilees comme polaroids, legerement inclinees, legendes manuscrites.", principle: "L'ambiance authentique 'vraie vie' cree un lien emotionnel.", patterns: ["Authenticity", "Storytelling", "Social Proof", "Nostalgia"], use_cases: "Marques lifestyle, voyages, moments" },
  { id: 45, name: "User vs Brand", category: "Social Proof", description: "Deux 'voix' — client pose une objection, marque repond.", principle: "Format conversationnel qui casse les objections frontalement.", patterns: ["Objection-busting", "Trust", "Education", "Transparency"], use_cases: "FAQ visuelles, retargeting" },
  { id: 46, name: "Statistique / Data Point", category: "Social Proof", description: "Un seul chiffre massif au centre — '93% recommandent'.", principle: "Un chiffre seul cree un impact immediat et factuel.", patterns: ["Social Proof", "Authority", "Trust", "Credibility"], use_cases: "Credibilite, preuve de masse" },
  { id: 47, name: "Tweet/Post Screenshot", category: "Social Proof", description: "Faux tweet ou post viral presente comme screenshot reel.", principle: "Le format ultra-natif est lu avant d'etre identifie comme pub.", patterns: ["Social Proof", "UGC", "Virality", "Humor"], use_cases: "Audiences social-native, viralite" },
  { id: 48, name: "DM Screenshot", category: "Social Proof", description: "Capture de message prive d'un client satisfait.", principle: "L'intimite du format DM rend le temoignage plus credible.", patterns: ["Social Proof", "Authenticity", "Intimacy", "Trust"], use_cases: "DTC, marques proches de leur communaute" },
  { id: 49, name: "Comment Section", category: "Social Proof", description: "Section commentaires sous un post — plusieurs clients reagissent.", principle: "L'accumulation de commentaires cree une preuve collective.", patterns: ["Social Proof", "Bandwagon", "UGC", "Trust"], use_cases: "Produits viraux, lancement" },
  { id: 50, name: "Star Rating Hero", category: "Social Proof", description: "Note moyenne (4.8/5) en typographie geante avec etoiles dorees.", principle: "Le rating visuel EST le message.", patterns: ["Social Proof", "Trust", "Credibility", "Conversion"], use_cases: "E-commerce, tous produits notes" },
  { id: 51, name: "Crowd Shot", category: "Social Proof", description: "Photo de foule ou groupe utilisant le produit.", principle: "Le volume de personnes EST l'argument.", patterns: ["Bandwagon", "Social Proof", "Belonging", "FOMO"], use_cases: "Evenements, produits mainstream" },
  { id: 52, name: "Counter / Compteur", category: "Social Proof", description: "Compteur numerique affichant un nombre impressionnant.", principle: "Le compteur cree dynamisme et masse.", patterns: ["Social Proof", "Urgency", "FOMO", "Trust"], use_cases: "E-commerce gros volume" },
  { id: 53, name: "Wall of Love", category: "Social Proof", description: "Mosaique de dizaines de micro-avis ou photos clients.", principle: "L'accumulation massive cree un impact de confiance par le volume.", patterns: ["Social Proof", "Trust", "Bandwagon", "Community"], use_cases: "Marques avec beaucoup d'avis, SaaS" },
  { id: 54, name: "Influencer Endorsement", category: "Social Proof", description: "Createur ou expert reconnaissable avec le produit et sa citation.", principle: "Le statut et la credibilite se transferent au produit.", patterns: ["Authority", "Social Proof", "Trust", "Aspiration"], use_cases: "Beaute, fitness, tech, lifestyle" },
  { id: 55, name: "Certification Badge", category: "Social Proof", description: "Badge, label ou certification comme heros visuel — Bio, B-Corp, Made in France.", principle: "Le badge officiel transfere sa credibilite.", patterns: ["Trust", "Authority", "Credibility", "Transparency"], use_cases: "Cosmetique, alimentaire, eco-responsable" },

  // ─── CATEGORY 5: EDUCATIONAL (56-70) ────────────────────
  { id: 56, name: "Infographie", category: "Educational", description: "Donnees, chiffres, comparaisons avec icones et textes courts.", principle: "Le format educatif fait oublier que c'est une pub.", patterns: ["Education", "Authority", "Trust", "Problem-Aware"], use_cases: "Sensibilisation, produits techniques" },
  { id: 57, name: "Listicle", category: "Educational", description: "Format 'Top 3 raisons de...' avec icones numerotees.", principle: "La structure numerotee est scannable et engageante.", patterns: ["Education", "Curiosity", "Proof Stacking", "Virality"], use_cases: "Sensibilisation, contenu viral educatif" },
  { id: 58, name: "Annotation / Callout", category: "Educational", description: "Produit au centre avec fleches et annotations sur ses caracteristiques.", principle: "Chaque fleche = un argument.", patterns: ["Education", "Product Demo", "Transparency", "Trust"], use_cases: "E-commerce, produits a features multiples" },
  { id: 59, name: "Collage / Multi-Image", category: "Educational", description: "Grille de plusieurs images, chaque case = un argument ou use case.", principle: "L'accumulation visuelle cree la conviction par le volume.", patterns: ["Proof Stacking", "Education", "Lifestyle", "Variety"], use_cases: "Multi-benefices, gammes de produits" },
  { id: 60, name: "Story-Sequence", category: "Educational", description: "Frames numerotees (1-2-3-4) racontant un process ou routine.", principle: "L'oeil suit naturellement la sequence numerotee.", patterns: ["How-to", "Process", "Education", "Transformation"], use_cases: "Routines, mode d'emploi, skincare" },
  { id: 61, name: "Calendar / Routine", category: "Educational", description: "Format planning — 'Jour 1... Jour 7... Jour 30...' avec resultats.", principle: "Visualiser la progression cree une projection mentale du resultat.", patterns: ["Transformation", "Expectation", "Trust", "Commitment"], use_cases: "Skincare, fitness, complements" },
  { id: 62, name: "Flowchart", category: "Educational", description: "Arbre de decision visuel — 'Si tu as X prends Y'.", principle: "Guider le prospect vers le bon produit de maniere interactive.", patterns: ["Education", "Personalization", "Engagement", "Simplification"], use_cases: "Gammes multiples, quiz simplifie" },
  { id: 63, name: "Myth vs Fact", category: "Educational", description: "Format 'Mythe: ... / Realite: ...' — mythe visuellement 'casse'.", principle: "Corriger une erreur cree une prise de conscience.", patterns: ["Myth-busting", "Education", "Repositioning", "Authority"], use_cases: "Sante, nutrition, cosmetique, finance" },
  { id: 64, name: "Anatomy / Eclate", category: "Educational", description: "Produit decompose visuellement en parties/couches, chaque composant identifie.", principle: "La vue eclatee technique appliquee au marketing.", patterns: ["Education", "Trust", "Transparency", "Quality proof"], use_cases: "Tech, cosmetique, alimentaire" },
  { id: 65, name: "Dose / Posologie", category: "Educational", description: "Mode d'emploi simplifie — '1 barre = 2 mois', '1 gelule = 8h d'energie'.", principle: "L'equation dosage/resultat est immediate.", patterns: ["Education", "Simplification", "Value", "Logic"], use_cases: "Complements, soins, abonnements" },
  { id: 66, name: "Pyramid / Hierarchy", category: "Educational", description: "Information en pyramide — benefice principal en haut (gros), details en dessous.", principle: "La hierarchie naturelle guide l'oeil du plus important au secondaire.", patterns: ["Education", "Value Hierarchy", "Simplification", "Authority"], use_cases: "Offres multi-niveaux, gammes" },
  { id: 67, name: "Process Circle", category: "Educational", description: "Etapes disposees en cercle/cycle au lieu d'une ligne droite.", principle: "Montrer que le process est recurrent et continu.", patterns: ["Routine", "Habit", "Education", "Commitment"], use_cases: "Abonnements, soins recurrents, recharges" },
  { id: 68, name: "Venn Diagram", category: "Educational", description: "Deux cercles qui se croisent, produit a l'intersection.", principle: "Visualiser l'USP comme la fusion de deux qualites.", patterns: ["Unique Value", "Differentiation", "Logic", "Simplification"], use_cases: "Positionnement, USP" },
  { id: 69, name: "Map Layout", category: "Educational", description: "Produit sur carte geographique pour montrer origine ou distribution.", principle: "L'ancrage geographique cree authenticite.", patterns: ["Origin Story", "Trust", "Authenticity", "Premium"], use_cases: "Terroir, made in, sourcing, local" },
  { id: 70, name: "Equation", category: "Educational", description: "Format visuel 'A + B = C' — ingredient + ingredient = resultat.", principle: "La logique mathematique rend l'argument visuellement indiscutable.", patterns: ["Simplification", "Logic", "Education", "Value"], use_cases: "Complements, recettes, bundles" },

  // ─── CATEGORY 6: PROMOTIONAL (71-80) ────────────────────
  { id: 71, name: "Coupon / Promo Card", category: "Promotional", description: "Gros pourcentage, code promo visible, cadre en pointilles.", principle: "La reduction EST le visuel principal.", patterns: ["Urgency", "Value", "Conversion", "FOMO"], use_cases: "BOFU, conversion directe, retargeting" },
  { id: 72, name: "Bundle Display", category: "Promotional", description: "Produits groupes avec prix barre et nouveau prix.", principle: "Le 'pack' cree l'impression de deal.", patterns: ["Value", "Bundle", "Upsell", "Desire"], use_cases: "Ventes croisees, packs, kits decouverte" },
  { id: 73, name: "Limited Edition", category: "Promotional", description: "Produit presente comme rare et exclusif — numerote, 'edition limitee'.", principle: "La rarete percue cree l'urgence et le desir.", patterns: ["Scarcity", "Exclusivity", "FOMO", "Desire"], use_cases: "Drops, collabs, editions speciales" },
  { id: 74, name: "Countdown", category: "Promotional", description: "Compte a rebours visuel — 'Plus que 24h', 'Fin ce soir'.", principle: "L'urgence temporelle visible pousse a l'action.", patterns: ["Urgency", "FOMO", "Scarcity", "Conversion"], use_cases: "Ventes flash, fin de promo, lancement" },
  { id: 75, name: "Free Shipping Banner", category: "Promotional", description: "Avantage logistique centre — 'Livraison offerte', 'Livre en 24h'.", principle: "Supprimer la friction logistique visuellement.", patterns: ["Objection-busting", "Value", "Convenience", "Trust"], use_cases: "E-commerce, suppression friction" },
  { id: 76, name: "Gift Card", category: "Promotional", description: "Format cadeau — ruban, packaging gift, 'Le cadeau parfait pour...'.", principle: "Repositionner comme cadeau, pas achat personnel.", patterns: ["Gifting", "Seasonal", "Emotion", "Desire"], use_cases: "Fetes, anniversaires, coffrets" },
  { id: 77, name: "Seasonal / Event", category: "Promotional", description: "Cale sur un evenement calendaire — Noel, Black Friday, fete des peres.", principle: "L'ancrage temporel cree pertinence et opportunite.", patterns: ["Seasonal", "Relevance", "Urgency", "FOMO"], use_cases: "Temps forts commerciaux" },
  { id: 78, name: "First Order", category: "Promotional", description: "Special premiere commande — 'Bienvenue', '-20% premiere commande'.", principle: "L'exclusivite 'nouveau client' cree un sentiment de privilege.", patterns: ["Welcome", "Trial", "Conversion", "Exclusivity"], use_cases: "Acquisition, premiere conversion" },
  { id: 79, name: "Loyalty / Refill", category: "Promotional", description: "Format reachat — 'Ton stock est bientot vide?'.", principle: "Rappeler le besoin de reapprovisionnement au bon moment.", patterns: ["Retention", "Habit", "Convenience", "Reminder"], use_cases: "Retargeting clients, abonnements" },
  { id: 80, name: "Flash Sale", category: "Promotional", description: "Vente flash visuellement agressive — rouge, prix barres, timer.", principle: "L'urgence maximale pour conversion immediate.", patterns: ["Urgency", "Scarcity", "FOMO", "Conversion"], use_cases: "Destockage, flash sales, Black Friday" },

  // ─── CATEGORY 7: FORMAT-MIMETIC (81-95) ─────────────────
  { id: 81, name: "Meme-Style", category: "Format-Mimetic", description: "Detournement de format meme — image + texte haut/bas, Drake format.", principle: "L'humour viral cree scroll-stop et partage.", patterns: ["Humor", "Virality", "Identification", "Engagement"], use_cases: "Audiences jeunes, marques decalees" },
  { id: 82, name: "Ecran de Telephone", category: "Format-Mimetic", description: "Contenu a l'interieur d'un cadre de smartphone.", principle: "Le cadre du telephone cree un effet de realite.", patterns: ["UGC", "Authenticity", "Native", "Social Proof"], use_cases: "Apps, resultats, notifications" },
  { id: 83, name: "Carte Postale / Invitation", category: "Format-Mimetic", description: "Format carte physique avec bordure, tampon postal, ecriture manuscrite.", principle: "Le ton personnel et intime cree un lien direct.", patterns: ["Personal", "Intimate", "Nostalgia", "Premium"], use_cases: "Marques artisanales, invitations, lancements" },
  { id: 84, name: "Editorial / Magazine", category: "Format-Mimetic", description: "Mise en page magazine premium — titre editorial, image full-bleed.", principle: "L'ambiance 'article' est percue comme plus credible qu'une pub.", patterns: ["Authority", "Premium", "Trust", "Brand Story"], use_cases: "Marques premium, credibilite, lifestyle" },
  { id: 85, name: "Notification Push", category: "Format-Mimetic", description: "Bulle de notification avec icone d'app et texte court.", principle: "Le format notification est impossible a ignorer.", patterns: ["Urgency", "Native", "FOMO", "Conversion"], use_cases: "Apps, e-commerce, rappels, retargeting" },
  { id: 86, name: "Email Screenshot", category: "Format-Mimetic", description: "Faux email recu — ligne d'objet, debut contenu, expediteur.", principle: "La curiosite du 'message non lu' pousse a lire.", patterns: ["Curiosity", "Native", "Trust", "Engagement"], use_cases: "B2B, SaaS, newsletters" },
  { id: 87, name: "Recette", category: "Format-Mimetic", description: "Fiche recette de cuisine appliquee au produit.", principle: "Le format familier et pratique engage et eduque.", patterns: ["How-to", "Education", "Lifestyle", "Engagement"], use_cases: "Alimentaire, cosmetique DIY, cuisine" },
  { id: 88, name: "Boarding Pass", category: "Format-Mimetic", description: "Billet d'avion detourne — destination = resultat, depart = probleme.", principle: "Le format familier detourne cree la surprise.", patterns: ["Creativity", "Storytelling", "Transformation", "Humor"], use_cases: "Marques voyage, transformation, premium" },
  { id: 89, name: "Receipt / Ticket de caisse", category: "Format-Mimetic", description: "Ticket de caisse listant les 'couts' — temps gagne, argent economise.", principle: "Quantifier la valeur dans un format comptable familier.", patterns: ["Value", "Logic", "Proof Stacking", "Humor"], use_cases: "SaaS, productivite, economies" },
  { id: 90, name: "Prescription", category: "Format-Mimetic", description: "Ordonnance medicale detournee — un 'medecin' prescrit le produit.", principle: "Le format medical cree autorite et necessite.", patterns: ["Humor", "Authority", "Trust", "Creativity"], use_cases: "Bien-etre, complements, sante naturelle" },
  { id: 91, name: "Breaking News", category: "Format-Mimetic", description: "Bandeau info TV avec ticker qui defile.", principle: "Le format 'breaking news' cree un scroll-stop automatique.", patterns: ["Urgency", "Novelty", "Disruption", "Attention"], use_cases: "Lancements, annonces, disruption" },
  { id: 92, name: "Wikipedia Entry", category: "Format-Mimetic", description: "Fausse page Wikipedia du produit ou du probleme.", principle: "La mise en page encyclopedique donne une impression de verite.", patterns: ["Education", "Authority", "Trust", "Humor"], use_cases: "Repositionnement, education, credibilite" },
  { id: 93, name: "Search Result", category: "Format-Mimetic", description: "Resultat Google — produit en 'position zero'.", principle: "Etre visuellement LA reponse ancre le produit comme la solution.", patterns: ["Authority", "Solution", "Trust", "Native"], use_cases: "Audiences SEO-aware, tech" },
  { id: 94, name: "Dating Profile", category: "Format-Mimetic", description: "Profil de rencontre (Tinder/Bumble) du produit — photo, bio, qualites.", principle: "Humaniser le produit avec humour et personnalite.", patterns: ["Humor", "Personification", "Engagement", "Virality"], use_cases: "Marques fun, audiences jeunes" },
  { id: 95, name: "Report Card / Bulletin", category: "Format-Mimetic", description: "Bulletin scolaire — le produit obtient des notes par categorie.", principle: "L'evaluation gamifiee est immediatement scannable.", patterns: ["Education", "Gamification", "Comparison", "Humor"], use_cases: "Comparatifs, revues, tech" },

  // ─── CATEGORY 8: EMOTIONAL/NARRATIVE (96-100) ───────────
  { id: 96, name: "Duet / Reaction", category: "Emotional/Narrative", description: "Format TikTok duet — moitie contenu, moitie reaction.", principle: "La reaction cree l'engagement par la curiosite.", patterns: ["UGC", "Social Proof", "Humor", "Engagement"], use_cases: "Reactions virales, audiences social-native" },
  { id: 97, name: "Letter / Handwritten", category: "Emotional/Narrative", description: "Lettre manuscrite ou font manuscrite, papier texture, ton personnel.", principle: "La marque ecrit comme un ami, pas une entreprise.", patterns: ["Personal", "Emotional", "Trust", "Brand Story"], use_cases: "Marques artisanales, storytelling fondateur" },
  { id: 98, name: "Confession", category: "Emotional/Narrative", description: "Format 'J'avoue...' ou 'La verite c'est que...' — fond brut, ton vulnerable.", principle: "La vulnerabilite cree la confiance.", patterns: ["Vulnerability", "Trust", "Authenticity", "Brand Story"], use_cases: "Marques transparentes, repositionnement" },
  { id: 99, name: "Countdown Story", category: "Emotional/Narrative", description: "Narratif temporel — 'Il y a 6 mois j'utilisais encore X. Aujourd'hui...'.", principle: "Le texte raconte la trajectoire, l'image montre le resultat.", patterns: ["Transformation", "Storytelling", "Social Proof", "Identification"], use_cases: "Temoignages, skincare, fitness" },
  { id: 100, name: "Empty Space", category: "Emotional/Narrative", description: "Espace VIDE la ou le produit devrait etre — etagere vide, bureau vide.", principle: "L'absence cree le desir, le vide raconte le manque.", patterns: ["Desire", "FOMO", "Retargeting", "Emotion"], use_cases: "Retargeting, reachat, awareness" },
];

// ============================================================
// LOOKUP FUNCTIONS
// ============================================================

/**
 * Find layouts compatible with a persuasive pattern name.
 */
export function getLayoutsForPattern(patternName: string): LayoutEntry[] {
  const normalized = patternName.toLowerCase();
  return LAYOUTS.filter(l =>
    l.patterns.some(p => p.toLowerCase().includes(normalized))
  );
}

/**
 * Get layouts by category name.
 */
export function getLayoutsForCategory(category: string): LayoutEntry[] {
  return LAYOUTS.filter(l => l.category === category);
}

/**
 * Get a compact directive for specific layout ids.
 */
export function getLayoutDirective(layoutIds: number[]): string {
  const selected = layoutIds
    .map(id => LAYOUTS.find(l => l.id === id))
    .filter(Boolean) as LayoutEntry[];

  if (selected.length === 0) return "";

  return selected
    .map(l => `- ${l.name} (#${l.id}): ${l.description} Principe: ${l.principle}`)
    .join("\n");
}

/**
 * Get layouts filtered by format families (from pre-assigned skeletons).
 * P5 optimization: only returns layouts compatible with the formats in the batch.
 */
export function getLayoutsForFormats(formatFamilies: string[]): string {
  // Map format families to likely layout categories/patterns
  const relevantPatterns = new Set<string>();
  for (const format of formatFamilies) {
    switch (format) {
      case "problem_solution": relevantPatterns.add("PAS"); relevantPatterns.add("Problem-Solution"); break;
      case "proof_demo": relevantPatterns.add("Product Demo"); relevantPatterns.add("Proof"); relevantPatterns.add("Quality proof"); break;
      case "offer_led": relevantPatterns.add("Urgency"); relevantPatterns.add("Value"); relevantPatterns.add("Conversion"); break;
      case "testimonial": relevantPatterns.add("Social Proof"); relevantPatterns.add("Trust"); break;
      case "comparison": relevantPatterns.add("Comparison"); relevantPatterns.add("Us vs Them"); break;
      case "editorial": relevantPatterns.add("Premium"); relevantPatterns.add("Authority"); relevantPatterns.add("Brand Story"); break;
      case "ugc_hybrid": relevantPatterns.add("UGC"); relevantPatterns.add("Authenticity"); break;
      case "visual_metaphor": relevantPatterns.add("Storytelling"); relevantPatterns.add("Intrigue"); relevantPatterns.add("Desire"); break;
      case "objection_crusher": relevantPatterns.add("Objection-busting"); relevantPatterns.add("Trust"); break;
      case "ingredient_spotlight": relevantPatterns.add("Education"); relevantPatterns.add("Transparency"); break;
      case "benefit_closeup": relevantPatterns.add("Desire"); relevantPatterns.add("Product Demo"); break;
      case "before_after": relevantPatterns.add("Transformation"); relevantPatterns.add("Before/After"); break;
    }
  }

  const matchingLayouts = LAYOUTS.filter(l =>
    l.patterns.some(p => relevantPatterns.has(p))
  );

  // Deduplicate and limit to 20 most relevant
  const seen = new Set<number>();
  const filtered = matchingLayouts.filter(l => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  }).slice(0, 20);

  if (filtered.length === 0) return getLayoutCategorySummary();

  return `LAYOUTS COMPATIBLES (${filtered.length} sur 100, filtres par formats):
${filtered.map(l => `- ${l.name} (#${l.id}): ${l.description.split(".")[0]}`).join("\n")}`;
}

/**
 * Get a summary directive of all layout categories with counts.
 */
export function getLayoutCategorySummary(): string {
  return `100 LAYOUTS DISPONIBLES:
- Image-Centered (1-20): Hero Image, Product Focus, Macro Detail, Golden Hour...
- Text-Centered (21-30): Text-Heavy, Quote Card, Bold Statement, Question Hook...
- Comparative (31-40): Split-Screen, Before/After, Tableau, Prix Ancre...
- Social Proof (41-55): Testimonial, UGC, Press, Star Rating, Wall of Love...
- Educational (56-70): Infographie, Listicle, Annotation, Myth vs Fact, Flowchart...
- Promotional (71-80): Coupon, Bundle, Countdown, Flash Sale, Gift Card...
- Format-Mimetic (81-95): Meme, Phone Screen, Recipe, Boarding Pass, Dating Profile...
- Emotional/Narrative (96-100): Duet, Letter, Confession, Countdown Story, Empty Space`;
}
