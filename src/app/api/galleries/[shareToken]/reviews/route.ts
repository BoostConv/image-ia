import { NextRequest, NextResponse } from "next/server";
import { createClientReview, getGalleryReviews } from "@/lib/db/queries/galleries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    // We need gallery ID from shareToken - reuse the query
    const { getGalleryByShareToken } = await import("@/lib/db/queries/galleries");
    const gallery = await getGalleryByShareToken(shareToken);
    if (!gallery) {
      return NextResponse.json({ error: "Galerie introuvable" }, { status: 404 });
    }

    const reviews = await getGalleryReviews(gallery.id);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Gallery reviews fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const { getGalleryByShareToken } = await import("@/lib/db/queries/galleries");
    const gallery = await getGalleryByShareToken(shareToken);
    if (!gallery) {
      return NextResponse.json({ error: "Galerie introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const { imageId, verdict, comment } = body;

    if (!imageId || !verdict) {
      return NextResponse.json(
        { error: "imageId et verdict requis" },
        { status: 400 }
      );
    }

    const reviewId = await createClientReview({
      imageId,
      galleryId: gallery.id,
      verdict,
      comment,
    });

    return NextResponse.json({ id: reviewId });
  } catch (error) {
    console.error("Gallery review creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
