import { NextRequest, NextResponse } from "next/server";
import {
  createGuideline,
  updateGuideline,
  deleteGuideline,
} from "@/lib/db/queries/guidelines";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, category, title, content, examples, priority } = body;

    if (!brandId || !category || !title || !content) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const id = await createGuideline({
      brandId,
      category,
      title,
      content,
      examples,
      priority,
    });

    return NextResponse.json({
      id,
      brandId,
      category,
      title,
      content,
      examples: examples || null,
      priority: priority || 0,
      isActive: true,
      source: "manual",
      performanceScore: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Guideline creation error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID requis" },
        { status: 400 }
      );
    }

    await updateGuideline(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guideline update error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID requis" },
        { status: 400 }
      );
    }

    await deleteGuideline(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guideline deletion error:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
