import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import type { BrandRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params;

  const result = await db
    .select({ brandRules: brands.brandRules })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!result[0]) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json(result[0].brandRules || { rules: [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const body = (await request.json()) as BrandRules;

    if (!body.rules || !Array.isArray(body.rules)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    await db
      .update(brands)
      .set({ brandRules: body, updatedAt: new Date().toISOString() })
      .where(eq(brands.id, brandId));

    return NextResponse.json(body);
  } catch (error) {
    console.error("Brand rules update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des règles" },
      { status: 500 }
    );
  }
}
