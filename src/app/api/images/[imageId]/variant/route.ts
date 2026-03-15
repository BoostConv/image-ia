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
        { error: "Une direction pour la variante est requise" },
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

    // 2. Read original image as reference
    const originalBuffer = await readImage(originalImage.filePath);
    if (!originalBuffer) {
      return NextResponse.json(
        { error: "Fichier image original introuvable sur le disque" },
        { status: 404 }
      );
    }

    // 3. Fetch original generation for context
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

    // 4. Extract creative data for variant context
    const cd = originalImage.creativeData as Record<string, unknown> | null;
    const headline = (cd?.headline as string) || "";
    const beliefShift = (cd?.belief_shift as string) || "";
    const adJob = (cd?.ad_job as string) || "";
    const marketingLever = (cd?.marketing_lever as string) || "";

    // 5. Build variant prompt
    const variantPrompt = buildVariantPrompt(brief, {
      headline,
      beliefShift,
      adJob,
      marketingLever,
      originalPrompt,
    });

    // 6. Create generation record
    const generationId = await createGeneration({
      brandId: originalImage.brandId || undefined,
      mode: "variant",
      promptLayers: {
        brand: "",
        persona: "",
        brief: brief.trim(),
        format: originalImage.format || "",
        custom: "",
      },
      compiledPrompt: variantPrompt,
      format: originalImage.format || "post_feed",
      aspectRatio,
      originalBrief: brief.trim(),
    });

    // 7. Call Gemini with reference image + variant prompt
    const result = await generateImage({
      prompt: variantPrompt,
      aspectRatio: aspectRatio as any,
      referenceImages: [originalBuffer],
    });

    if (!result.success || result.images.length === 0) {
      await updateGenerationStatus(generationId, "failed", {
        errorMessage: result.error || "Echec de la generation de variante",
      });
      return NextResponse.json(
        { error: result.error || "Echec de la generation Gemini" },
        { status: 500 }
      );
    }

    // 8. Post-process
    let finalBuffer = result.images[0].data;
    try {
      finalBuffer = await sharp(finalBuffer)
        .sharpen({ sigma: 0.8 })
        .modulate({ saturation: 1.08 })
        .png()
        .toBuffer();
    } catch {
      // fallback
    }

    // 9. Save to disk
    const subDir = getSubDir(generationId);
    const fileName = generateFileName(generationId, 0, "image/png");
    const filePath = await saveImage(finalBuffer, subDir, fileName);

    // 10. Save DB record
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

    // Update with iteration + creative data
    const creativeData = {
      ...(cd || {}),
      prompt_used: variantPrompt,
      engine_version: "variant_v1",
    } as typeof originalImage.creativeData;

    await db
      .update(generatedImages)
      .set({
        iterationOf: imageId,
        iterationLevel: (originalImage.iterationLevel || 0) + 1,
        creativeData,
      })
      .where(eq(generatedImages.id, newImageId));

    // 11. Mark generation completed
    await updateGenerationStatus(generationId, "completed", {
      completedAt: new Date().toISOString(),
    });

    // 12. Mark revision applied if reviewId
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
    console.error("Image variant error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation de variante" },
      { status: 500 }
    );
  }
}

function buildVariantPrompt(
  brief: string,
  context: {
    headline: string;
    beliefShift: string;
    adJob: string;
    marketingLever: string;
    originalPrompt: string;
  }
): string {
  const parts: string[] = [];

  parts.push("CREATE A VARIANT of this advertisement.");
  parts.push("Use the reference image as inspiration for the brand identity and product, but create a DIFFERENT visual execution.");
  parts.push("");

  if (context.headline || context.beliefShift || context.adJob || context.marketingLever) {
    parts.push("KEEP THE SAME STRATEGIC DIRECTION:");
    if (context.headline) parts.push(`- Headline: "${context.headline}"`);
    if (context.beliefShift) parts.push(`- Belief shift: "${context.beliefShift}"`);
    if (context.adJob) parts.push(`- Ad job: "${context.adJob}"`);
    if (context.marketingLever) parts.push(`- Marketing lever: "${context.marketingLever}"`);
    parts.push("");
  }

  parts.push("CHANGE THE VISUAL EXECUTION:");
  parts.push("- Different composition and layout");
  parts.push("- Different lighting and atmosphere");
  parts.push("- Different camera angle or perspective");
  parts.push("- Different props or background elements");
  parts.push("");

  parts.push(`USER DIRECTION: ${brief.trim()}`);

  if (context.originalPrompt && context.originalPrompt.length > 0) {
    const contextSnippet = context.originalPrompt.slice(0, 300);
    parts.push("");
    parts.push(`ORIGINAL CONTEXT (for reference): ${contextSnippet}`);
  }

  return parts.join("\n");
}
