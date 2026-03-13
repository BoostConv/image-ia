import { sql } from "drizzle-orm";
import { pgTable, text, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

// ============================================================
// BRAND BRIEF V1 — Type Definitions
// ============================================================

export interface IdentiteFondamentale {
  vision: string;
  mission: string;
  combatEnnemi: string;       // Ce contre quoi la marque lutte
  histoireMarque: string;     // Genèse, fondateurs, moments clés
  valeurs: Array<{
    name: string;
    signification: string;
    preuve: string;           // Brevet, certification, chiffre
  }>;
}

export interface PositionnementStrategique {
  propositionValeur: string;
  positionnementPrix: {
    niveau: "entree" | "milieu" | "moyen_haut" | "premium" | "luxe";
    prixMoyen?: number;
    justification: string;
  };
  elementDistinctif: string;
  avantagesConcurrentiels: string[];
  tensionsPositionnement: string[];
}

export interface TonCommunication {
  tonDominant: string[];       // 2-3 adjectifs
  registresEncourages: string[];
  registresAEviter: string[];
  vocabulaireRecurrent: string[];
  redLines: string[];          // Ce que la marque ne doit JAMAIS dire
}

export interface BriefMetadata {
  gaps: Array<{ field: string; reason: string; severity: "warning" | "critical" }>;
  sources: Record<string, string>;
  generatedAt: string;
  confidence: number;
}

export type BriefStatus = "draft" | "complete" | "incomplete";

export interface BrandBrief {
  identiteFondamentale: IdentiteFondamentale;
  positionnementStrategique: PositionnementStrategique;
  tonCommunication: TonCommunication;
  metadata: BriefMetadata;
  status: BriefStatus;
}

// ============================================================
// COUCHE 2 — ANALYSE PRODUIT
// ============================================================

export interface FABBenefit {
  feature: string;           // Caractéristique technique
  advantage: string;         // Avantage fonctionnel
  benefit: string;           // Bénéfice émotionnel/transformationnel
  proofPoints: string[];     // Preuves (études, certifications, chiffres)
}

export interface USPTriptyque {
  usp: string;               // Unique Selling Proposition
  ump: string;               // Unique Marketing Proposition
  ums: string;               // Unique Mechanism Story
}

export interface DURProblem {
  description: string;
  douloureux: number;        // 1-10
  urgent: number;            // 1-10
  reconnu: number;           // 1-10
  totalScore: number;        // Calculé
}

export interface ValueEquation {
  dreamOutcome: string;
  perceivedLikelihood: number;  // 1-10
  timeDelay: string;
  effortSacrifice: string;
  score: number;
}

export interface BeforeAfter {
  dimension: string;         // "Physique" | "Émotionnel" | "Social" | "Financier"
  before: string;
  after: string;
  timeframe: string;
}

export interface ProductObjection {
  objection: string;
  type: "prix" | "confiance" | "urgence" | "besoin" | "autorite";
  reponse: string;
  preuve: string;
}

export interface SalesArgument {
  argument: string;
  cible: string;             // Persona ou segment
  contexte: string;          // Quand utiliser
  force: number;             // 1-10
}

export interface CompetitorInsight {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  ourAdvantage: string;
}

export interface ReviewInsights {
  topPraises: string[];
  topComplaints: string[];
  unexpectedUseCases: string[];
  emotionalQuotes: string[];
}

export interface ProductAnalysisMetadata {
  generatedAt: string;
  sources: string[];
  confidence: number;
  gaps: Array<{ field: string; reason: string }>;
}

export interface ProductAnalysis {
  fabBenefits: FABBenefit[];
  uspTriptyque: USPTriptyque;
  durProblems: DURProblem[];
  valueEquation: ValueEquation;
  beforeAfter: BeforeAfter[];
  objections: ProductObjection[];
  salesArguments: SalesArgument[];
  competitorInsights: CompetitorInsight[];
  reviewInsights: ReviewInsights;
  analysisMetadata: ProductAnalysisMetadata;
}

// ============================================================
// COUCHE 3 — ANGLES MARKETING (FRAMEWORK EPIC)
// ============================================================

export type EPICType = "emotional" | "practical" | "identity" | "critical";

export interface TerrainAnalysis {
  awareness: "unaware" | "problem_aware" | "solution_aware" | "product_aware" | "most_aware";
  sophistication: 1 | 2 | 3 | 4 | 5;
  temperature: "cold" | "warm" | "hot";
  dominantEmotion: string;
  barriers: string[];
}

export interface MarketingHook {
  text: string;
  type: "question" | "statement" | "story" | "statistic" | "challenge";
  targetEmotion: string;
  strength: number;           // 1-10
}

export interface Narrative {
  structure: "PAS" | "AIDA" | "BAB" | "4Ps" | "StoryBrand";
  opening: string;
  conflict: string;
  resolution: string;
  cta: string;
  fullScript: string;
}

export interface VisualDirectionSpec {
  mood: string;
  colorTone: string;
  imageryStyle: string;
  modelDirection: string;
}

export interface EstimatedPerformance {
  engagementScore: number;
  conversionPotential: number;
  fatigueRisk: number;
}

export interface AngleMetadata {
  generatedAt: string;
  basedOn: string[];        // Sources utilisées
  confidence: number;
}

export interface MarketingAngleSpec {
  id: string;
  name: string;
  epicType: EPICType;
  terrain: TerrainAnalysis;
  coreBenefit: string;
  targetPersonaIds: string[];  // Liens vers personas
  hooks: MarketingHook[];
  narratives: Narrative[];
  visualDirection: VisualDirectionSpec;
  estimatedPerformance: EstimatedPerformance;
  metadata: AngleMetadata;
}

export interface AnglePriority {
  angleId: string;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedBudgetPercent: number;
}

export interface AngleSynergy {
  angleIds: [string, string];
  synergyType: string;
  recommendation: string;
}

export interface AnglesPrioritization {
  productId: string;
  angles: MarketingAngleSpec[];
  priorityMatrix: AnglePriority[];
  synergies: AngleSynergy[];
}

// ============================================================
// COUCHE 4 — PERSONA RICHE
// ============================================================

export interface DesireLevel {
  level: 1 | 2 | 3 | 4 | 5;
  description: string;
  // 1: Surface (ce qu'ils disent vouloir)
  // 2: Fonctionnel (ce qu'ils veulent vraiment)
  // 3: Émotionnel (comment ils veulent se sentir)
  // 4: Identitaire (qui ils veulent devenir)
  // 5: Existentiel (sens profond)
}

export interface DefensePsychology {
  primaryDefense: string;           // Mécanisme de défense dominant
  resistancePatterns: string[];     // Patterns de résistance à l'achat
  trustBuilders: string[];          // Ce qui construit la confiance
  decisionStyle: "impulsif" | "analytique" | "social" | "emotionnel";
  riskTolerance: "faible" | "modere" | "eleve";
}

export interface LanguageProfile {
  vocabularyLevel: "simple" | "intermediaire" | "sophistique";
  preferredTone: string[];
  triggerWords: string[];           // Mots qui captent l'attention
  avoidWords: string[];             // Mots qui repoussent
  metaphorsResonant: string[];      // Métaphores qui parlent
  socialProofType: "experts" | "pairs" | "celebrities" | "statistics";
}

export interface SituationalTrigger {
  situation: string;                // Contexte de vie
  trigger: string;                  // Déclencheur d'achat
  emotion: string;                  // Émotion dominante
  urgency: number;                  // 1-10
  bestAngleType: EPICType;          // Meilleur type d'angle
}

export interface PersonaDemographics {
  ageRange: string;
  gender: string;
  location: string;
  income: string;
  profession: string;
  familyStatus: string;
  education: string;
}

export interface PersonaPsychographics {
  desires: DesireLevel[];         // 5 niveaux
  fears: string[];
  frustrations: string[];
  aspirations: string[];
  values: string[];
  beliefs: string[];              // Croyances limitantes et habilitantes
}

export interface DigitalBehavior {
  platforms: string[];
  contentPreferences: string[];
  peakActivityTimes: string[];
  devicePreference: "mobile" | "desktop" | "tablet";
  attentionSpan: "court" | "moyen" | "long";
}

export interface CustomerJourney {
  awarenessChannels: string[];
  researchBehavior: string;
  decisionFactors: string[];
  postPurchaseBehavior: string;
}

export interface AngleAffinity {
  angleId: string;
  affinityScore: number;          // 1-10
  reason: string;
}

export interface PersonaMetadata {
  generatedAt: string;
  basedOn: string[];
  confidence: number;
  gaps: Array<{ field: string; reason: string }>;
}

export interface RichPersona {
  // Identité de base
  id: string;
  name: string;
  avatar: string;                   // Description visuelle ou URL
  tagline: string;                  // "La mère active qui..."

  // Démographie
  demographics: PersonaDemographics;

  // Psychographie profonde
  psychographics: PersonaPsychographics;

  // Psychologie d'achat
  buyingPsychology: DefensePsychology;

  // Profil linguistique
  languageProfile: LanguageProfile;

  // Triggers situationnels
  situationalTriggers: SituationalTrigger[];

  // Comportement digital
  digitalBehavior: DigitalBehavior;

  // Parcours client
  customerJourney: CustomerJourney;

  // Liens avec angles marketing
  angleAffinities: AngleAffinity[];

  // Metadata
  metadata: PersonaMetadata;
}

// ============================================================
// MODULE 1: BRAND BRAIN
// ============================================================

export const brands = pgTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoPath: text("logo_path"),
  // Brand strategy
  mission: text("mission"),
  vision: text("vision"),
  positioning: text("positioning"),
  tone: text("tone"),
  values: jsonb("values").$type<string[]>(),
  targetMarket: text("target_market"),
  // Visual identity
  colorPalette: jsonb("color_palette").$type<{
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  }>(),
  typography: jsonb("typography").$type<{
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
  }>(),
  moodboardPaths: jsonb("moodboard_paths").$type<string[]>(),
  styleGuideText: text("style_guide_text"),
  websiteUrl: text("website_url"),
  scrapedData: jsonb("scraped_data").$type<{
    angles: string[];
    promises: string[];
    socialProof: string[];
    tone: string;
  }>(),

  // ============================================================
  // BRAND BRIEF V1 — Auto-generated strategic brief
  // ============================================================

  // A. Identité Fondamentale
  identiteFondamentale: jsonb("identite_fondamentale").$type<{
    vision: string;
    mission: string;
    combatEnnemi: string;       // Ce contre quoi la marque lutte
    histoireMarque: string;     // Genèse, fondateurs, moments clés
    valeurs: Array<{
      name: string;
      signification: string;
      preuve: string;           // Brevet, certification, chiffre
    }>;
  }>(),

  // B. Positionnement Stratégique
  positionnementStrategique: jsonb("positionnement_strategique").$type<{
    propositionValeur: string;
    positionnementPrix: {
      niveau: "entree" | "milieu" | "moyen_haut" | "premium" | "luxe";
      prixMoyen?: number;
      justification: string;
    };
    elementDistinctif: string;
    avantagesConcurrentiels: string[];
    tensionsPositionnement: string[];
  }>(),

  // G. Ton & Communication
  tonCommunication: jsonb("ton_communication").$type<{
    tonDominant: string[];       // 2-3 adjectifs
    registresEncourages: string[];
    registresAEviter: string[];
    vocabulaireRecurrent: string[];
    redLines: string[];          // Ce que la marque ne doit JAMAIS dire
  }>(),

  // Metadata
  briefMetadata: jsonb("brief_metadata").$type<{
    gaps: Array<{ field: string; reason: string; severity: "warning" | "critical" }>;
    sources: Record<string, string>;
    generatedAt: string;
    confidence: number;
  }>(),

  briefStatus: text("brief_status").$type<"draft" | "complete" | "incomplete">().default("draft"),

  // PHASE 5+ — Brand Style Images (visuels de reference pour le style marque)
  brandStyleImages: jsonb("brand_style_images").$type<string[]>(),

  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export interface ProductVariant {
  id: string;           // nanoid
  name: string;         // e.g., "Chocolat", "Vanille", "Rouge XL"
  type: string;         // e.g., "Goût", "Couleur", "Taille"
  imagePaths: string[]; // images specific to this variant
}

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  usp: text("usp"),
  benefits: jsonb("benefits").$type<string[]>(),
  objections: jsonb("objections").$type<string[]>(),
  pricing: text("pricing"),
  positioning: text("positioning"),
  season: text("season"),
  usageContext: text("usage_context"),
  imagePaths: jsonb("image_paths").$type<string[]>(),
  variants: jsonb("variants").$type<ProductVariant[]>(),
  marketingArguments: jsonb("marketing_arguments").$type<{
    headlines: string[];
    hooks: string[];
    callToActions: string[];
    emotionalTriggers: string[];
    socialProof: string[];
    guarantees: string[];
  }>(),
  targetAudience: text("target_audience"),
  competitiveAdvantage: text("competitive_advantage"),
  // COUCHE 2 — Analyse produit complète
  productAnalysis: jsonb("product_analysis").$type<ProductAnalysis>(),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const personas = pgTable("personas", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  demographics: jsonb("demographics").$type<{
    ageRange: string;
    gender?: string;
    location?: string;
    income?: string;
    lifestyle?: string;
  }>(),
  psychographics: jsonb("psychographics").$type<{
    painPoints: string[];
    motivations: string[];
    aesthetic: string;
  }>(),
  visualStyle: jsonb("visual_style").$type<{
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType?: string;
    decorStyle?: string;
  }>(),
  promptModifiers: text("prompt_modifiers"),
  isGlobal: boolean("is_global").default(false),
  // COUCHE 4 — Persona riche
  richProfile: jsonb("rich_profile").$type<RichPersona>(),
  linkedAngles: jsonb("linked_angles").$type<string[]>(),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// COUCHE 3 — MARKETING ANGLES TABLE
// ============================================================

export const marketingAngles = pgTable("marketing_angles", {
  id: text("id").primaryKey(),
  productId: text("product_id").references(() => products.id, {
    onDelete: "cascade",
  }),
  brandId: text("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  angles: jsonb("angles").$type<MarketingAngleSpec[]>(),
  prioritization: jsonb("prioritization").$type<AnglesPrioritization>(),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: text("updated_at"),
});

// ============================================================
// BRAND DOCUMENTS & INSPIRATION
// ============================================================

export const brandDocuments = pgTable("brand_documents", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "brand_book" | "style_guide" | "brief" | "other"
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  extractedText: text("extracted_text"),
  summary: text("summary"),
  keyInsights: jsonb("key_insights").$type<string[]>(),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const inspirationAds = pgTable("inspiration_ads", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name"),
  source: text("source"),
  competitorName: text("competitor_name"),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  analysis: text("analysis"),
  tags: jsonb("tags").$type<string[]>(),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// GUIDELINES & LEARNING
// ============================================================

export const guidelines = pgTable("guidelines", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  examples: jsonb("examples").$type<string[]>(),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  source: text("source").default("manual"),
  performanceScore: real("performance_score"),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const adKnowledge = pgTable("ad_knowledge", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  insight: text("insight").notNull(),
  confidence: real("confidence").default(0.5),
  basedOnApproved: integer("based_on_approved").default(0),
  basedOnRejected: integer("based_on_rejected").default(0),
  relatedPromptElements: jsonb("related_prompt_elements").$type<string[]>(),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// MODULE 2: CREATIVE ENGINE
// ============================================================

export const generations = pgTable("generations", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").references(() => brands.id),
  productId: text("product_id").references(() => products.id),
  personaId: text("persona_id").references(() => personas.id),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("pending"),
  promptLayers: jsonb("prompt_layers").$type<{
    brand: string;
    persona: string;
    brief: string;
    format: string;
    custom: string;
  }>(),
  compiledPrompt: text("compiled_prompt").notNull(),
  format: text("format").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  resolution: text("resolution").default("1K"),
  variationCount: integer("variation_count").default(1),
  referenceImagePath: text("reference_image_path"),
  creativeDistance: real("creative_distance"),
  originalBrief: text("original_brief"),
  extractedConstraints: jsonb("extracted_constraints"),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  errorMessage: text("error_message"),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  completedAt: text("completed_at"),
});

export const generatedImages = pgTable("generated_images", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  brandId: text("brand_id").references(() => brands.id),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  fileSizeBytes: integer("file_size_bytes"),
  format: text("format"),
  personaId: text("persona_id").references(() => personas.id),
  tags: jsonb("tags").$type<string[]>(),
  status: text("status").default("pending"),
  preferenceScore: real("preference_score"),
  galleryId: text("gallery_id"),
  scoreData: jsonb("score_data").$type<{
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
  }>(),
  composedFilePath: text("composed_file_path"),
  creativeData: jsonb("creative_data").$type<{
    brief?: Record<string, unknown>;
    artDirection?: Record<string, unknown>;
    evaluation?: Record<string, unknown>;
    composedEvaluation?: Record<string, unknown>;
    gateVerdict?: Record<string, unknown>;
    compositionGateVerdict?: Record<string, unknown>;
    prompt_used?: string;
    // ── v3 flat taxonomy fields (for learning & analytics) ──
    format_family?: string;
    layout_family?: string;
    proof_mechanism?: string;
    awareness_stage?: string;
    render_family?: string;
    ad_job?: string;
    visual_style?: string;
    style_mode?: string;
    rupture_structure?: string;
    graphic_tension?: string;
    marketing_lever?: string;
    human_presence?: string;
    product_role?: string;
    // ── v3 critic scores (pre-render quality signal) ──
    critic_score?: number;
    critic_stop_scroll?: number;
    critic_message_clarity?: number;
    critic_ad_likeness?: number;
    critic_proof_strength?: number;
    // ── v3 concept metadata ──
    headline?: string;
    cta?: string;
    belief_shift?: string;
    customer_insight?: string;
    learning_hypothesis?: string;
    engine_version?: string;
  }>(),
  rankingData: jsonb("ranking_data").$type<Record<string, unknown>>(),
  iterationOf: text("iteration_of"),
  iterationLevel: integer("iteration_level").default(0),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// MODULE 3: REVIEW LOOP
// ============================================================

export const galleries = pgTable("galleries", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  shareToken: text("share_token").unique().notNull(),
  brandingConfig: jsonb("branding_config").$type<{
    logoPath?: string;
    primaryColor?: string;
    headerText?: string;
  }>(),
  expiresAt: text("expires_at"),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  imageId: text("image_id")
    .notNull()
    .references(() => generatedImages.id, { onDelete: "cascade" }),
  galleryId: text("gallery_id").references(() => galleries.id),
  reviewerType: text("reviewer_type").notNull(),
  verdict: text("verdict").notNull(),
  comment: text("comment"),
  suggestedPromptChange: text("suggested_prompt_change"),
  appliedToGenerationId: text("applied_to_generation_id").references(
    () => generations.id
  ),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// MODULE 4: PREFERENCES + LIBRARY
// ============================================================

export const preferenceScores = pgTable("preference_scores", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id),
  dimension: text("dimension").notNull(),
  dimensionValue: text("dimension_value").notNull(),
  score: real("score").notNull().default(0),
  sampleCount: integer("sample_count").default(0),
  isManualOverride: boolean("is_manual_override").default(false),
  updatedAt: text("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const promptHistory = pgTable("prompt_history", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id),
  compiledPrompt: text("compiled_prompt").notNull(),
  resultRating: integer("result_rating"),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// CAMPAIGN TEMPLATES
// ============================================================

export const campaignTemplates = pgTable("campaign_templates", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  productId: text("product_id").references(() => products.id),
  personaId: text("persona_id").references(() => personas.id),
  format: text("format"),
  aspectRatio: text("aspect_ratio"),
  brief: text("brief"),
  batchCount: integer("batch_count").default(5),
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});

// ============================================================
// PHASE 5+ — LAYOUT INSPIRATIONS (Screenshots Meta Ads)
// ============================================================

export type LayoutFamily =
  | "left_copy_right_product"
  | "center_hero_top_claim"
  | "split_screen"
  | "card_stack"
  | "quote_frame"
  | "badge_cluster"
  | "vertical_story_stack"
  | "diagonal_split"
  | "hero_with_bottom_offer"
  | "macro_with_side_copy";

export const layoutInspirations = pgTable("layout_inspirations", {
  id: text("id").primaryKey(),
  layoutFamily: text("layout_family").$type<LayoutFamily>().notNull(),
  name: text("name").notNull(),
  imagePath: text("image_path").notNull(),
  description: text("description"),
  gridSystem: text("grid_system"), // "3-column: left 45% | center 10% | right 45%"
  readingOrder: text("reading_order"), // "Z-pattern: headline → product → CTA"
  bestFor: jsonb("best_for").$type<string[]>(), // ["before_after", "comparison"]
  brandId: text("brand_id").references(() => brands.id, { onDelete: "cascade" }), // null = global
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
});
