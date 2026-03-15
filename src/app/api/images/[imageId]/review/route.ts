import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, generatedImages } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { learnFromRejection } from "@/lib/ai/rejection-learner";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    const imageReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.imageId, imageId))
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json(imageReviews);
  } catch (error) {
    console.error("Image reviews fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const body = await request.json();
    const { verdict, comment, reviewerType = "consultant" } = body;

    if (!verdict) {
      return NextResponse.json(
        { error: "verdict requis" },
        { status: 400 }
      );
    }

    const id = nanoid();
    await db.insert(reviews).values({
      id,
      imageId,
      reviewerType,
      verdict,
      comment: comment || null,
    });

    // Update image status (variant doesn't change status)
    if (verdict !== "variant") {
      const statusMap: Record<string, string> = {
        approved: "approved",
        rejected: "rejected",
        revision: "pending",
      };
      const newStatus = statusMap[verdict] || "pending";
      await db
        .update(generatedImages)
        .set({ status: newStatus })
        .where(eq(generatedImages.id, imageId));
    }

    // Auto-learn from rejections: extract brand rules from rejection comments
    if (verdict === "rejected" && comment) {
      // Get brandId from the image
      const image = await db
        .select({ brandId: generatedImages.brandId })
        .from(generatedImages)
        .where(eq(generatedImages.id, imageId))
        .limit(1);

      if (image[0]?.brandId) {
        // Fire and forget — don't block the response
        learnFromRejection({
          brandId: image[0].brandId,
          comment,
          imageId,
        }).catch((err) => console.error("[ReviewAPI] learnFromRejection error:", err));
      }
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Image review creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
