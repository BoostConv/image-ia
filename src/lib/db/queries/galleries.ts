import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import { galleries, generatedImages, reviews } from "../schema";
import { nanoid } from "nanoid";

export async function createGallery(data: {
  brandId: string;
  name: string;
  description?: string;
  imageIds: string[];
  brandingConfig?: {
    logoPath?: string;
    primaryColor?: string;
    headerText?: string;
  };
  expiresAt?: string;
}) {
  const id = nanoid();
  const shareToken = nanoid(12);

  await db.insert(galleries).values({
    id,
    brandId: data.brandId,
    name: data.name,
    description: data.description || null,
    shareToken,
    brandingConfig: data.brandingConfig || null,
    expiresAt: data.expiresAt || null,
  });

  // Link images to gallery
  for (const imageId of data.imageIds) {
    await db
      .update(generatedImages)
      .set({ galleryId: id })
      .where(eq(generatedImages.id, imageId));
  }

  return { id, shareToken };
}

export async function getGalleryByShareToken(shareToken: string) {
  const result = await db
    .select()
    .from(galleries)
    .where(eq(galleries.shareToken, shareToken))
    .limit(1);

  if (!result[0]) return null;

  const gallery = result[0];

  // Check expiration
  if (gallery.expiresAt && new Date(gallery.expiresAt) < new Date()) {
    return null;
  }

  if (!gallery.isActive) return null;

  // Increment view count
  await db
    .update(galleries)
    .set({ viewCount: (gallery.viewCount || 0) + 1 })
    .where(eq(galleries.id, gallery.id));

  // Get images
  const images = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.galleryId, gallery.id))
    .orderBy(desc(generatedImages.createdAt));

  return { ...gallery, images };
}

export async function getBrandGalleries(brandId: string) {
  return db
    .select()
    .from(galleries)
    .where(eq(galleries.brandId, brandId))
    .orderBy(desc(galleries.createdAt));
}

export async function createClientReview(data: {
  imageId: string;
  galleryId?: string;
  verdict: string;
  comment?: string;
  reviewerName?: string;
  reviewerEmail?: string;
}) {
  const id = nanoid();
  await db.insert(reviews).values({
    id,
    imageId: data.imageId,
    galleryId: data.galleryId || null,
    reviewerType: "client",
    verdict: data.verdict,
    comment: data.comment || null,
    reviewerName: data.reviewerName || null,
    reviewerEmail: data.reviewerEmail || null,
  });

  // Update image status — variant doesn't change status
  if (data.verdict !== "variant") {
    const statusMap: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      revision: "pending",
    };
    const newStatus = statusMap[data.verdict] || "pending";
    await db
      .update(generatedImages)
      .set({ status: newStatus })
      .where(eq(generatedImages.id, data.imageId));
  }

  return id;
}

export async function getGalleryReviews(galleryId: string) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.galleryId, galleryId))
    .orderBy(desc(reviews.createdAt));
}

export async function getBrandGalleriesWithDetails(brandId: string) {
  const galleriesList = await db
    .select()
    .from(galleries)
    .where(eq(galleries.brandId, brandId))
    .orderBy(desc(galleries.createdAt));

  return Promise.all(
    galleriesList.map(async (gallery) => {
      const images = await db
        .select({
          id: generatedImages.id,
          filePath: generatedImages.filePath,
          status: generatedImages.status,
          format: generatedImages.format,
        })
        .from(generatedImages)
        .where(eq(generatedImages.galleryId, gallery.id));

      const galleryReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.galleryId, gallery.id))
        .orderBy(desc(reviews.createdAt));

      return { ...gallery, images, reviews: galleryReviews };
    })
  );
}
