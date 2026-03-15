import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params;

  const result = await db
    .select({ brandStylePolicy: brands.brandStylePolicy })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!result[0]) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json(result[0].brandStylePolicy || {});
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const body = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    await db
      .update(brands)
      .set({ brandStylePolicy: body, updatedAt: new Date().toISOString() })
      .where(eq(brands.id, brandId));

    return NextResponse.json(body);
  } catch (error) {
    console.error("Brand style policy update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du style policy" },
      { status: 500 }
    );
  }
}
