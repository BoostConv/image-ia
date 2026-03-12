import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands, products, personas, marketingAngles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generatePersonaSet,
  type PersonaGenerationInput,
} from "@/lib/ai/persona-generator";
import type { MarketingAngleSpec, RichPersona, PersonaDemographics } from "@/lib/db/schema";

/**
 * POST /api/personas/generate
 *
 * Generates rich personas using AI.
 *
 * Input:
 * - brandId: string (required)
 * - productId?: string - Product to base persona on
 * - hints?: { name?, demographics?, description? }
 * - count?: number (1-5, default 1)
 *
 * Returns:
 * - personas: RichPersona[]
 * - savedIds: string[] - IDs of saved personas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, productId, hints, count = 3 } = body as {
      brandId: string;
      productId?: string;
      hints?: {
        name?: string;
        demographics?: Partial<PersonaDemographics>;
        description?: string;
      };
      count?: number;
    };

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId requis" },
        { status: 400 }
      );
    }

    // Get brand
    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId));

    const brand = brandResult[0];
    if (!brand) {
      return NextResponse.json(
        { error: "Marque introuvable" },
        { status: 404 }
      );
    }

    // Get product if specified
    let product = null;
    let angles: MarketingAngleSpec[] = [];

    if (productId) {
      const productResult = await db
        .select()
        .from(products)
        .where(eq(products.id, productId));

      product = productResult[0];

      // Get angles for this product
      if (product) {
        const anglesResult = await db
          .select()
          .from(marketingAngles)
          .where(eq(marketingAngles.productId, productId));

        if (anglesResult.length > 0) {
          const latestAngles = anglesResult[anglesResult.length - 1];
          angles = latestAngles.angles || [];
        }
      }
    }

    // Build input
    const input: PersonaGenerationInput = {
      brand: {
        name: brand.name,
        identity: brand.identiteFondamentale || undefined,
        positioning: brand.positionnementStrategique || undefined,
        targetMarket: brand.targetMarket || undefined,
      },
      product: product
        ? {
            name: product.name,
            category: product.category || undefined,
            analysis: product.productAnalysis || undefined,
            price: product.pricing ? parseFloat(product.pricing) : undefined,
          }
        : undefined,
      existingPersonaHints: hints,
      angles,
    };

    // Generate personas
    const validCount = Math.max(1, Math.min(5, count));
    const generatedPersonas = await generatePersonaSet(input, validCount);

    // Save each persona to DB
    const savedIds: string[] = [];

    for (const persona of generatedPersonas) {
      // Create persona record
      const [result] = await db.insert(personas).values({
        id: persona.id,
        brandId,
        name: persona.name,
        description: persona.tagline,
        demographics: {
          ageRange: persona.demographics.ageRange,
          gender: persona.demographics.gender,
          location: persona.demographics.location,
          income: persona.demographics.income,
          lifestyle: persona.demographics.profession,
        },
        psychographics: {
          painPoints: persona.psychographics.frustrations,
          motivations: persona.psychographics.aspirations,
          aesthetic: persona.languageProfile.preferredTone.join(", "),
        },
        richProfile: persona,
        linkedAngles: angles.map((a) => a.id),
        isGlobal: false,
        createdAt: new Date().toISOString(),
      }).returning({ id: personas.id });

      savedIds.push(result.id);
    }

    return NextResponse.json({
      personas: generatedPersonas,
      savedIds,
      count: generatedPersonas.length,
    }, { status: 201 });
  } catch (error) {
    console.error("[PersonaGenerate] Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de la generation: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
