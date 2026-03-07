import { NextRequest, NextResponse } from "next/server";
import { createGallery, getBrandGalleries } from "@/lib/db/queries/galleries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json({ error: "brandId requis" }, { status: 400 });
    }

    const galleries = await getBrandGalleries(brandId);
    return NextResponse.json(galleries);
  } catch (error) {
    console.error("Galleries fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, name, description, imageIds, brandingConfig, expiresAt } = body;

    if (!brandId || !name?.trim() || !imageIds?.length) {
      return NextResponse.json(
        { error: "brandId, nom et imageIds requis" },
        { status: 400 }
      );
    }

    const result = await createGallery({
      brandId,
      name: name.trim(),
      description,
      imageIds,
      brandingConfig,
      expiresAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gallery creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
