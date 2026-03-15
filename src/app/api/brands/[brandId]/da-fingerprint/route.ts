import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readImage } from "@/lib/images/storage";
import { analyzeBrandDA } from "@/lib/engine/brand-da-analyzer";
import type { BrandDAFingerprint } from "@/lib/engine/brand-da-analyzer";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 4_500_000;

async function resizeIfNeeded(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_IMAGE_BYTES) return buffer;
  let quality = 80;
  let width = 1200;
  let result = buffer;
  while (result.length > MAX_IMAGE_BYTES && width >= 400) {
    result = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    width -= 200;
    quality -= 10;
  }
  return result;
}

/**
 * GET /api/brands/[brandId]/da-fingerprint
 * Returns the persisted DA fingerprint (or null).
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
  return NextResponse.json({
    fingerprint: brand[0].daFingerprint || null,
    imageCount: (brand[0].brandStyleImages || []).length,
  });
}

/**
 * POST /api/brands/[brandId]/da-fingerprint
 * Run Claude Vision analysis on brand style images.
 * Generates and persists a BrandDAFingerprint.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await params;
    const brand = await db.select().from(brands).where(eq(brands.id, brandId));
    if (!brand.length) {
      return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
    }

    const stylePaths = brand[0].brandStyleImages || [];
    if (stylePaths.length === 0) {
      return NextResponse.json(
        { error: "Aucun visuel de reference. Uploadez des images d'abord." },
        { status: 400 },
      );
    }

    // Load and resize images
    const imageBuffers: Buffer[] = [];
    for (const p of stylePaths.slice(0, 8)) {
      const buf = await readImage(p);
      if (buf) {
        const resized = await resizeIfNeeded(buf);
        imageBuffers.push(resized);
      }
    }

    if (imageBuffers.length === 0) {
      return NextResponse.json(
        { error: "Aucune image lisible sur le disque." },
        { status: 400 },
      );
    }

    const fingerprint = await analyzeBrandDA(imageBuffers, brand[0].name);

    await db
      .update(brands)
      .set({ daFingerprint: fingerprint as unknown as Record<string, unknown> })
      .where(eq(brands.id, brandId));

    return NextResponse.json({ fingerprint });
  } catch (error) {
    console.error("[DAFingerprint] Analyze Error:", error);
    return NextResponse.json(
      { error: `Erreur analyse DA: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/brands/[brandId]/da-fingerprint
 * Manually update the DA fingerprint.
 * Body: { fingerprint: BrandDAFingerprint }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
    const { brandId } = await params;
    const { fingerprint } = await request.json();

    if (!fingerprint) {
      return NextResponse.json({ error: "fingerprint requis" }, { status: 400 });
    }

    const brand = await db.select().from(brands).where(eq(brands.id, brandId));
    if (!brand.length) {
      return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
    }

    await db
      .update(brands)
      .set({ daFingerprint: fingerprint })
      .where(eq(brands.id, brandId));

    return NextResponse.json({ success: true, fingerprint });
  } catch (error) {
    console.error("[DAFingerprint] PATCH Error:", error);
    return NextResponse.json(
      { error: `Erreur sauvegarde: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
