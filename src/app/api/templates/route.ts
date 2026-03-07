import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json({ error: "brandId requis" }, { status: 400 });
    }

    const templates = await db
      .select()
      .from(campaignTemplates)
      .where(eq(campaignTemplates.brandId, brandId))
      .orderBy(desc(campaignTemplates.createdAt));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, name, description, productId, personaId, format, aspectRatio, brief, batchCount } = body;

    if (!brandId || !name?.trim()) {
      return NextResponse.json(
        { error: "brandId et nom requis" },
        { status: 400 }
      );
    }

    const id = nanoid();
    await db.insert(campaignTemplates).values({
      id,
      brandId,
      name: name.trim(),
      description: description || null,
      productId: productId || null,
      personaId: personaId || null,
      format: format || null,
      aspectRatio: aspectRatio || null,
      brief: brief || null,
      batchCount: batchCount || 5,
    });

    return NextResponse.json({ id, name: name.trim() });
  } catch (error) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    await db.delete(campaignTemplates).where(eq(campaignTemplates.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
