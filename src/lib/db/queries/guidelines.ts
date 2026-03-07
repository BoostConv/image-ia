import { eq, and, desc } from "drizzle-orm";
import { db } from "../index";
import { guidelines, adKnowledge } from "../schema";
import { nanoid } from "nanoid";

// ============================================================
// GUIDELINES CRUD
// ============================================================

export async function getBrandGuidelines(brandId: string) {
  return db
    .select()
    .from(guidelines)
    .where(eq(guidelines.brandId, brandId))
    .orderBy(desc(guidelines.priority));
}

export async function getActiveGuidelines(brandId: string) {
  return db
    .select()
    .from(guidelines)
    .where(
      and(eq(guidelines.brandId, brandId), eq(guidelines.isActive, true))
    )
    .orderBy(desc(guidelines.priority));
}

export async function createGuideline(data: {
  brandId: string;
  category: string;
  title: string;
  content: string;
  examples?: string[];
  priority?: number;
  source?: string;
}) {
  const id = nanoid();
  await db.insert(guidelines).values({ id, ...data });
  return id;
}

export async function updateGuideline(
  id: string,
  data: Partial<{
    category: string;
    title: string;
    content: string;
    examples: string[];
    priority: number;
    isActive: boolean;
    performanceScore: number;
  }>
) {
  await db
    .update(guidelines)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(guidelines.id, id));
}

export async function deleteGuideline(id: string) {
  await db.delete(guidelines).where(eq(guidelines.id, id));
}

// ============================================================
// AD KNOWLEDGE (LEARNING)
// ============================================================

export async function getBrandKnowledge(brandId: string) {
  return db
    .select()
    .from(adKnowledge)
    .where(eq(adKnowledge.brandId, brandId))
    .orderBy(desc(adKnowledge.confidence));
}

export async function createKnowledge(data: {
  brandId: string;
  category: string;
  insight: string;
  confidence?: number;
  relatedPromptElements?: string[];
}) {
  const id = nanoid();
  await db.insert(adKnowledge).values({ id, ...data });
  return id;
}

export async function updateKnowledge(
  id: string,
  data: Partial<{
    insight: string;
    confidence: number;
    basedOnApproved: number;
    basedOnRejected: number;
    relatedPromptElements: string[];
  }>
) {
  await db
    .update(adKnowledge)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(adKnowledge.id, id));
}

// ============================================================
// COMPILE GUIDELINES INTO PROMPT LAYER
// ============================================================

export async function compileGuidelinesPrompt(brandId: string): Promise<string> {
  const active = await getActiveGuidelines(brandId);
  if (active.length === 0) return "";

  const grouped: Record<string, typeof active> = {};
  for (const g of active) {
    if (!grouped[g.category]) grouped[g.category] = [];
    grouped[g.category].push(g);
  }

  const categoryLabels: Record<string, string> = {
    composition: "COMPOSITION & CADRAGE",
    color: "COULEURS & PALETTE",
    copy: "TEXTE & ACCROCHE",
    platform: "REGLES PLATEFORME",
    performance: "PERFORMANCE PUBLICITAIRE",
    brand_rules: "REGLES DE MARQUE",
    ad_psychology: "PSYCHOLOGIE PUBLICITAIRE",
  };

  const sections = Object.entries(grouped).map(([cat, rules]) => {
    const label = categoryLabels[cat] || cat.toUpperCase();
    const ruleLines = rules.map((r) => `- ${r.content}`).join("\n");
    return `[${label}]\n${ruleLines}`;
  });

  return sections.join("\n\n");
}
