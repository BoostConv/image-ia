import { NextRequest, NextResponse } from "next/server";
import { updateInspirationAd } from "@/lib/db/queries/documents";
import { analyzeInspirationAd } from "@/lib/ai/claude-creative";
import { readImage } from "@/lib/images/storage";
import { db } from "@/lib/db";
import { inspirationAds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(inspirationAds)
      .where(eq(inspirationAds.id, id));
    const ad = rows[0];
    if (!ad) {
      return NextResponse.json({ error: "Ad introuvable" }, { status: 404 });
    }

    const imageBuffer = await readImage(ad.filePath);
    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Image introuvable sur le disque" },
        { status: 404 }
      );
    }

    const result = await analyzeInspirationAd(
      imageBuffer.toString("base64"),
      ad.mimeType
    );

    await updateInspirationAd(id, {
      analysis: result.analysis,
      tags: result.tags,
    });

    return NextResponse.json({
      analysis: result.analysis,
      tags: result.tags,
    });
  } catch (error) {
    console.error("Inspiration analyze error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse" },
      { status: 500 }
    );
  }
}
