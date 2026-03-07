import { NextRequest, NextResponse } from "next/server";
import { getGalleryByShareToken } from "@/lib/db/queries/galleries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;
    const gallery = await getGalleryByShareToken(shareToken);

    if (!gallery) {
      return NextResponse.json(
        { error: "Galerie introuvable ou expiree" },
        { status: 404 }
      );
    }

    return NextResponse.json(gallery);
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}
