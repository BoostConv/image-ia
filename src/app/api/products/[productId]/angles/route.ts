import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { products, brands, personas, marketingAngles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateMarketingAngles,
  type AnglesGenerationInput,
} from "@/lib/ai/marketing-angles-generator";
import type { RichPersona } from "@/lib/db/schema";

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * POST /api/products/[productId]/angles
 *
 * Generates marketing angles using the EPIC framework.
 *
 * Input:
 * - personaIds?: string[] - Specific persona IDs to target (optional)
 * - competitorAngles?: string[] - Competitor angles to differentiate from
 *
 * Returns:
 * - angles: AnglesPrioritization
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

    // Get brand
    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, product.brandId));

    const brand = brandResult[0];
    if (!brand) {
      return NextResponse.json(
        { error: "Marque introuvable" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { personaIds, competitorAngles } = body as {
      personaIds?: string[];
      competitorAngles?: string[];
    };

    // Get personas (filtered by IDs if provided)
    let personaList: RichPersona[] = [];

    const allPersonas = await db
      .select()
      .from(personas)
      .where(eq(personas.brandId, product.brandId));

    if (personaIds?.length) {
      // Filter to specified personas
      personaList = allPersonas
        .filter((p) => personaIds.includes(p.id))
        .map((p) => p.richProfile)
        .filter((p): p is RichPersona => p !== null);
    } else {
      // Use all brand personas with rich profiles
      personaList = allPersonas
        .map((p) => p.richProfile)
        .filter((p): p is RichPersona => p !== null);
    }

    // Build input
    const input: AnglesGenerationInput = {
      brand: {
        name: brand.name,
        identity: brand.identiteFondamentale || undefined,
        positioning: brand.positionnementStrategique || undefined,
        tone: brand.tonCommunication || undefined,
      },
      product: {
        id: product.id,
        name: product.name,
        price: product.pricing ? parseFloat(product.pricing) : undefined,
        analysis: product.productAnalysis || undefined,
        category: product.category || undefined,
      },
      personas: personaList,
      competitorAngles,
    };

    // Generate angles
    const anglesResult = await generateMarketingAngles(input);

    // Save to marketing_angles table
    const anglesId = nanoid();
    await db.insert(marketingAngles).values({
      id: anglesId,
      productId: product.id,
      brandId: product.brandId,
      angles: anglesResult.angles,
      prioritization: anglesResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id: anglesId,
      angles: anglesResult,
    }, { status: 200 });
  } catch (error) {
    console.error("[ProductAngles] Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de la generation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/[productId]/angles
 *
 * Returns existing marketing angles for a product.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;

    // Get existing angles
    const anglesResult = await db
      .select()
      .from(marketingAngles)
      .where(eq(marketingAngles.productId, productId))
      .orderBy(marketingAngles.createdAt);

    if (!anglesResult.length) {
      return NextResponse.json(
        { error: "Aucun angle marketing trouve", hasAngles: false },
        { status: 404 }
      );
    }

    // Return most recent
    const latest = anglesResult[anglesResult.length - 1];

    return NextResponse.json({
      id: latest.id,
      angles: latest.prioritization,
      hasAngles: true,
      allVersions: anglesResult.map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        anglesCount: a.angles?.length || 0,
      })),
    });
  } catch (error) {
    console.error("[ProductAngles] GET Error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
