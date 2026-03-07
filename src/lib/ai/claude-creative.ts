import Anthropic from "@anthropic-ai/sdk";

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante dans .env.local");
  return new Anthropic({ apiKey: key });
};

export interface BrandContext {
  name: string;
  description?: string;
  mission?: string;
  vision?: string;
  positioning?: string;
  tone?: string;
  values?: string[];
  targetMarket?: string;
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography?: {
    headingFont: string;
    bodyFont: string;
  };
}

export interface ProductContext {
  name: string;
  category?: string;
  usp?: string;
  benefits?: string[];
  positioning?: string;
  marketingArguments?: {
    headlines: string[];
    hooks: string[];
    callToActions: string[];
    emotionalTriggers: string[];
    socialProof: string[];
    guarantees: string[];
  };
  targetAudience?: string;
  competitiveAdvantage?: string;
}

export interface PersonaContext {
  name: string;
  description?: string;
  demographics?: {
    ageRange: string;
    gender?: string;
    location?: string;
    income?: string;
    lifestyle?: string;
  };
  psychographics?: {
    painPoints: string[];
    motivations: string[];
    aesthetic: string;
  };
  visualStyle?: {
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
  };
}

export interface AdTextOverlay {
  headline: string;
  subtitle?: string;
  cta?: string;
  headlinePosition: "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right";
  ctaPosition?: "bottom-left" | "bottom-center" | "bottom-right";
  textColor: string; // hex
  ctaColor?: string; // hex for CTA background
  ctaTextColor?: string; // hex for CTA text
}

export interface CreativePromptResult {
  prompts: Array<{
    concept: string;
    visualPrompt: string;
    consciousnessLevel: string;
    creativeAngle: string;
    emotionalHook: string;
  }>;
}

export async function generateCreativePrompts(params: {
  brand: BrandContext;
  product?: ProductContext;
  persona?: PersonaContext;
  brief?: string;
  format: string;
  aspectRatio: string;
  count: number;
  guidelinesPrompt?: string;
  documentsPrompt?: string;
  inspirationPrompt?: string;
  hasProductImages?: boolean;
}): Promise<CreativePromptResult> {
  const client = getClient();

  const brandSection = buildBrandSection(params.brand);
  const productSection = params.product ? buildProductSectionFull(params.product) : "";
  const personaSection = params.persona ? buildPersonaSection(params.persona) : "";

  const systemPrompt = `Tu es un directeur creatif publicitaire expert. Tu generes des prompts pour un generateur d'images IA (Gemini via Nano Banana PRO) qui cree des publicites statiques completes.

Tu dois generer ${params.count} CONCEPTS PUBLICITAIRES.

=== COMMENT CA MARCHE ===
Le "visualPrompt" est envoye DIRECTEMENT a Nano Banana PRO (Gemini). Ce modele sait generer des images publicitaires completes avec texte, produit et mise en scene. Il faut lui donner un prompt SIMPLE, CLAIR et DIRECT — comme un brief visuel.

=== FORMAT DU PROMPT (visualPrompt) ===
Ecris le prompt EN ANGLAIS, en 3-5 phrases courtes et descriptives. Le prompt doit decrire :

1. LE TYPE D'IMAGE : "A professional advertising image for..." / "A clean product ad showing..." / "A lifestyle advertising photo..."
2. LA SCENE : produit, decor, eclairage, ambiance, couleurs
3. LE TEXTE A AFFICHER : headline en francais, sous-titre, CTA — precise OU les placer (en haut, en bas, a gauche...)
4. LE STYLE : "clean modern design", "premium feel", "minimalist layout", "warm lifestyle photography"

${params.hasProductImages ? "IMPORTANT: Une photo de reference du vrai produit sera fournie. Dis 'featuring the product shown in the reference image' et decris ou le placer." : ""}

=== EXEMPLES DE BONS PROMPTS ===
- "A clean, modern advertising image for reusable coffee capsules. The product is centered on a wooden kitchen counter with warm morning light. Bold white text at the top reads 'Fini le gaspillage'. A green CTA button at the bottom says 'Decouvrir'. Minimalist layout with plenty of negative space."
- "A premium lifestyle ad photo. A woman enjoying coffee in a bright Scandinavian kitchen, the product visible on the counter. Text overlay at the bottom: 'Votre cafe, votre choix' in elegant white serif font. Soft natural lighting, warm tones."
- "A split-image advertising design. Left side: dark cluttered kitchen with disposable capsules waste. Right side: bright clean kitchen with the reusable capsule system. Bottom text in bold: 'Avant / Apres Caps'me'. Clean professional layout."

=== REGLES ===
1. Prompt en ANGLAIS, simple et direct (3-5 phrases)
2. Le texte affiche dans l'image doit etre en FRANCAIS
3. Chaque prompt inclut le texte publicitaire a afficher (headline + CTA)
4. Varier les styles : studio, lifestyle, flat lay, split-image, close-up, ambiance
5. Utiliser les VRAIS noms de produit, benefices et chiffres
6. Garder les prompts COURTS — pas de sur-description, pas de jargon technique IA
7. Chaque concept a un angle creatif unique et un hook emotionnel different

=== NIVEAUX DE CONSCIENCE (varier) ===
- Unaware : question rhetorique, analogie
- Problem Aware : empathie, miroir du probleme
- Solution Aware : transformation, aspiration
- Product Aware : preuve, specs, credibilite
- Most Aware : urgence, offre, CTA direct

Reponds UNIQUEMENT en JSON valide :
{
  "prompts": [
    {
      "concept": "Description courte du concept en francais",
      "visualPrompt": "Le prompt complet en anglais pour Nano Banana",
      "consciousnessLevel": "unaware|problem_aware|solution_aware|product_aware|most_aware",
      "creativeAngle": "Angle creatif utilise",
      "emotionalHook": "Emotion principale visee"
    }
  ]
}`;

  const userPrompt = `=== CONTEXTE DE LA CAMPAGNE ===

${brandSection}
${productSection}
${personaSection}
${params.brief ? `\nBRIEF CLIENT:\n${params.brief}` : ""}
${params.guidelinesPrompt ? `\nGUIDELINES CREATIVE:\n${params.guidelinesPrompt}` : ""}
${params.documentsPrompt ? `\nDOCUMENTS MARQUE:\n${params.documentsPrompt}` : ""}
${params.inspirationPrompt ? `\nINSPIRATIONS ADS:\n${params.inspirationPrompt}` : ""}

FORMAT : ${params.format} (ratio ${params.aspectRatio})
${params.hasProductImages ? "IMAGES REFERENCE : Oui, des photos du vrai produit seront envoyees au generateur d'images." : "PAS D'IMAGES REFERENCE : le generateur devra recreer le produit d'apres la description."}

=== MISSION ===
Genere exactement ${params.count} publicites COMPLETES et UNIQUES.

Pour chaque publicite :
1. Trouve une ANALOGIE ou un HOOK brillant base sur les donnees produit reelles
2. Ecris le texte marketing EXACT qui apparaitra dans l'image (en francais)
3. Decris la scene en detail (lieu, eclairage, ambiance, accessoires)
4. Precise le placement de CHAQUE element (texte, produit, CTA, labels)
5. Chaque visualPrompt doit faire 8-12 phrases minimum

UTILISE les vraies donnees produit : noms, chiffres, benefices concrets, pas de generiques.
VARIE les angles creatifs et les niveaux de conscience.
Le resultat doit etre au niveau des meilleures pubs Instagram/Facebook du marche.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());
  return parsed as CreativePromptResult;
}

// Full product section with ALL marketing data for mega-prompts
function buildProductSectionFull(product: ProductContext): string {
  const parts = [`\nPRODUIT : ${product.name}`];
  if (product.category) parts.push(`Categorie : ${product.category}`);
  if (product.usp) parts.push(`USP (proposition unique) : ${product.usp}`);
  if (product.benefits?.length) parts.push(`Benefices concrets :\n${product.benefits.map(b => `  - ${b}`).join("\n")}`);
  if (product.positioning) parts.push(`Positionnement : ${product.positioning}`);
  if (product.targetAudience) parts.push(`Audience cible : ${product.targetAudience}`);
  if (product.competitiveAdvantage) parts.push(`Avantage concurrentiel : ${product.competitiveAdvantage}`);
  if (product.marketingArguments) {
    const ma = product.marketingArguments;
    parts.push(`\nARGUMENTS MARKETING DISPONIBLES (utilise-les dans les pubs) :`);
    if (ma.headlines?.length) parts.push(`  Headlines testees : ${ma.headlines.map(h => `"${h}"`).join(" | ")}`);
    if (ma.hooks?.length) parts.push(`  Hooks / accroches : ${ma.hooks.map(h => `"${h}"`).join(" | ")}`);
    if (ma.callToActions?.length) parts.push(`  CTA : ${ma.callToActions.map(c => `"${c}"`).join(" | ")}`);
    if (ma.emotionalTriggers?.length) parts.push(`  Triggers emotionnels : ${ma.emotionalTriggers.join(", ")}`);
    if (ma.socialProof?.length) parts.push(`  Preuves sociales : ${ma.socialProof.join(", ")}`);
    if (ma.guarantees?.length) parts.push(`  Garanties : ${ma.guarantees.join(", ")}`);
  }
  return parts.join("\n");
}

// ============================================================
// BRAND WEBSITE ANALYSIS
// ============================================================

export interface BrandSiteAnalysis {
  name: string;
  description: string;
  mission: string;
  vision: string;
  positioning: string;
  tone: string;
  values: string[];
  targetMarket: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  keyMessages: string[];
}

export async function analyzeBrandSite(params: {
  siteName?: string;
  description?: string;
  tagline?: string;
  colors: string[];
  fonts: string[];
  headings: string[];
  fullText?: string;
}): Promise<BrandSiteAnalysis> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Tu es un expert en branding et identite visuelle. Analyse les donnees extraites d'un site web de marque et structure les informations.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: `Analyse ces donnees extraites du site web d'une marque et deduis l'identite de marque :

NOM DU SITE : ${params.siteName || "Non trouve"}
DESCRIPTION META : ${params.description || "Non trouvee"}
TAGLINE : ${params.tagline || "Non trouvee"}

COULEURS TROUVEES DANS LE CSS :
${params.colors.length > 0 ? params.colors.join(", ") : "Aucune extraite"}

POLICES TROUVEES :
${params.fonts.length > 0 ? params.fonts.join(", ") : "Aucune extraite"}

TITRES / HEADINGS DE LA PAGE :
${params.headings.length > 0 ? params.headings.join("\n") : "Aucun"}

TEXTE DE LA PAGE (extrait) :
${params.fullText?.slice(0, 2000) || "Non disponible"}

Reponds en JSON avec cette structure exacte :
{
  "name": "Nom de la marque",
  "description": "Description de la marque en 2-3 phrases",
  "mission": "La mission de la marque — pourquoi elle existe, quel probleme elle resout",
  "vision": "La vision de la marque — ou elle veut aller, quel futur elle veut creer",
  "positioning": "Positionnement de la marque (premium, mass market, eco, tech, artisanal, etc.)",
  "tone": "Ton de communication (ex: professionnel, decale, chaleureux, premium, militant...)",
  "values": ["Valeur 1", "Valeur 2", "Valeur 3"],
  "targetMarket": "Le marche cible principal (ex: femmes 25-45 CSP+, startups tech, familles eco-responsables...)",
  "colorPalette": {
    "primary": "#hex de la couleur principale de la marque",
    "secondary": "#hex de la couleur secondaire",
    "accent": "#hex de la couleur d'accent"
  },
  "typography": {
    "headingFont": "Nom de la police titres (la plus utilisee ou la plus distinctive)",
    "bodyFont": "Nom de la police corps"
  },
  "keyMessages": ["Message cle 1", "Message cle 2", "Message cle 3"]
}

IMPORTANT :
- Pour les couleurs, choisis les 3 les plus representatives de la marque parmi celles extraites. Ignore les couleurs generiques (noir, blanc, gris).
- Si aucune couleur distinctive n'est trouvee, propose des couleurs basees sur le positionnement.
- Pour les polices, utilise celles trouvees. Si aucune n'est trouvee, suggere des polices coherentes avec le positionnement.`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as BrandSiteAnalysis;
}

// ============================================================
// FEATURE 1: Auto-analyse des ads d'inspiration (Claude Vision)
// ============================================================

export interface InspirationAnalysis {
  analysis: string;
  tags: string[];
}

export async function analyzeInspirationAd(
  imageBase64: string,
  mimeType: string
): Promise<InspirationAnalysis> {
  const client = getClient();

  const mediaType = mimeType.includes("png")
    ? "image/png"
    : mimeType.includes("webp")
      ? "image/webp"
      : mimeType.includes("gif")
        ? "image/gif"
        : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Analyse cette publicite statique en tant qu'expert en creative advertising.

Fournis une analyse DETAILLEE couvrant :
1. COMPOSITION : disposition des elements, equilibre, point focal, utilisation de l'espace
2. COULEURS : palette dominante, harmonie, contraste, impact psychologique
3. EMOTION : emotion principale transmise, feeling general, atmosphere
4. HOOK VISUEL : qu'est-ce qui capte l'attention en premier ? Pourquoi ca fonctionne ?
5. TEXTE/CTA : presence de texte, lisibilite, positionnement du message
6. FORCES : 2-3 points forts majeurs de cette publicite
7. FAIBLESSES : 1-2 points d'amelioration potentiels

Reponds UNIQUEMENT en JSON valide avec cette structure :
{
  "analysis": "Analyse detaillee en 4-6 phrases couvrant tous les points ci-dessus",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Les tags doivent decrire les caracteristiques visuelles cles (ex: "minimaliste", "high-contrast", "lifestyle", "product-hero", "emotional", "bold-typography", etc.)`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as InspirationAnalysis;
}

// ============================================================
// FEATURE 2: Extraction PDF auto des brand books
// ============================================================

export interface DocumentSummary {
  summary: string;
  keyInsights: string[];
}

export async function summarizeBrandDocument(
  extractedText: string,
  documentName: string,
  documentType: string
): Promise<DocumentSummary> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en strategie de marque et en publicite. Voici le contenu extrait du document "${documentName}" (type: ${documentType}).

CONTENU DU DOCUMENT :
${extractedText.slice(0, 15000)}

INSTRUCTIONS :
1. Resume ce document de marque en 3-4 phrases concises et percutantes
2. Extrais 5-7 points cles ACTIONNABLES pour guider la creation de publicites visuelles
   - Chaque point cle doit etre directement utilisable par un directeur creatif
   - Focus sur : ton, valeurs, positionnement, do/don't visuels, audience, differenciateurs

Reponds UNIQUEMENT en JSON valide :
{
  "summary": "Resume en 3-4 phrases",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as DocumentSummary;
}

// ============================================================
// FEATURE S1: Scraping page produit — structure les donnees extraites
// ============================================================

export interface ScrapedProductData {
  name: string;
  usp: string;
  benefits: string[];
  positioning: string;
  targetAudience: string;
  marketingArguments: {
    headlines: string[];
    hooks: string[];
    callToActions: string[];
    emotionalTriggers: string[];
    socialProof: string[];
    guarantees: string[];
  };
}

export async function structureScrapedProduct(
  rawData: {
    title?: string;
    description?: string;
    price?: string;
    bulletPoints?: string[];
    fullText?: string;
  }
): Promise<ScrapedProductData> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en marketing produit. Voici les donnees extraites d'une page produit web.

DONNEES BRUTES :
Titre: ${rawData.title || "Non trouve"}
Description: ${rawData.description || "Non trouvee"}
Prix: ${rawData.price || "Non trouve"}
Points cles: ${rawData.bulletPoints?.join("\n- ") || "Aucun"}
Contenu additionnel: ${(rawData.fullText || "").slice(0, 5000)}

A partir de ces informations, structure les donnees pour une fiche produit marketing complete.

Reponds UNIQUEMENT en JSON valide :
{
  "name": "Nom du produit",
  "usp": "Proposition de valeur unique en 1-2 phrases",
  "benefits": ["benefice 1", "benefice 2", "benefice 3"],
  "positioning": "Positionnement marche en 1 phrase",
  "targetAudience": "Audience cible en 1 phrase",
  "marketingArguments": {
    "headlines": ["headline 1", "headline 2", "headline 3"],
    "hooks": ["hook accrocheur 1", "hook 2"],
    "callToActions": ["CTA 1", "CTA 2"],
    "emotionalTriggers": ["trigger 1", "trigger 2"],
    "socialProof": [],
    "guarantees": []
  }
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as ScrapedProductData;
}

// ============================================================
// FEATURE S2: Enrichissement persona via IA
// ============================================================

export interface EnrichedPersonaData {
  painPoints: string[];
  motivations: string[];
  onlineBehaviors: string[];
  emotionalTriggers: string[];
  objections: string[];
  visualStyle: {
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType: string;
    decorStyle: string;
  };
  promptModifiers: string;
}

export async function enrichPersona(
  existingData: {
    name: string;
    description?: string;
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    lifestyle?: string;
    painPoints?: string[];
    motivations?: string[];
    aesthetic?: string;
  }
): Promise<EnrichedPersonaData> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en psychologie du consommateur et en creative advertising.

Voici les informations existantes sur un persona marketing :
- Nom : ${existingData.name}
- Description : ${existingData.description || "Non renseignee"}
- Age : ${existingData.ageRange || "Non renseigne"}
- Genre : ${existingData.gender || "Non renseigne"}
- Localisation : ${existingData.location || "Non renseignee"}
- Revenu : ${existingData.income || "Non renseigne"}
- Style de vie : ${existingData.lifestyle || "Non renseigne"}
- Points de douleur actuels : ${existingData.painPoints?.join(", ") || "Aucun"}
- Motivations actuelles : ${existingData.motivations?.join(", ") || "Aucune"}
- Esthetique : ${existingData.aesthetic || "Non renseignee"}

ENRICHIS ce persona de facon APPROFONDIE avec :
1. Points de douleur detailles (5-8) — frustrations quotidiennes liees au produit/service
2. Motivations d'achat profondes (5-8) — pourquoi cette personne achete
3. Comportements en ligne (3-5) — comment elle consomme du contenu
4. Triggers emotionnels (4-6) — ce qui la fait reagir dans une pub
5. Objections typiques (3-5) — pourquoi elle hesite
6. Style visuel recommande pour les ads ciblant ce persona
7. Modificateurs de prompt optimises pour la generation d'images

Reponds UNIQUEMENT en JSON valide :
{
  "painPoints": ["douleur 1", "douleur 2", "..."],
  "motivations": ["motivation 1", "motivation 2", "..."],
  "onlineBehaviors": ["comportement 1", "comportement 2", "..."],
  "emotionalTriggers": ["trigger 1", "trigger 2", "..."],
  "objections": ["objection 1", "objection 2", "..."],
  "visualStyle": {
    "colorTone": "description du ton de couleur ideal",
    "photographyStyle": "style photo ideal",
    "lightingPreference": "eclairage recommande",
    "compositionNotes": "notes sur la composition ideale",
    "modelType": "type de modele/mannequin",
    "decorStyle": "style de decor/environnement"
  },
  "promptModifiers": "Instructions detaillees a injecter dans chaque prompt de generation d'image pour ce persona (2-3 phrases en anglais)"
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as EnrichedPersonaData;
}

// ============================================================
// FEATURE 13: Creative scoring auto (10 criteres)
// ============================================================

export interface CreativeScore {
  composition: number;
  colorHarmony: number;
  emotionalImpact: number;
  brandAlignment: number;
  audienceAppeal: number;
  scrollStopping: number;
  copyIntegration: number;
  uniqueness: number;
  technicalQuality: number;
  overall: number;
}

export async function scoreGeneratedImage(
  imageBase64: string,
  mimeType: string,
  context: { prompt: string; brandName?: string; personaName?: string }
): Promise<CreativeScore> {
  const client = getClient();

  const mediaType = mimeType.includes("png")
    ? "image/png"
    : mimeType.includes("webp")
      ? "image/webp"
      : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Tu es un expert en creative advertising. Note cette image publicitaire sur 10 criteres (1-10).

CONTEXTE :
- Prompt utilise : "${context.prompt}"
${context.brandName ? `- Marque : ${context.brandName}` : ""}
${context.personaName ? `- Persona cible : ${context.personaName}` : ""}

CRITERES (1 = terrible, 10 = parfait) :
1. composition : Disposition des elements, equilibre, point focal
2. colorHarmony : Harmonie et coherence des couleurs
3. emotionalImpact : Force emotionnelle, capacite a susciter une reaction
4. brandAlignment : Coherence avec l'identite de marque
5. audienceAppeal : Pertinence pour l'audience cible
6. scrollStopping : Capacite a arreter le scroll sur les reseaux sociaux
7. copyIntegration : Espace et integration potentielle du texte/CTA
8. uniqueness : Originalite et differenciation
9. technicalQuality : Qualite technique de l'image (resolution, artifacts)
10. overall : Note globale (pas forcement la moyenne)

Reponds UNIQUEMENT en JSON valide :
{
  "composition": N, "colorHarmony": N, "emotionalImpact": N,
  "brandAlignment": N, "audienceAppeal": N, "scrollStopping": N,
  "copyIntegration": N, "uniqueness": N, "technicalQuality": N,
  "overall": N
}`,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as CreativeScore;
}

// ============================================================
// FEATURE 14: Auto-iteration — ameliorer un prompt qui a mal score
// ============================================================

export async function improvePrompt(
  originalPrompt: string,
  scores: CreativeScore,
  brandContext?: string
): Promise<string> {
  const client = getClient();

  const weakCriteria = Object.entries(scores)
    .filter(([key, val]) => key !== "overall" && (val as number) < 5)
    .map(([key, val]) => `${key}: ${val}/10`)
    .join(", ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en prompt engineering pour la generation d'images publicitaires.

Le prompt ci-dessous a produit une image avec des scores faibles sur certains criteres.

PROMPT ORIGINAL :
${originalPrompt}

SCORES FAIBLES : ${weakCriteria || "overall: " + scores.overall + "/10"}

SCORE GLOBAL : ${scores.overall}/10

${brandContext ? `CONTEXTE MARQUE : ${brandContext}` : ""}

MISSION : Reecris le prompt en anglais pour corriger les faiblesses identifiees. Le nouveau prompt doit :
1. Garder l'intention et le concept du prompt original
2. Ajouter des instructions specifiques pour ameliorer les criteres faibles
3. Etre plus detaille et precis sur les aspects qui ont mal score
4. Faire au minimum 4-5 phrases detaillees

Reponds UNIQUEMENT avec le nouveau prompt en anglais, sans explication.`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  return textContent.text.trim();
}

// ============================================================
// FEATURE 5: Mode brief auto — extraire les contraintes
// ============================================================

export interface BriefConstraints {
  productFocus: string;
  targetAudience: string;
  tone: string;
  constraints: string[];
  suggestedFormats: string[];
  doNots: string[];
  keyMessage: string;
}

export async function extractBriefConstraints(
  rawBrief: string
): Promise<BriefConstraints> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Tu es un expert en publicite. Analyse ce brief brut et extrait les contraintes structurees.

BRIEF :
${rawBrief}

Reponds UNIQUEMENT en JSON valide :
{
  "productFocus": "Le produit ou service central",
  "targetAudience": "L'audience cible",
  "tone": "Le ton souhaite (ex: premium, fun, urgence...)",
  "constraints": ["contrainte 1", "contrainte 2"],
  "suggestedFormats": ["feed_square", "story"],
  "doNots": ["a ne pas faire 1", "a ne pas faire 2"],
  "keyMessage": "Le message cle a transmettre"
}

Pour suggestedFormats, utilise uniquement ces valeurs : feed_square, feed_portrait, feed_landscape, story, banner_728x90, banner_300x250`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as BriefConstraints;
}

function buildBrandSection(brand: BrandContext): string {
  const parts = [`MARQUE : ${brand.name}`];
  if (brand.description) parts.push(`Description : ${brand.description}`);
  if (brand.mission) parts.push(`Mission : ${brand.mission}`);
  if (brand.vision) parts.push(`Vision : ${brand.vision}`);
  if (brand.positioning) parts.push(`Positionnement : ${brand.positioning}`);
  if (brand.tone) parts.push(`Ton de communication : ${brand.tone}`);
  if (brand.values?.length) parts.push(`Valeurs : ${brand.values.join(", ")}`);
  if (brand.targetMarket) parts.push(`Marche cible : ${brand.targetMarket}`);
  if (brand.colorPalette) {
    parts.push(
      `Palette : primaire ${brand.colorPalette.primary}, secondaire ${brand.colorPalette.secondary}, accent ${brand.colorPalette.accent}`
    );
  }
  if (brand.typography) {
    parts.push(`Typographie : titres ${brand.typography.headingFont}, corps ${brand.typography.bodyFont}`);
  }
  return parts.join("\n");
}

function buildProductSection(product: ProductContext): string {
  const parts = [`\nPRODUIT : ${product.name}`];
  if (product.category) parts.push(`Categorie : ${product.category}`);
  if (product.usp) parts.push(`USP : ${product.usp}`);
  if (product.benefits?.length) parts.push(`Benefices : ${product.benefits.join(", ")}`);
  if (product.positioning) parts.push(`Positionnement : ${product.positioning}`);
  if (product.targetAudience) parts.push(`Audience cible : ${product.targetAudience}`);
  if (product.competitiveAdvantage) parts.push(`Avantage concurrentiel : ${product.competitiveAdvantage}`);
  if (product.marketingArguments) {
    const ma = product.marketingArguments;
    if (ma.headlines?.length) parts.push(`Headlines : ${ma.headlines.join(" | ")}`);
    if (ma.hooks?.length) parts.push(`Hooks : ${ma.hooks.join(" | ")}`);
    if (ma.emotionalTriggers?.length) parts.push(`Triggers emotionnels : ${ma.emotionalTriggers.join(", ")}`);
    if (ma.socialProof?.length) parts.push(`Preuves sociales : ${ma.socialProof.join(", ")}`);
  }
  return parts.join("\n");
}

function buildPersonaSection(persona: PersonaContext): string {
  const parts = [`\nPERSONA : ${persona.name}`];
  if (persona.description) parts.push(`Description : ${persona.description}`);
  if (persona.demographics) {
    const d = persona.demographics;
    const demo = [d.ageRange, d.gender, d.location, d.income, d.lifestyle].filter(Boolean);
    if (demo.length) parts.push(`Demographie : ${demo.join(", ")}`);
  }
  if (persona.psychographics) {
    const p = persona.psychographics;
    if (p.painPoints?.length) parts.push(`Points de douleur : ${p.painPoints.join(", ")}`);
    if (p.motivations?.length) parts.push(`Motivations : ${p.motivations.join(", ")}`);
    if (p.aesthetic) parts.push(`Esthetique : ${p.aesthetic}`);
  }
  if (persona.visualStyle) {
    const vs = persona.visualStyle;
    parts.push(`Style visuel : photo ${vs.photographyStyle}, eclairage ${vs.lightingPreference}, tons ${vs.colorTone}`);
  }
  return parts.join("\n");
}

// ============================================================
// AD PIPELINE: Claude as Art Director
// ============================================================

import type { AdConcept, AdLayoutType } from "./ad-types";

export interface GenerateAdConceptParams {
  brand: BrandContext;
  product?: ProductContext;
  persona?: PersonaContext;
  brief?: string;
  format: string;
  aspectRatio: string;
  count: number;
  hasProductImage: boolean;
  guidelinesPrompt?: string;
  documentsPrompt?: string;
  inspirationPrompt?: string;
}

export interface AdConceptResult {
  ads: AdConcept[];
}

export async function generateAdConcepts(params: GenerateAdConceptParams): Promise<AdConceptResult> {
  const client = getClient();

  const brandSection = buildBrandSection(params.brand);
  const productSection = params.product ? buildProductSection(params.product) : "";
  const personaSection = params.persona ? buildPersonaSection(params.persona) : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Tu es un DIRECTEUR ARTISTIQUE expert en publicite digitale. Tu dois concevoir ${params.count} concepts de VRAIES PUBLICITES (pas juste des visuels).

IMPORTANT : Tu ne generes PAS des images. Tu concois des PUBLICITES COMPLETES avec :
- Un LAYOUT precis (composition de l'ad)
- Du TEXTE MARKETING (headlines, arguments, CTA)
- Des instructions pour le FOND/SCENE uniquement (le produit reel sera compose par-dessus)
- Un STYLE VISUEL coherent avec la marque

${brandSection}
${productSection}
${personaSection}

${params.brief ? `BRIEF CLIENT :\n${params.brief}` : ""}

${params.guidelinesPrompt ? `\nGUIDELINES CREATIVE :\n${params.guidelinesPrompt}` : ""}
${params.documentsPrompt ? `\nDOCUMENTS MARQUE :\n${params.documentsPrompt}` : ""}
${params.inspirationPrompt ? `\nINSPIRATIONS ADS :\n${params.inspirationPrompt}` : ""}

FORMAT : ${params.format} (${params.aspectRatio})
${params.hasProductImage ? "NOTE : On dispose d'une VRAIE photo du produit qui sera composee sur le visuel. Le backgroundPrompt ne doit PAS decrire le produit." : "NOTE : Pas de photo produit disponible. Le backgroundPrompt doit inclure une representation du produit."}

LAYOUTS DISPONIBLES :
- hero_product : Produit au centre/cote, headline impactante + CTA
- us_vs_them : Comparaison splitee (notre produit vs alternative)
- before_after : Avant/Apres transformation
- benefit_callout : Produit avec badges/cercles de benefices chiffres
- product_showcase : Display produit clean avec stats cles
- social_proof : Focus testimonial/garantie/preuve sociale
- lifestyle_overlay : Scene lifestyle avec overlay texte marketing
- minimal_impact : Texte bold impactant + produit minimal

Pour chaque ad, reponds en JSON. VARIE les layouts et les angles.

Reponds UNIQUEMENT avec un JSON valide :
{
  "ads": [
    {
      "layout": "hero_product",
      "copy": {
        "headline": "Accroche percutante courte",
        "subheadline": "Sous-titre optionnel",
        "benefits": ["Benefice 1", "Benefice 2", "Benefice 3"],
        "cta": "Texte du bouton CTA",
        "guarantee": "Texte garantie optionnel",
        "stats": [{"value": "14g", "label": "Protein"}],
        "comparisonLeft": {"title": "Nous", "points": ["Avantage 1"]},
        "comparisonRight": {"title": "Eux", "points": ["Inconvenient 1"]},
        "beforeLabel": "AVANT",
        "afterLabel": "APRES",
        "tagline": "Tagline marque"
      },
      "styling": {
        "backgroundColor": "#1a1a2e",
        "backgroundGradient": {"from": "#1a1a2e", "to": "#16213e", "direction": "vertical"},
        "textColor": "#ffffff",
        "accentColor": "#e94560",
        "headlineSize": "large",
        "fontStyle": "bold_sans",
        "productPlacement": "right",
        "productScale": 0.6,
        "overlayOpacity": 0.3
      },
      "backgroundPrompt": "Description DETAILLEE en anglais du FOND/SCENE uniquement. Pas de texte, pas de lettres, pas de mots. Pas de produit. Style photographique pro.",
      "creativeRationale": "Pourquoi ce concept va fonctionner pour cette marque/audience",
      "consciousnessLevel": "problem_aware",
      "emotionalHook": "Emotion principale ciblee"
    }
  ]
}

REGLES CRITIQUES pour backgroundPrompt :
1. JAMAIS de texte, lettres, mots, chiffres dans le backgroundPrompt
2. ${params.hasProductImage ? "JAMAIS le produit (il sera compose par-dessus)" : "Inclure une representation du produit dans la scene"}
3. Style photographique professionnel adapte a la marque
4. Decrire eclairage, texture, ambiance, couleurs de fond
5. Le backgroundPrompt doit etre en ANGLAIS
6. Minimum 3 phrases descriptives

N'inclure QUE les champs pertinents dans copy (pas de comparisonLeft/Right pour un hero_product, pas de stats si pas de chiffres, etc).`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as AdConceptResult;
}
