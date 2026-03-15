import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../index";
import { reviews, generatedImages, galleries, brands } from "../schema";

export interface RevisionRequest {
  id: string;
  imageId: string;
  galleryId: string | null;
  comment: string | null;
  createdAt: string;
  // Joined fields
  imagePath: string;
  brandId: string | null;
  brandName: string | null;
  brandLogoPath: string | null;
  galleryName: string | null;
  status: "pending" | "in_progress" | "completed";
  appliedToGenerationId: string | null;
}

export async function getPendingRevisions(): Promise<RevisionRequest[]> {
  const results = await db
    .select({
      id: reviews.id,
      imageId: reviews.imageId,
      galleryId: reviews.galleryId,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      appliedToGenerationId: reviews.appliedToGenerationId,
      imagePath: generatedImages.filePath,
      brandId: generatedImages.brandId,
      brandName: brands.name,
      brandLogoPath: brands.logoPath,
      galleryName: galleries.name,
    })
    .from(reviews)
    .innerJoin(generatedImages, eq(reviews.imageId, generatedImages.id))
    .leftJoin(galleries, eq(reviews.galleryId, galleries.id))
    .leftJoin(brands, eq(generatedImages.brandId, brands.id))
    .where(
      and(
        eq(reviews.verdict, "revision"),
        eq(reviews.reviewerType, "client")
      )
    )
    .orderBy(desc(reviews.createdAt));

  return results.map((r) => ({
    ...r,
    status: r.appliedToGenerationId
      ? "completed" as const
      : "pending" as const,
  }));
}

export async function getPendingRevisionCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(
      and(
        eq(reviews.verdict, "revision"),
        eq(reviews.reviewerType, "client"),
        sql`${reviews.appliedToGenerationId} IS NULL`
      )
    );
  return Number(result[0]?.count ?? 0);
}

export async function markRevisionApplied(
  reviewId: string,
  newGenerationId: string
) {
  await db
    .update(reviews)
    .set({ appliedToGenerationId: newGenerationId })
    .where(eq(reviews.id, reviewId));
}
