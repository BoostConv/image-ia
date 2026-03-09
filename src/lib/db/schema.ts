import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// MODULE 1: BRAND BRAIN
// ============================================================

export const brands = sqliteTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoPath: text("logo_path"),
  // Brand strategy
  mission: text("mission"),
  vision: text("vision"),
  positioning: text("positioning"),
  tone: text("tone"),
  values: text("values", { mode: "json" }).$type<string[]>(),
  targetMarket: text("target_market"),
  // Visual identity
  colorPalette: text("color_palette", { mode: "json" }).$type<{
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  }>(),
  typography: text("typography", { mode: "json" }).$type<{
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
  }>(),
  moodboardPaths: text("moodboard_paths", { mode: "json" }).$type<string[]>(),
  styleGuideText: text("style_guide_text"),
  websiteUrl: text("website_url"),
  scrapedData: text("scraped_data", { mode: "json" }).$type<{
    angles: string[];
    promises: string[];
    socialProof: string[];
    tone: string;
  }>(),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  usp: text("usp"),
  benefits: text("benefits", { mode: "json" }).$type<string[]>(),
  objections: text("objections", { mode: "json" }).$type<string[]>(),
  pricing: text("pricing"),
  positioning: text("positioning"),
  season: text("season"),
  usageContext: text("usage_context"),
  imagePaths: text("image_paths", { mode: "json" }).$type<string[]>(),
  marketingArguments: text("marketing_arguments", { mode: "json" }).$type<{
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
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  demographics: text("demographics", { mode: "json" }).$type<{
    ageRange: string;
    gender?: string;
    location?: string;
    income?: string;
    lifestyle?: string;
  }>(),
  psychographics: text("psychographics", { mode: "json" }).$type<{
    painPoints: string[];
    motivations: string[];
    aesthetic: string;
  }>(),
  visualStyle: text("visual_style", { mode: "json" }).$type<{
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType?: string;
    decorStyle?: string;
  }>(),
  promptModifiers: text("prompt_modifiers"),
  isGlobal: integer("is_global", { mode: "boolean" }).default(false),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// BRAND DOCUMENTS & INSPIRATION
// ============================================================

export const brandDocuments = sqliteTable("brand_documents", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "brand_book" | "style_guide" | "brief" | "other"
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  extractedText: text("extracted_text"), // Text extracted from PDF/doc
  summary: text("summary"), // AI-generated summary of the document
  keyInsights: text("key_insights", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const inspirationAds = sqliteTable("inspiration_ads", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  name: text("name"),
  source: text("source"), // "brand" | "competitor" | "inspiration"
  competitorName: text("competitor_name"),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  analysis: text("analysis"), // AI-generated analysis of what makes this ad effective
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"), // User notes about why this ad is good
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// GUIDELINES & LEARNING
// ============================================================

export const guidelines = sqliteTable("guidelines", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "composition" | "color" | "copy" | "platform" | "performance" | "brand_rules" | "ad_psychology"
  title: text("title").notNull(),
  content: text("content").notNull(),
  examples: text("examples", { mode: "json" }).$type<string[]>(),
  priority: integer("priority").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  source: text("source").default("manual"), // "manual" | "learned" | "imported"
  performanceScore: real("performance_score"),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const adKnowledge = sqliteTable("ad_knowledge", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "winning_pattern" | "avoid_pattern" | "style_insight" | "format_insight"
  insight: text("insight").notNull(),
  confidence: real("confidence").default(0.5),
  basedOnApproved: integer("based_on_approved").default(0),
  basedOnRejected: integer("based_on_rejected").default(0),
  relatedPromptElements: text("related_prompt_elements", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// MODULE 2: CREATIVE ENGINE
// ============================================================

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  brandId: text("brand_id").references(() => brands.id),
  productId: text("product_id").references(() => products.id),
  personaId: text("persona_id").references(() => personas.id),
  mode: text("mode").notNull(), // "single" | "batch" | "brief" | "reference"
  status: text("status").notNull().default("pending"), // "pending" | "generating" | "completed" | "failed"
  promptLayers: text("prompt_layers", { mode: "json" }).$type<{
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
  extractedConstraints: text("extracted_constraints", { mode: "json" }),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  errorMessage: text("error_message"),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  completedAt: text("completed_at"),
});

export const generatedImages = sqliteTable("generated_images", {
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
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  status: text("status").default("pending"), // "pending" | "approved" | "rejected"
  preferenceScore: real("preference_score"),
  galleryId: text("gallery_id"),
  scoreData: text("score_data", { mode: "json" }).$type<{
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
  // Composed ad (v2 pipeline)
  composedFilePath: text("composed_file_path"),
  // New engine data (6-layer pipeline)
  creativeData: text("creative_data", { mode: "json" }).$type<{
    brief?: Record<string, unknown>;
    artDirection?: Record<string, unknown>;
    evaluation?: Record<string, unknown>;
    composedEvaluation?: Record<string, unknown>;
    gateVerdict?: Record<string, unknown>;
    compositionGateVerdict?: Record<string, unknown>;
  }>(),
  rankingData: text("ranking_data", { mode: "json" }).$type<Record<string, unknown>>(),
  iterationOf: text("iteration_of"),
  iterationLevel: integer("iteration_level").default(0),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// MODULE 3: REVIEW LOOP
// ============================================================

export const galleries = sqliteTable("galleries", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  shareToken: text("share_token").unique().notNull(),
  brandingConfig: text("branding_config", { mode: "json" }).$type<{
    logoPath?: string;
    primaryColor?: string;
    headerText?: string;
  }>(),
  expiresAt: text("expires_at"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  viewCount: integer("view_count").default(0),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  imageId: text("image_id")
    .notNull()
    .references(() => generatedImages.id, { onDelete: "cascade" }),
  galleryId: text("gallery_id").references(() => galleries.id),
  reviewerType: text("reviewer_type").notNull(), // "client" | "consultant"
  verdict: text("verdict").notNull(), // "approved" | "rejected" | "revision"
  comment: text("comment"),
  suggestedPromptChange: text("suggested_prompt_change"),
  appliedToGenerationId: text("applied_to_generation_id").references(
    () => generations.id
  ),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// MODULE 4: PREFERENCES + LIBRARY
// ============================================================

export const preferenceScores = sqliteTable("preference_scores", {
  id: text("id").primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => brands.id),
  dimension: text("dimension").notNull(),
  dimensionValue: text("dimension_value").notNull(),
  score: real("score").notNull().default(0),
  sampleCount: integer("sample_count").default(0),
  isManualOverride: integer("is_manual_override", { mode: "boolean" }).default(
    false
  ),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const promptHistory = sqliteTable("prompt_history", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => generations.id),
  compiledPrompt: text("compiled_prompt").notNull(),
  resultRating: integer("result_rating"),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// ============================================================
// CAMPAIGN TEMPLATES
// ============================================================

export const campaignTemplates = sqliteTable("campaign_templates", {
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
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});
