import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import { brandDocuments, inspirationAds } from "../schema";
import { nanoid } from "nanoid";

// ============================================================
// BRAND DOCUMENTS
// ============================================================

export async function getBrandDocuments(brandId: string) {
  return db
    .select()
    .from(brandDocuments)
    .where(eq(brandDocuments.brandId, brandId))
    .orderBy(desc(brandDocuments.createdAt));
}

export async function createBrandDocument(data: {
  brandId: string;
  name: string;
  type: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes?: number;
  extractedText?: string;
  summary?: string;
  keyInsights?: string[];
}) {
  const id = nanoid();
  await db.insert(brandDocuments).values({ id, ...data });
  return id;
}

export async function updateDocumentInsights(
  id: string,
  data: { extractedText?: string; summary?: string; keyInsights?: string[] }
) {
  await db.update(brandDocuments).set(data).where(eq(brandDocuments.id, id));
}

export async function deleteDocument(id: string) {
  await db.delete(brandDocuments).where(eq(brandDocuments.id, id));
}

// ============================================================
// INSPIRATION ADS
// ============================================================

export async function getBrandInspirationAds(brandId: string) {
  return db
    .select()
    .from(inspirationAds)
    .where(eq(inspirationAds.brandId, brandId))
    .orderBy(desc(inspirationAds.createdAt));
}

export async function createInspirationAd(data: {
  brandId: string;
  name?: string;
  source?: string;
  competitorName?: string;
  filePath: string;
  mimeType: string;
  analysis?: string;
  tags?: string[];
  rating?: number;
  notes?: string;
}) {
  const id = nanoid();
  await db.insert(inspirationAds).values({ id, ...data });
  return id;
}

export async function updateInspirationAd(
  id: string,
  data: Partial<{
    name: string;
    analysis: string;
    tags: string[];
    rating: number;
    notes: string;
  }>
) {
  await db.update(inspirationAds).set(data).where(eq(inspirationAds.id, id));
}

export async function deleteInspirationAd(id: string) {
  await db.delete(inspirationAds).where(eq(inspirationAds.id, id));
}

// ============================================================
// COMPILE INSPIRATION CONTEXT FOR PROMPT
// ============================================================

export async function compileDocumentsPrompt(brandId: string): Promise<string> {
  const docs = await getBrandDocuments(brandId);
  const withContent = docs.filter((d) => d.summary || d.extractedText);
  if (withContent.length === 0) return "";

  const sections = withContent
    .map((d) => {
      const parts: string[] = [`- ${d.name} (${d.type})`];
      if (d.summary) parts.push(`  Resume: ${d.summary}`);
      if (d.keyInsights && d.keyInsights.length > 0) {
        parts.push(`  Points cles: ${d.keyInsights.join("; ")}`);
      }
      return parts.join("\n");
    })
    .join("\n");

  return `[DOCUMENTS DE MARQUE]\nInformations extraites des documents officiels de la marque :\n${sections}`;
}

export async function compileInspirationPrompt(brandId: string): Promise<string> {
  const ads = await getBrandInspirationAds(brandId);
  const analyzed = ads.filter((a) => a.analysis);
  if (analyzed.length === 0) return "";

  const insights = analyzed
    .map((a) => {
      const source = a.source === "competitor" && a.competitorName
        ? `(concurrent: ${a.competitorName})`
        : a.source === "brand"
          ? "(marque)"
          : "";
      return `- ${a.analysis} ${source}`;
    })
    .join("\n");

  return `[INSPIRATIONS PUBLICITAIRES]\nVoici les patterns visuels qui fonctionnent pour cette marque et son marche :\n${insights}`;
}
