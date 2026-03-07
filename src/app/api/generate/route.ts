import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/client";
import {
  createGeneration,
  updateGenerationStatus,
  saveGeneratedImage,
} from "@/lib/db/queries/generations";
import {
  saveImage,
  getSubDir,
  generateFileName,
  getImageUrl,
} from "@/lib/images/storage";
import { enhancePromptWithCreativeDirection } from "@/lib/ai/creative-director";
import type { AspectRatio } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      format,
      aspectRatio,
      brandId,
      productId,
      personaId,
      promptLayers,
      creativeConfig,
    } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Le prompt est requis" },
        { status: 400 }
      );
    }

    // Enhance prompt with Creative Director intelligence
    const enhancedPrompt = enhancePromptWithCreativeDirection(
      prompt,
      creativeConfig || { explorationMode: "creative" }
    );

    // Create generation record
    const generationId = await createGeneration({
      brandId: brandId || undefined,
      productId: productId || undefined,
      personaId: personaId || undefined,
      mode: "single",
      promptLayers: promptLayers || {
        brand: "",
        persona: "",
        brief: "",
        format: "",
        custom: prompt,
      },
      compiledPrompt: enhancedPrompt,
      format: format || "feed_square",
      aspectRatio: aspectRatio || "1:1",
      estimatedCost: 0.134,
    });

    await updateGenerationStatus(generationId, "generating");

    // Call Nano Banana PRO API with enhanced prompt
    const result = await generateImage({
      prompt: enhancedPrompt,
      aspectRatio: (aspectRatio as AspectRatio) || "1:1",
    });

    if (!result.success) {
      await updateGenerationStatus(generationId, "failed", {
        errorMessage: result.error,
      });
      return NextResponse.json(
        { error: result.error || "Echec de la generation" },
        { status: 500 }
      );
    }

    // Save images to disk
    const savedImages: Array<{ id: string; url: string }> = [];
    const subDir = getSubDir(generationId);

    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i];
      const fileName = generateFileName(generationId, i, img.mimeType);
      const relativePath = await saveImage(img.data, subDir, fileName);

      const imageId = await saveGeneratedImage({
        generationId,
        brandId: brandId || undefined,
        filePath: relativePath,
        mimeType: img.mimeType,
        fileSizeBytes: img.data.length,
        format: format || "feed_square",
        personaId: personaId || undefined,
        tags: [format || "feed_square"],
      });

      savedImages.push({
        id: imageId,
        url: getImageUrl(relativePath),
      });
    }

    await updateGenerationStatus(generationId, "completed", {
      actualCost: result.images.length * 0.134,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      generationId,
      images: savedImages,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
