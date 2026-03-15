import { NextRequest, NextResponse } from "next/server";
import {
  getAllBrands,
  createBrand,
  createProduct,
  createPersona,
  deleteBrand,
} from "@/lib/db/queries/brands";
import { db } from "@/lib/db";
import { brands as brandsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const allBrands = await getAllBrands();
  return NextResponse.json(allBrands);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      websiteUrl,
      colorPalette,
      typography,
      product,
      persona,
      // V1 Brief fields
      mission,
      vision,
      positioning,
      tone,
      values,
      targetMarket,
      identiteFondamentale,
      positionnementStrategique,
      tonCommunication,
      briefMetadata,
      briefStatus,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Le nom de la marque est requis" },
        { status: 400 }
      );
    }

    const brandId = await createBrand({
      name,
      description: description || undefined,
      websiteUrl: websiteUrl || undefined,
      colorPalette: colorPalette || undefined,
      typography: typography || undefined,
      // V1 Brief fields
      mission: mission || undefined,
      vision: vision || undefined,
      positioning: positioning || undefined,
      tone: tone || undefined,
      values: values || undefined,
      targetMarket: targetMarket || undefined,
      identiteFondamentale: identiteFondamentale || undefined,
      positionnementStrategique: positionnementStrategique || undefined,
      tonCommunication: tonCommunication || undefined,
      briefMetadata: briefMetadata || undefined,
      briefStatus: briefStatus || undefined,
    });

    // Create product if provided
    if (product?.name) {
      await createProduct({
        brandId,
        name: product.name,
        category: product.category,
        usp: product.usp,
        benefits: product.benefits,
        positioning: product.positioning,
      });
    }

    // Create persona if provided
    if (persona?.name) {
      await createPersona({
        brandId,
        name: persona.name,
        description: persona.description,
        demographics: persona.demographics,
        visualStyle: persona.visualStyle,
      });
    }

    return NextResponse.json({ id: brandId }, { status: 201 });
  } catch (error) {
    console.error("Brand creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la marque" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }
    await deleteBrand(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand deletion error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la marque" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      websiteUrl,
      colorPalette,
      typography,
      mission,
      vision,
      positioning,
      tone,
      values,
      targetMarket,
      // V1 Brief fields
      identiteFondamentale,
      positionnementStrategique,
      tonCommunication,
      briefMetadata,
      briefStatus,
      // Auto-analyze sources
      instagramHandle,
      facebookPageUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;
    if (colorPalette !== undefined) updates.colorPalette = colorPalette;
    if (typography !== undefined) updates.typography = typography;
    if (mission !== undefined) updates.mission = mission;
    if (vision !== undefined) updates.vision = vision;
    if (positioning !== undefined) updates.positioning = positioning;
    if (tone !== undefined) updates.tone = tone;
    if (values !== undefined) updates.values = values;
    if (targetMarket !== undefined) updates.targetMarket = targetMarket;
    // V1 Brief fields
    if (identiteFondamentale !== undefined) updates.identiteFondamentale = identiteFondamentale;
    if (positionnementStrategique !== undefined) updates.positionnementStrategique = positionnementStrategique;
    if (tonCommunication !== undefined) updates.tonCommunication = tonCommunication;
    if (briefMetadata !== undefined) updates.briefMetadata = briefMetadata;
    if (briefStatus !== undefined) updates.briefStatus = briefStatus;
    if (instagramHandle !== undefined) updates.instagramHandle = instagramHandle;
    if (facebookPageUrl !== undefined) updates.facebookPageUrl = facebookPageUrl;

    await db.update(brandsTable).set(updates).where(eq(brandsTable.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Brand update error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
