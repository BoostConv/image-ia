import { sql } from "drizzle-orm";
import { pgTable, text, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";

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
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

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
  createdAt: text("created_at")
    .default(sql`NOW()`)
    .notNull(),
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
