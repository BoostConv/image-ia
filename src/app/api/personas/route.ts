import { NextRequest, NextResponse } from "next/server";
import { createPersona, updatePersona, deletePersona } from "@/lib/db/queries/brands";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      name,
      description,
      demographics,
      psychographics,
      visualStyle,
      promptModifiers,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nom requis" },
        { status: 400 }
      );
    }

    const id = await createPersona({
      brandId: brandId || undefined,
      name,
      description,
      demographics,
      psychographics,
      visualStyle,
      promptModifiers,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Persona creation error:", error);
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
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await updatePersona(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Persona update error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deletePersona(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Persona delete error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
