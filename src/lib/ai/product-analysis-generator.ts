import Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithRetry } from "./claude-retry";
import type {
  ProductAnalysis,
  FABBenefit,
  USPTriptyque,
  DURProblem,
  ValueEquation,
  BeforeAfter,
  ProductObjection,
  SalesArgument,
  CompetitorInsight,
  ReviewInsights,
} from "../db/schema";

// ============================================================
// PRODUCT ANALYSIS GENERATOR — Couche 2
// Generates comprehensive product analysis from URL, reviews,
// and competitor data using Claude AI
// ============================================================

const getClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante dans .env.local");
  return new Anthropic({ apiKey: key });
};

export interface ScrapedProductData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  images?: string[];
  specs?: Record<string, string>;
  ingredients?: string[];
  features?: string[];
  category?: string;
}

export interface ProductAnalysisInput {
  productUrl: string;
  scrapedProduct: ScrapedProductData;
  reviewsText?: string;           // Fichier CSV/TXT des avis
  competitorUrls?: string[];
  competitorData?: ScrapedProductData[];
  brandContext?: {
    positioning: string;
    values: string[];
    tone: string[];
    combatEnnemi?: string;
  };
}

interface RawProductAnalysisResponse {
  fabBenefits: FABBenefit[];
  uspTriptyque: USPTriptyque;
  durProblems: DURProblem[];
  valueEquation: ValueEquation;
  beforeAfter: BeforeAfter[];
  objections: ProductObjection[];
  salesArguments: SalesArgument[];
  competitorInsights: CompetitorInsight[];
  reviewInsights: ReviewInsights;
  fieldConfidences: Record<string, number>;
  gaps: Array<{ field: string; reason: string }>;
}

/**
 * Generate a comprehensive product analysis from scraped data.
 *
 * @param input - Product data, reviews, and competitor info
 * @returns ProductAnalysis with FAB, USP, DUR, objections, etc.
 */
export async function generateProductAnalysis(
  input: ProductAnalysisInput
): Promise<ProductAnalysis> {
  const client = getClient();

  const productContext = buildProductContext(input);

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system: `Tu es un EXPERT en copywriting DTC et analyse produit e-commerce.

## TA MISSION

A partir des donnees produit (scrape, avis, concurrents), tu dois generer une ANALYSE PRODUIT COMPLETE pour alimenter la creation publicitaire.

## FRAMEWORKS A APPLIQUER

### 1. FAB (Feature-Advantage-Benefit)
- FEATURE: Caracteristique technique objective
- ADVANTAGE: Avantage fonctionnel (ce que ca permet de faire)
- BENEFIT: Benefice emotionnel/transformationnel (comment ca change la vie)
- PROOF POINTS: Preuves concretes (etudes, certifications, chiffres)

### 2. USP TRIPTYQUE
- USP (Unique Selling Proposition): Ce qui rend le produit UNIQUE vs concurrents
- UMP (Unique Marketing Proposition): L'angle EMOTIONNEL qui resonne
- UMS (Unique Mechanism Story): L'HISTOIRE du mecanisme qui cree la credibilite

### 3. DUR (Douloureux, Urgent, Reconnu)
Pour chaque probleme identifie:
- Douloureux (1-10): A quel point ca fait mal?
- Urgent (1-10): A quel point c'est pressant?
- Reconnu (1-10): A quel point le client en est conscient?
- Total Score = (D + U + R) / 3

### 4. VALUE EQUATION (Alex Hormozi)
Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)
- Dream Outcome: Le resultat ideal
- Perceived Likelihood: Probabilite percue (1-10)
- Time Delay: Temps avant resultats
- Effort & Sacrifice: Ce que ca coute (argent, temps, effort)

### 5. BEFORE/AFTER
Transformations sur 4 dimensions:
- Physique: Changement corporel/tangible
- Emotionnel: Changement d'etat emotionnel
- Social: Changement de statut/perception sociale
- Financier: Changement economique

### 6. OBJECTIONS
Types: prix, confiance, urgence, besoin, autorite
Pour chaque objection: reponse + preuve

### 7. SALES ARGUMENTS
Arguments de vente adaptes par persona/contexte avec score de force (1-10)

## REGLES

- Sois SPECIFIQUE, pas generique
- Utilise des CHIFFRES quand possible
- Les benefits doivent etre EMOTIONNELS
- Les preuves doivent etre VERIFIABLES
- Note les gaps si info manquante

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
      messages: [
        {
          role: "user",
          content: `Genere l'analyse produit complete.

${productContext}

=== FORMAT JSON ATTENDU ===

{
  "fabBenefits": [
    {
      "feature": "Caracteristique technique",
      "advantage": "Ce que ca permet",
      "benefit": "Benefice emotionnel",
      "proofPoints": ["Preuve 1", "Preuve 2"]
    }
  ],
  "uspTriptyque": {
    "usp": "Ce qui rend unique vs concurrents",
    "ump": "Angle marketing emotionnel",
    "ums": "Histoire du mecanisme"
  },
  "durProblems": [
    {
      "description": "Le probleme",
      "douloureux": 8,
      "urgent": 7,
      "reconnu": 9,
      "totalScore": 8
    }
  ],
  "valueEquation": {
    "dreamOutcome": "Le resultat ideal",
    "perceivedLikelihood": 8,
    "timeDelay": "2 semaines",
    "effortSacrifice": "Prix + routine quotidienne",
    "score": 7.5
  },
  "beforeAfter": [
    {
      "dimension": "Physique|Emotionnel|Social|Financier",
      "before": "Etat avant",
      "after": "Etat apres",
      "timeframe": "30 jours"
    }
  ],
  "objections": [
    {
      "objection": "C'est trop cher",
      "type": "prix",
      "reponse": "Reponse a l'objection",
      "preuve": "Preuve de la reponse"
    }
  ],
  "salesArguments": [
    {
      "argument": "L'argument de vente",
      "cible": "Persona ou segment cible",
      "contexte": "Quand utiliser cet argument",
      "force": 9
    }
  ],
  "competitorInsights": [
    {
      "competitor": "Nom concurrent",
      "strengths": ["Force 1", "Force 2"],
      "weaknesses": ["Faiblesse 1"],
      "ourAdvantage": "Notre avantage sur ce concurrent"
    }
  ],
  "reviewInsights": {
    "topPraises": ["Eloge 1", "Eloge 2"],
    "topComplaints": ["Plainte 1"],
    "unexpectedUseCases": ["Usage inattendu"],
    "emotionalQuotes": ["Citation emotionnelle de client"]
  },
  "fieldConfidences": {
    "fabBenefits": 0.9,
    "uspTriptyque": 0.8,
    "durProblems": 0.7
  },
  "gaps": [
    {
      "field": "competitorInsights",
      "reason": "Pas de donnees concurrents fournies"
    }
  ]
}`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Product Analysis Generator: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const raw = JSON.parse(jsonStr.trim()) as RawProductAnalysisResponse;

    // Calculate overall confidence
    const confidenceValues = Object.values(raw.fieldConfidences || {});
    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0.5;

    const analysis: ProductAnalysis = {
      fabBenefits: validateFABBenefits(raw.fabBenefits),
      uspTriptyque: validateUSPTriptyque(raw.uspTriptyque),
      durProblems: validateDURProblems(raw.durProblems),
      valueEquation: validateValueEquation(raw.valueEquation),
      beforeAfter: validateBeforeAfter(raw.beforeAfter),
      objections: validateObjections(raw.objections),
      salesArguments: validateSalesArguments(raw.salesArguments),
      competitorInsights: raw.competitorInsights || [],
      reviewInsights: validateReviewInsights(raw.reviewInsights),
      analysisMetadata: {
        generatedAt: new Date().toISOString(),
        sources: buildSourcesList(input),
        confidence: avgConfidence,
        gaps: raw.gaps || [],
      },
    };

    console.log("[ProductAnalysisGenerator] Generated analysis:", {
      productName: input.scrapedProduct.title,
      fabCount: analysis.fabBenefits.length,
      durCount: analysis.durProblems.length,
      objectionsCount: analysis.objections.length,
      confidence: analysis.analysisMetadata.confidence.toFixed(2),
    });

    return analysis;
  } catch (e) {
    console.error("[ProductAnalysisGenerator] JSON parse error:", jsonStr.slice(0, 400));
    throw new Error(`Product Analysis Generator: JSON invalide — ${(e as Error).message}`);
  }
}

// ============================================================
// CONTEXT BUILDER
// ============================================================

function buildProductContext(input: ProductAnalysisInput): string {
  const parts: string[] = [];

  // Product info
  parts.push(`=== PRODUIT ===`);
  parts.push(`URL: ${input.productUrl}`);
  parts.push(`Titre: ${input.scrapedProduct.title}`);
  parts.push(`Description: ${input.scrapedProduct.description}`);

  if (input.scrapedProduct.price) {
    parts.push(`Prix: ${input.scrapedProduct.price} ${input.scrapedProduct.currency || "EUR"}`);
  }

  if (input.scrapedProduct.category) {
    parts.push(`Categorie: ${input.scrapedProduct.category}`);
  }

  if (input.scrapedProduct.specs && Object.keys(input.scrapedProduct.specs).length > 0) {
    parts.push(`\nSpecifications:`);
    Object.entries(input.scrapedProduct.specs).forEach(([key, value]) => {
      parts.push(`- ${key}: ${value}`);
    });
  }

  if (input.scrapedProduct.ingredients?.length) {
    parts.push(`\nIngredients: ${input.scrapedProduct.ingredients.join(", ")}`);
  }

  if (input.scrapedProduct.features?.length) {
    parts.push(`\nFeatures: ${input.scrapedProduct.features.join(" | ")}`);
  }

  // Brand context
  if (input.brandContext) {
    parts.push(`\n=== CONTEXTE MARQUE ===`);
    parts.push(`Positionnement: ${input.brandContext.positioning}`);
    parts.push(`Valeurs: ${input.brandContext.values.join(", ")}`);
    parts.push(`Ton: ${input.brandContext.tone.join(", ")}`);
    if (input.brandContext.combatEnnemi) {
      parts.push(`Combat: ${input.brandContext.combatEnnemi}`);
    }
  }

  // Reviews
  if (input.reviewsText) {
    parts.push(`\n=== AVIS CLIENTS (extrait) ===`);
    parts.push(input.reviewsText.slice(0, 3000));
  }

  // Competitors
  if (input.competitorData?.length) {
    parts.push(`\n=== CONCURRENTS ===`);
    input.competitorData.forEach((comp, i) => {
      parts.push(`\nConcurrent ${i + 1}: ${comp.title}`);
      parts.push(`Prix: ${comp.price || "Non renseigne"} ${comp.currency || ""}`);
      parts.push(`Description: ${comp.description.slice(0, 500)}`);
    });
  } else if (input.competitorUrls?.length) {
    parts.push(`\n=== URLs CONCURRENTS (non scrapes) ===`);
    input.competitorUrls.forEach((url) => parts.push(`- ${url}`));
  }

  return parts.join("\n");
}

function buildSourcesList(input: ProductAnalysisInput): string[] {
  const sources: string[] = [input.productUrl];
  if (input.reviewsText) sources.push("reviews_file");
  if (input.competitorUrls?.length) {
    sources.push(...input.competitorUrls);
  }
  return sources;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validateFABBenefits(input: FABBenefit[]): FABBenefit[] {
  if (!Array.isArray(input)) return [];
  return input.map((fab) => ({
    feature: fab.feature || "",
    advantage: fab.advantage || "",
    benefit: fab.benefit || "",
    proofPoints: Array.isArray(fab.proofPoints) ? fab.proofPoints : [],
  }));
}

function validateUSPTriptyque(input: USPTriptyque): USPTriptyque {
  return {
    usp: input?.usp || "",
    ump: input?.ump || "",
    ums: input?.ums || "",
  };
}

function validateDURProblems(input: DURProblem[]): DURProblem[] {
  if (!Array.isArray(input)) return [];
  return input.map((dur) => ({
    description: dur.description || "",
    douloureux: clampScore(dur.douloureux),
    urgent: clampScore(dur.urgent),
    reconnu: clampScore(dur.reconnu),
    totalScore: dur.totalScore || (clampScore(dur.douloureux) + clampScore(dur.urgent) + clampScore(dur.reconnu)) / 3,
  }));
}

function validateValueEquation(input: ValueEquation): ValueEquation {
  return {
    dreamOutcome: input?.dreamOutcome || "",
    perceivedLikelihood: clampScore(input?.perceivedLikelihood || 5),
    timeDelay: input?.timeDelay || "",
    effortSacrifice: input?.effortSacrifice || "",
    score: input?.score || 5,
  };
}

function validateBeforeAfter(input: BeforeAfter[]): BeforeAfter[] {
  if (!Array.isArray(input)) return [];
  const validDimensions = ["Physique", "Emotionnel", "Social", "Financier"];
  return input.map((ba) => ({
    dimension: validDimensions.includes(ba.dimension) ? ba.dimension : "Physique",
    before: ba.before || "",
    after: ba.after || "",
    timeframe: ba.timeframe || "",
  }));
}

function validateObjections(input: ProductObjection[]): ProductObjection[] {
  if (!Array.isArray(input)) return [];
  const validTypes = ["prix", "confiance", "urgence", "besoin", "autorite"] as const;
  return input.map((obj) => ({
    objection: obj.objection || "",
    type: validTypes.includes(obj.type) ? obj.type : "besoin",
    reponse: obj.reponse || "",
    preuve: obj.preuve || "",
  }));
}

function validateSalesArguments(input: SalesArgument[]): SalesArgument[] {
  if (!Array.isArray(input)) return [];
  return input.map((arg) => ({
    argument: arg.argument || "",
    cible: arg.cible || "",
    contexte: arg.contexte || "",
    force: clampScore(arg.force),
  }));
}

function validateReviewInsights(input: ReviewInsights): ReviewInsights {
  return {
    topPraises: Array.isArray(input?.topPraises) ? input.topPraises : [],
    topComplaints: Array.isArray(input?.topComplaints) ? input.topComplaints : [],
    unexpectedUseCases: Array.isArray(input?.unexpectedUseCases) ? input.unexpectedUseCases : [],
    emotionalQuotes: Array.isArray(input?.emotionalQuotes) ? input.emotionalQuotes : [],
  };
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}
