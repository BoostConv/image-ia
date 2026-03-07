import { eq } from "drizzle-orm";
import { db } from "../index";
import { brands, products, personas } from "../schema";
import { nanoid } from "nanoid";

export async function getAllBrands() {
  return db.select().from(brands).orderBy(brands.createdAt);
}

export async function getBrandById(id: string) {
  const result = await db.select().from(brands).where(eq(brands.id, id));
  return result[0] || null;
}

export async function createBrand(data: {
  name: string;
  description?: string;
  logoPath?: string;
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  };
  typography?: {
    headingFont: string;
    bodyFont: string;
    accentFont?: string;
  };
  moodboardPaths?: string[];
  styleGuideText?: string;
  websiteUrl?: string;
}) {
  const id = nanoid();
  await db.insert(brands).values({ id, ...data });
  return id;
}

export async function updateBrand(
  id: string,
  data: Partial<typeof brands.$inferInsert>
) {
  await db
    .update(brands)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(brands.id, id));
}

export async function deleteBrand(id: string) {
  await db.delete(brands).where(eq(brands.id, id));
}

export async function getBrandProducts(brandId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.brandId, brandId))
    .orderBy(products.createdAt);
}

export async function createProduct(data: {
  brandId: string;
  name: string;
  category?: string;
  usp?: string;
  benefits?: string[];
  objections?: string[];
  pricing?: string;
  positioning?: string;
  season?: string;
  usageContext?: string;
}) {
  const id = nanoid();
  await db.insert(products).values({ id, ...data });
  return id;
}

export async function getProductById(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] || null;
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}

export async function getBrandPersonas(brandId: string) {
  return db
    .select()
    .from(personas)
    .where(eq(personas.brandId, brandId))
    .orderBy(personas.createdAt);
}

export async function getGlobalPersonas() {
  return db
    .select()
    .from(personas)
    .where(eq(personas.isGlobal, true))
    .orderBy(personas.createdAt);
}

export async function createPersona(data: {
  brandId?: string;
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
    modelType?: string;
    decorStyle?: string;
  };
  promptModifiers?: string;
  isGlobal?: boolean;
}) {
  const id = nanoid();
  await db.insert(personas).values({ id, ...data });
  return id;
}

export async function getPersonaById(id: string) {
  const result = await db.select().from(personas).where(eq(personas.id, id));
  return result[0] || null;
}

export async function updatePersona(
  id: string,
  data: Partial<typeof personas.$inferInsert>
) {
  await db.update(personas).set(data).where(eq(personas.id, id));
}

export async function deletePersona(id: string) {
  await db.delete(personas).where(eq(personas.id, id));
}
