import { NextRequest, NextResponse } from "next/server";
import {
  createInspirationAd,
  deleteInspirationAd,
  updateInspirationAd,
} from "@/lib/db/queries/documents";
import { saveImage } from "@/lib/images/storage";
import { analyzeInspirationAd } from "@/lib/ai/claude-creative";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const brandId = formData.get("brandId") as string;
    const name = formData.get("name") as string;
    const source = formData.get("source") as string;
    const competitorName = formData.get("competitorName") as string;
    const notes = formData.get("notes") as string;

    if (!file || !brandId) {
      return NextResponse.json(
        { error: "Fichier et brandId requis" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `inspo_${nanoid()}.${ext}`;
    const subDir = `brands/${brandId}/inspiration`;
    const filePath = await saveImage(buffer, subDir, fileName);

    const id = await createInspirationAd({
      brandId,
      name: name || file.name,
      source: source || "inspiration",
      competitorName: competitorName || undefined,
      filePath,
      mimeType: file.type,
      notes: notes || undefined,
    });

    // Auto-analyze with Claude Vision (async, non-blocking)
    analyzeInspirationAd(buffer.toString("base64"), file.type)
      .then(async (result) => {
        await updateInspirationAd(id, {
          analysis: result.analysis,
          tags: result.tags,
        });
        console.log(`Inspiration ad ${id} analyzed successfully`);
      })
      .catch((err) => {
        console.error(`Inspiration ad ${id} analysis failed:`, err);
      });

    return NextResponse.json({ id, filePath });
  } catch (error) {
    console.error("Inspiration upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await updateInspirationAd(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inspiration update error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deleteInspirationAd(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inspiration delete error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
