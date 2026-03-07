import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, generatedImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { updateImageStatus } from "@/lib/db/queries/generations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, verdict, comment, rating, reviewerType = "consultant" } = body;

    if (!imageId || !verdict) {
      return NextResponse.json(
        { error: "imageId et verdict requis" },
        { status: 400 }
      );
    }

    const id = nanoid();
    await db.insert(reviews).values({
      id,
      imageId,
      verdict,
      comment: comment || undefined,
      reviewerType,
    });

    // Update image status
    const statusMap: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      revision: "pending",
    };
    await updateImageStatus(imageId, statusMap[verdict] || "pending");

    // Update preference score if rating provided
    if (rating) {
      await db
        .update(generatedImages)
        .set({ preferenceScore: rating })
        .where(eq(generatedImages.id, imageId));
    }

    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId requis" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(reviews)
      .where(eq(reviews.imageId, imageId));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
