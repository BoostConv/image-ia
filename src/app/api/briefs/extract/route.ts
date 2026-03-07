import { NextRequest, NextResponse } from "next/server";
import { extractBriefConstraints } from "@/lib/ai/claude-creative";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawBrief } = body;

    if (!rawBrief?.trim()) {
      return NextResponse.json({ error: "Brief requis" }, { status: 400 });
    }

    const constraints = await extractBriefConstraints(rawBrief);
    return NextResponse.json(constraints);
  } catch (error) {
    console.error("Brief extraction error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction" },
      { status: 500 }
    );
  }
}
