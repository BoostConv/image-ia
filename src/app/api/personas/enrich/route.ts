import { NextRequest, NextResponse } from "next/server";
import { enrichPersona } from "@/lib/ai/claude-creative";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, ageRange, gender, location, income, lifestyle, painPoints, motivations, aesthetic } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const result = await enrichPersona({
      name,
      description,
      ageRange,
      gender,
      location,
      income,
      lifestyle,
      painPoints,
      motivations,
      aesthetic,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Persona enrichment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enrichissement" },
      { status: 500 }
    );
  }
}
