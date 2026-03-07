import { NextRequest, NextResponse } from "next/server";
import { createBrandDocument, deleteDocument, updateDocumentInsights } from "@/lib/db/queries/documents";
import { saveImage } from "@/lib/images/storage";
import { summarizeBrandDocument } from "@/lib/ai/claude-creative";
import { nanoid } from "nanoid";

async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      return result.text || null;
    }
    if (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType.includes("text")
    ) {
      return buffer.toString("utf-8");
    }
    return null;
  } catch (err) {
    console.error("Text extraction error:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const brandId = formData.get("brandId") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;

    if (!file || !brandId || !name) {
      return NextResponse.json(
        { error: "Fichier, brandId et nom requis" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "pdf";
    const fileName = `doc_${nanoid()}.${ext}`;
    const subDir = `brands/${brandId}/documents`;
    const filePath = await saveImage(buffer, subDir, fileName);

    const id = await createBrandDocument({
      brandId,
      name,
      type: type || "other",
      filePath,
      mimeType: file.type,
      fileSizeBytes: buffer.length,
    });

    // Extract text + auto-summarize with Claude (async, non-blocking)
    extractTextFromFile(buffer, file.type)
      .then(async (extractedText) => {
        if (!extractedText || extractedText.trim().length < 50) {
          console.log(`Document ${id}: no usable text extracted`);
          return;
        }

        // Save extracted text immediately
        await updateDocumentInsights(id, { extractedText });

        // Summarize with Claude
        const result = await summarizeBrandDocument(
          extractedText,
          name,
          type || "other"
        );
        await updateDocumentInsights(id, {
          summary: result.summary,
          keyInsights: result.keyInsights,
        });
        console.log(`Document ${id} summarized successfully`);
      })
      .catch((err) => {
        console.error(`Document ${id} processing failed:`, err);
      });

    return NextResponse.json({ id, filePath });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
