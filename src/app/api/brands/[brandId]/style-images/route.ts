import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { saveImage, deleteImage } from "@/lib/images/storage";
import path from "path";

/**
 * GET /api/brands/[brandId]/style-images
 * Returns the list of brand style image paths.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const brand = await db.select().from(brands).where(eq(brands.id, brandId));
  if (!brand.length) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }
  return NextResponse.json({ images: brand[0].brandStyleImages || [] });
}

/**
 * POST /api/brands/[brandId]/style-images
 * Upload a new brand style image.
 * Multipart: file (image)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await params;
    const brand = await db.select().from(brands).where(eq(brands.id, brandId));
    if (!brand.length) {
      return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `style_${nanoid(8)}${ext}`;
    const subDir = `brands/${brandId}/style`;

    const relativePath = await saveImage(buffer, subDir, fileName);

    const current = brand[0].brandStyleImages || [];
    const updated = [...current, relativePath];

    await db
      .update(brands)
      .set({ brandStyleImages: updated, daFingerprint: null })
      .where(eq(brands.id, brandId));

    return NextResponse.json({ path: relativePath, images: updated }, { status: 201 });
  } catch (error) {
    console.error("[StyleImages] POST Error:", error);
    return NextResponse.json(
      { error: `Erreur upload: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/brands/[brandId]/style-images
 * Remove a brand style image.
 * Body: { path: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await params;
    const { path: imagePath } = await request.json();

    const brand = await db.select().from(brands).where(eq(brands.id, brandId));
    if (!brand.length) {
      return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
    }

    const current = brand[0].brandStyleImages || [];
    const updated = current.filter((p: string) => p !== imagePath);

    await deleteImage(imagePath);
    await db
      .update(brands)
      .set({ brandStyleImages: updated, daFingerprint: null })
      .where(eq(brands.id, brandId));

    return NextResponse.json({ images: updated });
  } catch (error) {
    console.error("[StyleImages] DELETE Error:", error);
    return NextResponse.json(
      { error: `Erreur suppression: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
