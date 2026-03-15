import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generatedImages, generations } from "@/lib/db/schema";
import { generateImage } from "@/lib/ai/client";
import { saveImage, readImage, getSubDir, generateFileName } from "@/lib/images/storage";
import { createGeneration, saveGeneratedImage, updateGenerationStatus } from "@/lib/db/queries/generations";
import { markRevisionApplied } from "@/lib/db/queries/revisions";
import sharp from "sharp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const body = await request.json();
    const { brief, reviewId } = body;

    if (!brief || typeof brief !== "string" || !brief.trim()) {
      return NextResponse.json(
        { error: "Un brief de regeneration est requis" },
        { status: 400 }
      );
    }

    // 1. Fetch original image record
    const imageRecords = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.id, imageId))
      .limit(1);

    if (!imageRecords.length) {
      return NextResponse.json(
        { error: "Image introuvable" },
        { status: 404 }
      );
    }

    const originalImage = imageRecords[0];

    // 2. Read original image from disk as reference
    const originalBuffer = await readImage(originalImage.filePath);
    if (!originalBuffer) {
      return NextResponse.json(
        { error: "Fichier image original introuvable sur le disque" },
        { status: 404 }
      );
    }

    // 3. Fetch the original generation for context
    let originalPrompt = "";
    let aspectRatio = "1:1";
    if (originalImage.generationId) {
      const genRecords = await db
        .select()
        .from(generations)
        .where(eq(generations.id, originalImage.generationId))
        .limit(1);
      if (genRecords[0]) {
        originalPrompt = genRecords[0].compiledPrompt || "";
        aspectRatio = genRecords[0].aspectRatio || "1:1";
      }
    }

    // 4. Build the edit prompt
    const editPrompt = buildEditPrompt(brief, originalPrompt);

    // 5. Create a new generation record
    const generationId = await createGeneration({
      brandId: originalImage.brandId || undefined,
      mode: "regeneration",
      promptLayers: {
        brand: "",
        persona: "",
        brief: brief.trim(),
        format: originalImage.format || "",
        custom: "",
      },
      compiledPrompt: editPrompt,
      format: originalImage.format || "post_feed",
      aspectRatio,
      originalBrief: brief.trim(),
    });

    // 6. Call Gemini with the original image as reference + edit prompt
    const result = await generateImage({
      prompt: editPrompt,
      aspectRatio: aspectRatio as any,
      referenceImages: [originalBuffer],
    });

    if (!result.success || result.images.length === 0) {
      await updateGenerationStatus(generationId, "failed", {
        errorMessage: result.error || "Echec de la regeneration",
      });
      return NextResponse.json(
        { error: result.error || "Echec de la regeneration Gemini" },
        { status: 500 }
      );
    }

    // 7. Post-process with sharp
    let finalBuffer = result.images[0].data;
    try {
      finalBuffer = await sharp(finalBuffer)
        .sharpen({ sigma: 0.8 })
        .modulate({ saturation: 1.08 })
        .png()
        .toBuffer();
    } catch {
      // fallback to raw buffer if sharp fails
    }

    // 8. Save to disk
    const subDir = getSubDir(generationId);
    const fileName = generateFileName(generationId, 0, "image/png");
    const filePath = await saveImage(finalBuffer, subDir, fileName);

    // 9. Save DB record with iteration tracking
    const newImageId = await saveGeneratedImage({
      generationId,
      brandId: originalImage.brandId || undefined,
      filePath,
      mimeType: "image/png",
      width: originalImage.width || undefined,
      height: originalImage.height || undefined,
      fileSizeBytes: finalBuffer.length,
      format: originalImage.format || undefined,
    });

    // Update the image with iteration info
    const creativeData = {
      ...(originalImage.creativeData as Record<string, unknown> || {}),
      prompt_used: editPrompt,
      engine_version: "regeneration_v1",
    } as typeof originalImage.creativeData;

    await db
      .update(generatedImages)
      .set({
        iterationOf: imageId,
        iterationLevel: (originalImage.iterationLevel || 0) + 1,
        creativeData,
      })
      .where(eq(generatedImages.id, newImageId));

    // 10. Mark generation as completed
    await updateGenerationStatus(generationId, "completed", {
      completedAt: new Date().toISOString(),
    });

    // 11. Mark revision as applied if reviewId provided
    if (reviewId) {
      await markRevisionApplied(reviewId, generationId);
    }

    return NextResponse.json({
      success: true,
      imageId: newImageId,
      generationId,
      filePath,
    });
  } catch (error) {
    console.error("Image regeneration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la regeneration" },
      { status: 500 }
    );
  }
}

function buildEditPrompt(brief: string, originalPrompt: string): string {
  const parts: string[] = [];

  parts.push("EDIT THIS IMAGE. Keep the overall composition and style, but apply the following modifications:");
  parts.push("");
  parts.push(`MODIFICATIONS REQUESTED:`);
  parts.push(brief.trim());
  parts.push("");
  parts.push("IMPORTANT RULES:");
  parts.push("- Preserve the overall look and feel of the original image");
  parts.push("- Only change what is explicitly requested");
  parts.push("- Keep product fidelity if a product is visible");
  parts.push("- Maintain text legibility if text is present");
  parts.push("- Keep the same aspect ratio and composition structure");

  // Add original context if available (shortened)
  if (originalPrompt && originalPrompt.length > 0) {
    const contextSnippet = originalPrompt.slice(0, 300);
    parts.push("");
    parts.push(`ORIGINAL CONTEXT (for reference): ${contextSnippet}`);
  }

  return parts.join("\n");
}
