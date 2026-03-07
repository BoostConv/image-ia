import { NextRequest } from "next/server";
import { generateImage } from "@/lib/ai/client";
import { generateAdConcepts } from "@/lib/ai/claude-creative";
import { composeAd } from "@/lib/images/ad-composer";
import { AD_DIMENSIONS } from "@/lib/ai/ad-types";
import {
  createGeneration,
  updateGenerationStatus,
  saveGeneratedImage,
  savePromptHistory,
} from "@/lib/db/queries/generations";
import {
  saveImage,
  readImage,
  getSubDir,
  generateFileName,
  getImageUrl,
} from "@/lib/images/storage";
import {
  getBrandById,
  getProductById,
  getPersonaById,
} from "@/lib/db/queries/brands";
import { compileGuidelinesPrompt } from "@/lib/db/queries/guidelines";
import { compileDocumentsPrompt, compileInspirationPrompt } from "@/lib/db/queries/documents";
import type { AspectRatio } from "@/lib/ai/types";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      productId,
      personaId,
      brief,
      format = "feed_square",
      aspectRatio = "1:1",
      count = 5,
    } = body;

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "brandId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const brand = await getBrandById(brandId);
    if (!brand) {
      return new Response(
        JSON.stringify({ error: "Marque introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const product = productId ? await getProductById(productId) : null;
    const persona = personaId ? await getPersonaById(personaId) : null;
    const [guidelinesPrompt, documentsPrompt, inspirationPrompt] = await Promise.all([
      compileGuidelinesPrompt(brandId),
      compileDocumentsPrompt(brandId),
      compileInspirationPrompt(brandId),
    ]);

    // Load product reference image if available
    let productImageBuffer: Buffer | null = null;
    if (product?.imagePaths?.length) {
      productImageBuffer = await readImage(product.imagePaths[0]);
    }

    // Load brand logo if available
    let logoBuffer: Buffer | null = null;
    if (brand.logoPath) {
      logoBuffer = await readImage(brand.logoPath);
    }

    const dimensions = AD_DIMENSIONS[aspectRatio] || AD_DIMENSIONS["1:1"];

    const generationId = await createGeneration({
      brandId,
      productId: productId || undefined,
      personaId: personaId || undefined,
      mode: "batch",
      promptLayers: { brand: "", persona: "", brief: brief || "", format: "", custom: "" },
      compiledPrompt: `[AD PIPELINE x${count}] Claude Art Director + Nano Banana + Composition`,
      format,
      aspectRatio,
      estimatedCost: count * 0.15,
    });

    await updateGenerationStatus(generationId, "generating");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Phase 1: Claude designs ad concepts
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "phase",
                phase: "art_direction",
                message: "Claude concoit les publicites...",
              })}\n\n`
            )
          );

          const adResult = await generateAdConcepts({
            brand: {
              name: brand.name,
              description: brand.description || undefined,
              colorPalette: brand.colorPalette || undefined,
              typography: brand.typography || undefined,
            },
            product: product
              ? {
                  name: product.name,
                  category: product.category || undefined,
                  usp: product.usp || undefined,
                  benefits: product.benefits || undefined,
                  positioning: product.positioning || undefined,
                  marketingArguments: product.marketingArguments || undefined,
                  targetAudience: product.targetAudience || undefined,
                  competitiveAdvantage: product.competitiveAdvantage || undefined,
                }
              : undefined,
            persona: persona
              ? {
                  name: persona.name,
                  description: persona.description || undefined,
                  demographics: persona.demographics || undefined,
                  psychographics: persona.psychographics || undefined,
                  visualStyle: persona.visualStyle || undefined,
                }
              : undefined,
            brief: brief || undefined,
            format,
            aspectRatio,
            count,
            hasProductImage: !!productImageBuffer,
            guidelinesPrompt: guidelinesPrompt || undefined,
            documentsPrompt: documentsPrompt || undefined,
            inspirationPrompt: inspirationPrompt || undefined,
          });

          // Send concepts to client
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "concepts",
                concepts: adResult.ads.map((ad) => ({
                  concept: ad.copy.headline,
                  layout: ad.layout,
                  angle: ad.creativeRationale,
                  level: ad.consciousnessLevel,
                  emotion: ad.emotionalHook,
                })),
              })}\n\n`
            )
          );

          // Phase 2: Generate backgrounds + compose ads
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "phase",
                phase: "generation",
                message: "Generation des fonds et composition des ads...",
              })}\n\n`
            )
          );

          let completed = 0;
          let failed = 0;

          for (let i = 0; i < adResult.ads.length; i++) {
            const adConcept = adResult.ads[i];

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "progress",
                  current: i + 1,
                  total: adResult.ads.length,
                  concept: adConcept.copy.headline,
                  layout: adConcept.layout,
                })}\n\n`
              )
            );

            try {
              // Generate background with Nano Banana
              const bgResult = await generateImage({
                prompt: adConcept.backgroundPrompt,
                aspectRatio: aspectRatio as AspectRatio,
              });

              if (bgResult.success && bgResult.images.length > 0) {
                const bgImage = bgResult.images[0];
                const subDir = getSubDir(generationId);

                // Compose the final ad
                const composedAd = await composeAd({
                  concept: adConcept,
                  backgroundImage: bgImage.data,
                  productImage: productImageBuffer || undefined,
                  logoImage: logoBuffer || undefined,
                  width: dimensions.width,
                  height: dimensions.height,
                  brandName: brand.name,
                  brandColors: brand.colorPalette || undefined,
                });

                const fileName = generateFileName(generationId, completed, "image/png");
                const relativePath = await saveImage(composedAd, subDir, fileName);

                const imageId = await saveGeneratedImage({
                  generationId,
                  brandId,
                  filePath: relativePath,
                  mimeType: "image/png",
                  fileSizeBytes: composedAd.length,
                  format,
                  personaId: personaId || undefined,
                  tags: [format, adConcept.layout, adConcept.consciousnessLevel, "ad_composed"],
                  width: dimensions.width,
                  height: dimensions.height,
                });

                await savePromptHistory({
                  generationId,
                  compiledPrompt: `[${adConcept.layout}] ${adConcept.backgroundPrompt}`,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "image",
                      id: imageId,
                      url: getImageUrl(relativePath),
                      concept: adConcept.copy.headline,
                      layout: adConcept.layout,
                      angle: adConcept.creativeRationale,
                      level: adConcept.consciousnessLevel,
                      emotion: adConcept.emotionalHook,
                      copy: adConcept.copy,
                      index: i,
                      current: i + 1,
                      total: adResult.ads.length,
                    })}\n\n`
                  )
                );

                completed++;
              } else {
                failed++;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      index: i,
                      concept: adConcept.copy.headline,
                      error: bgResult.error || "Echec de generation du fond",
                    })}\n\n`
                  )
                );
              }
            } catch (err) {
              failed++;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    index: i,
                    concept: adConcept.copy.headline,
                    error: (err as Error).message,
                  })}\n\n`
                )
              );
            }

            if (i < adResult.ads.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }

          await updateGenerationStatus(generationId, "completed", {
            actualCost: completed * 0.15,
            completedAt: new Date().toISOString(),
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                generationId,
                completed,
                failed,
                total: adResult.ads.length,
              })}\n\n`
            )
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "fatal_error",
                error: (err as Error).message,
              })}\n\n`
            )
          );

          await updateGenerationStatus(generationId, "failed", {
            errorMessage: (err as Error).message,
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Ad generation error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
