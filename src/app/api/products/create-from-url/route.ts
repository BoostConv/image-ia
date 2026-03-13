import { NextRequest, NextResponse } from "next/server";
import { scrapeProductPage } from "@/lib/scraper/product-page";
import { createProduct } from "@/lib/db/queries/brands";
import { saveImage } from "@/lib/images/storage";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { products, brands, type ProductVariant } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateProductAnalysis,
  type ScrapedProductData,
  type ProductAnalysisInput,
} from "@/lib/ai/product-analysis-generator";

/**
 * POST /api/products/create-from-url
 *
 * Single endpoint: scrape URL → create product → AI analysis.
 * Replaces the old 3-step flow (scrape → manual create → analyze).
 *
 * Input: { url: string, brandId: string }
 * Returns: complete product with analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { url, brandId } = await request.json();

    if (!url || !brandId) {
      return NextResponse.json(
        { error: "URL et brandId requis" },
        { status: 400 }
      );
    }

    // ─── Step 1: Scrape the page ─────────────────────────────
    const rawData = await scrapeProductPage(url);

    if (!rawData.title) {
      return NextResponse.json(
        { error: "Impossible d'extraire le titre du produit depuis cette URL" },
        { status: 422 }
      );
    }

    // ─── Step 2: Download and save images ────────────────────
    const savedImages: string[] = [];
    if (rawData.images && rawData.images.length > 0) {
      const imagesToDownload = rawData.images.slice(0, 5);
      for (const imgUrl of imagesToDownload) {
        try {
          const imgRes = await fetch(imgUrl, {
            signal: AbortSignal.timeout(10000),
          });
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            const ext = contentType.includes("png")
              ? "png"
              : contentType.includes("webp")
                ? "webp"
                : "jpg";
            const fileName = `scraped_${nanoid(8)}.${ext}`;
            const subDir = `brands/${brandId}/products`;
            const relativePath = await saveImage(buffer, subDir, fileName);
            savedImages.push(relativePath);
          }
        } catch {
          // Skip failed image downloads
        }
      }
    }

    // ─── Step 3: Download variant images ────────────────────
    const savedVariants: ProductVariant[] = [];
    if (rawData.variants && rawData.variants.length > 0) {
      for (const variant of rawData.variants) {
        const variantImagePaths: string[] = [];
        for (const imgUrl of variant.images.slice(0, 5)) {
          try {
            const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(10000) });
            if (imgRes.ok) {
              const buffer = Buffer.from(await imgRes.arrayBuffer());
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
              const fileName = `variant_${nanoid(8)}.${ext}`;
              const subDir = `brands/${brandId}/products`;
              const relativePath = await saveImage(buffer, subDir, fileName);
              variantImagePaths.push(relativePath);
            }
          } catch {
            // Skip failed downloads
          }
        }
        savedVariants.push({
          id: nanoid(10),
          name: variant.name,
          type: variant.type,
          imagePaths: variantImagePaths,
        });
      }
    }

    // ─── Step 4: Create product in DB ────────────────────────
    const productName = rawData.title || "Produit sans nom";
    const productId = await createProduct({
      brandId,
      name: productName,
      category: undefined,
      usp: rawData.description || undefined,
      benefits: rawData.bulletPoints || [],
      positioning: undefined,
    });

    // Save images and variants to product
    const productUpdates: Record<string, unknown> = {};
    if (savedImages.length > 0) productUpdates.imagePaths = savedImages;
    if (savedVariants.length > 0) productUpdates.variants = savedVariants;

    if (Object.keys(productUpdates).length > 0) {
      await db
        .update(products)
        .set(productUpdates)
        .where(eq(products.id, productId));
    }

    // ─── Step 4: AI Analysis ─────────────────────────────────
    // Get brand context for richer analysis
    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId));
    const brand = brandResult[0];

    const scrapedProduct: ScrapedProductData = {
      title: productName,
      description: rawData.description || rawData.fullText?.slice(0, 2000) || "",
      features: rawData.bulletPoints || [],
    };

    const brandContext = brand
      ? {
          positioning: brand.positioning || (brand.positionnementStrategique as any)?.propositionValeur || "",
          values: brand.values || (brand.identiteFondamentale as any)?.valeurs?.map((v: any) => v.name) || [],
          tone: (brand.tonCommunication as any)?.tonDominant || [],
          combatEnnemi: (brand.identiteFondamentale as any)?.combatEnnemi,
        }
      : undefined;

    const analysisInput: ProductAnalysisInput = {
      productUrl: url,
      scrapedProduct,
      brandContext,
    };

    let analysis = null;
    try {
      analysis = await generateProductAnalysis(analysisInput);

      // Save analysis to product
      await db
        .update(products)
        .set({ productAnalysis: analysis })
        .where(eq(products.id, productId));
    } catch (analysisError) {
      console.error("[CreateFromURL] Analysis failed (product still created):", analysisError);
      // Product is created even if analysis fails — user can retry analysis later
    }

    // ─── Build response ──────────────────────────────────────
    const product = {
      id: productId,
      name: productName,
      category: null,
      usp: rawData.description || null,
      benefits: rawData.bulletPoints || [],
      positioning: null,
      imagePaths: savedImages.length > 0 ? savedImages : null,
      variants: savedVariants.length > 0 ? savedVariants : null,
      marketingArguments: null,
      targetAudience: null,
      competitiveAdvantage: null,
      productAnalysis: analysis,
    };

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[CreateFromURL] Error:", error);
    return NextResponse.json(
      { error: `Erreur: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
