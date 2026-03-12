import { eq, and, isNull, or } from "drizzle-orm";
import { db } from "../index";
import { layoutInspirations } from "../schema";
import type { LayoutFamily } from "../schema";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * Get all layout inspirations for a specific layout family.
 * Returns brand-specific + global layouts.
 */
export async function getLayoutInspirations(
  layoutFamily: LayoutFamily,
  brandId?: string
): Promise<typeof layoutInspirations.$inferSelect[]> {
  const results = await db
    .select()
    .from(layoutInspirations)
    .where(eq(layoutInspirations.layoutFamily, layoutFamily));

  // Filter to brand-specific + global
  if (brandId) {
    return results.filter((r) => r.brandId === brandId || r.brandId === null);
  }

  // Return all (including global)
  return results;
}

/**
 * Get a single layout inspiration image as a Buffer.
 * Prioritizes brand-specific over global.
 */
export async function getLayoutInspirationImage(
  layoutFamily: LayoutFamily,
  brandId?: string
): Promise<Buffer | null> {
  const inspirations = await getLayoutInspirations(layoutFamily, brandId);

  if (!inspirations.length) {
    return null;
  }

  // Prioritize brand-specific
  const brandSpecific = inspirations.find((i) => i.brandId === brandId);
  const toUse = brandSpecific || inspirations[0];

  const fullPath = path.join(process.cwd(), toUse.imagePath);

  if (!existsSync(fullPath)) {
    console.warn(`[Layouts] Image not found: ${fullPath}`);
    return null;
  }

  return readFile(fullPath);
}

/**
 * Get layout inspiration metadata (without loading image).
 */
export async function getLayoutInspirationMetadata(
  layoutFamily: LayoutFamily,
  brandId?: string
): Promise<{
  gridSystem?: string;
  readingOrder?: string;
  description?: string;
} | null> {
  const inspirations = await getLayoutInspirations(layoutFamily, brandId);

  if (!inspirations.length) {
    return null;
  }

  // Prioritize brand-specific
  const brandSpecific = inspirations.find((i) => i.brandId === brandId);
  const toUse = brandSpecific || inspirations[0];

  return {
    gridSystem: toUse.gridSystem || undefined,
    readingOrder: toUse.readingOrder || undefined,
    description: toUse.description || undefined,
  };
}

/**
 * Get all layout families with their inspiration counts.
 */
export async function getLayoutFamilySummary(brandId?: string): Promise<
  Array<{
    layoutFamily: LayoutFamily;
    count: number;
    hasGlobal: boolean;
    hasBrandSpecific: boolean;
  }>
> {
  const allResults = await db.select().from(layoutInspirations);

  const families: LayoutFamily[] = [
    "left_copy_right_product",
    "center_hero_top_claim",
    "split_screen",
    "card_stack",
    "quote_frame",
    "badge_cluster",
    "vertical_story_stack",
    "diagonal_split",
    "hero_with_bottom_offer",
    "macro_with_side_copy",
  ];

  return families.map((family) => {
    const familyResults = allResults.filter((r) => r.layoutFamily === family);
    const globalCount = familyResults.filter((r) => r.brandId === null).length;
    const brandCount = brandId
      ? familyResults.filter((r) => r.brandId === brandId).length
      : 0;

    return {
      layoutFamily: family,
      count: globalCount + brandCount,
      hasGlobal: globalCount > 0,
      hasBrandSpecific: brandCount > 0,
    };
  });
}
