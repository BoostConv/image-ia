import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layoutInspirations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { analyzeLayoutScreenshot } from "@/lib/engine/layout-analyzer";

/**
 * POST /api/layout-inspirations/analyze
 * Re-analyze a layout inspiration with Claude Vision.
 *
 * Body: { id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const records = await db
      .select()
      .from(layoutInspirations)
      .where(eq(layoutInspirations.id, id));

    if (!records.length) {
      return NextResponse.json({ error: "Inspiration introuvable" }, { status: 404 });
    }

    const record = records[0];
    const fullPath = path.join(process.cwd(), record.imagePath);

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "Image introuvable sur le disque" }, { status: 404 });
    }

    const imageBuffer = await readFile(fullPath);
    const analysis = await analyzeLayoutScreenshot(
      imageBuffer,
      record.layoutFamily,
      record.name,
    );

    await db
      .update(layoutInspirations)
      .set({
        analysis,
        gridSystem: analysis.grid_structure,
        readingOrder: analysis.reading_order,
      })
      .where(eq(layoutInspirations.id, id));

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[LayoutInspirations] Analyze Error:", error);
    return NextResponse.json(
      { error: `Erreur analyse: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/layout-inspirations/analyze
 * Manually update the analysis of a layout inspiration.
 *
 * Body: { id: string, analysis: LayoutAnalysis }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, analysis } = await request.json();
    if (!id || !analysis) {
      return NextResponse.json({ error: "ID et analysis requis" }, { status: 400 });
    }

    const records = await db
      .select()
      .from(layoutInspirations)
      .where(eq(layoutInspirations.id, id));

    if (!records.length) {
      return NextResponse.json({ error: "Inspiration introuvable" }, { status: 404 });
    }

    await db
      .update(layoutInspirations)
      .set({
        analysis,
        gridSystem: analysis.grid_structure || records[0].gridSystem,
        readingOrder: analysis.reading_order || records[0].readingOrder,
      })
      .where(eq(layoutInspirations.id, id));

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("[LayoutInspirations] PATCH Analysis Error:", error);
    return NextResponse.json(
      { error: `Erreur sauvegarde: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
