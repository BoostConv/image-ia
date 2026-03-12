import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateProductAnalysis,
  type ScrapedProductData,
  type ProductAnalysisInput,
} from "@/lib/ai/product-analysis-generator";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * POST /api/products/[productId]/analyze
 *
 * Generates a comprehensive product analysis using AI.
 *
 * Input:
 * - productUrl: string (required) - URL of the product page
 * - scrapedProduct?: ScrapedProductData - Pre-scraped product data
 * - reviewsText?: string - Customer reviews text (CSV/TXT content)
 * - competitorUrls?: string[] - Competitor product URLs
 * - competitorData?: ScrapedProductData[] - Pre-scraped competitor data
 *
 * Returns:
 * - analysis: ProductAnalysis
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;

    // Get product from DB
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    const product = productResult[0];
    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Get brand context
    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, product.brandId));

    const brand = brandResult[0];

    // Parse request body
    const body = await request.json();
    const {
      productUrl,
      scrapedProduct,
      reviewsText,
      competitorUrls,
      competitorData,
    } = body as {
      productUrl: string;
      scrapedProduct?: ScrapedProductData;
      reviewsText?: string;
      competitorUrls?: string[];
      competitorData?: ScrapedProductData[];
    };

    if (!productUrl) {
      return NextResponse.json(
        { error: "productUrl requis" },
        { status: 400 }
      );
    }

    // Build scraped product data from DB if not provided
    const productData: ScrapedProductData = scrapedProduct || {
      title: product.name,
      description: product.positioning || product.usp || "",
      price: product.pricing ? parseFloat(product.pricing) : undefined,
      currency: "EUR",
      features: product.benefits || [],
      category: product.category || undefined,
    };

    // Build brand context
    const brandContext = brand
      ? {
          positioning: brand.positioning || brand.positionnementStrategique?.propositionValeur || "",
          values: brand.values || brand.identiteFondamentale?.valeurs?.map((v) => v.name) || [],
          tone: brand.tonCommunication?.tonDominant || [],
          combatEnnemi: brand.identiteFondamentale?.combatEnnemi,
        }
      : undefined;

    // Generate analysis
    const input: ProductAnalysisInput = {
      productUrl,
      scrapedProduct: productData,
      reviewsText,
      competitorUrls,
      competitorData,
      brandContext,
    };

    const analysis = await generateProductAnalysis(input);

    // Save analysis to product
    await db
      .update(products)
      .set({ productAnalysis: analysis })
      .where(eq(products.id, productId));

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error("[ProductAnalyze] Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de l'analyse: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/[productId]/analyze
 *
 * Returns the existing product analysis if available.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;

    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    const product = productResult[0];
    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable" },
        { status: 404 }
      );
    }

    if (!product.productAnalysis) {
      return NextResponse.json(
        { error: "Analyse produit non disponible", hasAnalysis: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      analysis: product.productAnalysis,
      hasAnalysis: true,
    });
  } catch (error) {
    console.error("[ProductAnalyze] GET Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
