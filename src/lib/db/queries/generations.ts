import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import { generations, generatedImages, promptHistory } from "../schema";
import { nanoid } from "nanoid";

export async function createGeneration(data: {
  brandId?: string;
  productId?: string;
  personaId?: string;
  mode: string;
  promptLayers: {
    brand: string;
    persona: string;
    brief: string;
    format: string;
    custom: string;
  };
  compiledPrompt: string;
  format: string;
  aspectRatio: string;
  resolution?: string;
  variationCount?: number;
  referenceImagePath?: string;
  creativeDistance?: number;
  originalBrief?: string;
  estimatedCost?: number;
}) {
  const id = nanoid();
  await db.insert(generations).values({
    id,
    status: "pending",
    ...data,
  });
  return id;
}

export async function updateGenerationStatus(
  id: string,
  status: string,
  extra?: {
    actualCost?: number;
    errorMessage?: string;
    completedAt?: string;
  }
) {
  await db
    .update(generations)
    .set({ status, ...extra })
    .where(eq(generations.id, id));
}

export async function saveGeneratedImage(data: {
  generationId: string;
  brandId?: string;
  filePath: string;
  thumbnailPath?: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  format?: string;
  personaId?: string;
  tags?: string[];
}) {
  const id = nanoid();
  await db.insert(generatedImages).values({
    id,
    status: "pending",
    ...data,
  });
  return id;
}

export async function getRecentGenerations(limit = 20) {
  return db
    .select()
    .from(generations)
    .orderBy(desc(generations.createdAt))
    .limit(limit);
}

export async function getGenerationWithImages(generationId: string) {
  const gen = await db
    .select()
    .from(generations)
    .where(eq(generations.id, generationId));
  if (!gen[0]) return null;

  const images = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.generationId, generationId));

  return { ...gen[0], images };
}

export async function getRecentImages(limit = 50) {
  return db
    .select()
    .from(generatedImages)
    .orderBy(desc(generatedImages.createdAt))
    .limit(limit);
}

export async function getBrandImages(brandId: string, limit = 100) {
  return db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.brandId, brandId))
    .orderBy(desc(generatedImages.createdAt))
    .limit(limit);
}

export async function getBrandGenerations(brandId: string, limit = 50) {
  return db
    .select()
    .from(generations)
    .where(eq(generations.brandId, brandId))
    .orderBy(desc(generations.createdAt))
    .limit(limit);
}

export async function getBrandImageStats(brandId: string) {
  const images = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.brandId, brandId));

  const total = images.length;
  const approved = images.filter((i) => i.status === "approved").length;
  const rejected = images.filter((i) => i.status === "rejected").length;
  const pending = images.filter((i) => i.status === "pending").length;

  return { total, approved, rejected, pending };
}

export async function updateImageStatus(id: string, status: string) {
  await db
    .update(generatedImages)
    .set({ status })
    .where(eq(generatedImages.id, id));
}

export async function updateImageScoreData(
  id: string,
  scoreData: {
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
) {
  await db
    .update(generatedImages)
    .set({ scoreData })
    .where(eq(generatedImages.id, id));
}

// ============================================================
// PROMPT HISTORY
// ============================================================

export async function savePromptHistory(data: {
  generationId: string;
  compiledPrompt: string;
  resultRating?: number;
}) {
  const id = nanoid();
  await db.insert(promptHistory).values({ id, ...data });
  return id;
}

export async function updatePromptRating(id: string, rating: number) {
  await db
    .update(promptHistory)
    .set({ resultRating: rating })
    .where(eq(promptHistory.id, id));
}

export async function getPromptHistoryByGeneration(generationId: string) {
  return db
    .select()
    .from(promptHistory)
    .where(eq(promptHistory.generationId, generationId))
    .orderBy(desc(promptHistory.createdAt));
}
