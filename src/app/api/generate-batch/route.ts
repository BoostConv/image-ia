import { NextRequest } from "next/server";
import { generateImage } from "@/lib/ai/client";
import { generateCreativePrompts, scoreGeneratedImage, improvePrompt } from "@/lib/ai/claude-creative";
import {
  createGeneration,
  updateGenerationStatus,
  saveGeneratedImage,
  savePromptHistory,
  updateImageScoreData,
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
import { db } from "@/lib/db";
import { generatedImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

    // Load product reference image (first available)
    let productReferenceImage: Buffer | null = null;
    if (product?.imagePaths && (product.imagePaths as string[]).length > 0) {
      const imagePaths = product.imagePaths as string[];
      for (const imgPath of imagePaths) {
        const buf = await readImage(imgPath);
        if (buf) {
          productReferenceImage = buf;
          break;
        }
      }
    }

    const generationId = await createGeneration({
      brandId,
      productId: productId || undefined,
      personaId: personaId || undefined,
      mode: "batch",
      promptLayers: { brand: "", persona: "", brief: brief || "", format: "", custom: "" },
      compiledPrompt: `[BATCH x${count}] Claude Creative + Nano Banana`,
      format,
      aspectRatio,
      estimatedCost: count * 0.134,
    });

    await updateGenerationStatus(generationId, "generating");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Phase 1: Claude generates creative concepts
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "phase",
                phase: "ideation",
                message: "Claude genere les concepts creatifs...",
              })}\n\n`
            )
          );

          const creativeResult = await generateCreativePrompts({
            brand: {
              name: brand.name,
              description: brand.description || undefined,
              mission: brand.mission || undefined,
              vision: brand.vision || undefined,
              positioning: brand.positioning || undefined,
              tone: brand.tone || undefined,
              values: brand.values || undefined,
              targetMarket: brand.targetMarket || undefined,
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
            guidelinesPrompt: guidelinesPrompt || undefined,
            documentsPrompt: documentsPrompt || undefined,
            inspirationPrompt: inspirationPrompt || undefined,
            hasProductImages: !!productReferenceImage,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "concepts",
                concepts: creativeResult.prompts.map((p) => ({
                  concept: p.concept,
                  angle: p.creativeAngle,
                  level: p.consciousnessLevel,
                  emotion: p.emotionalHook,
                })),
              })}\n\n`
            )
          );

          // Phase 2: Nano Banana generates images
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "phase",
                phase: "generation",
                message: "Generation des visuels avec Nano Banana...",
              })}\n\n`
            )
          );

          let completed = 0;
          let failed = 0;

          for (let i = 0; i < creativeResult.prompts.length; i++) {
            const creative = creativeResult.prompts[i];

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "progress",
                  current: i + 1,
                  total: creativeResult.prompts.length,
                  concept: creative.concept,
                })}\n\n`
              )
            );

            try {
              const result = await generateImage({
                prompt: creative.visualPrompt,
                aspectRatio: aspectRatio as AspectRatio,
                referenceImage: productReferenceImage || undefined,
              });

              if (result.success && result.images.length > 0) {
                const subDir = getSubDir(generationId);

                for (let j = 0; j < result.images.length; j++) {
                  const img = result.images[j];
                  const fileName = generateFileName(generationId, completed, img.mimeType);
                  const relativePath = await saveImage(img.data, subDir, fileName);

                  const imageId = await saveGeneratedImage({
                    generationId,
                    brandId,
                    filePath: relativePath,
                    mimeType: img.mimeType,
                    fileSizeBytes: img.data.length,
                    format,
                    personaId: personaId || undefined,
                    tags: [format, creative.consciousnessLevel, `batch_${i + 1}`],
                  });

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "image",
                        id: imageId,
                        url: getImageUrl(relativePath),
                        concept: creative.concept,
                        angle: creative.creativeAngle,
                        level: creative.consciousnessLevel,
                        emotion: creative.emotionalHook,
                        index: i,
                        current: i + 1,
                        total: creativeResult.prompts.length,
                      })}\n\n`
                    )
                  );

                  // Phase 3: Creative scoring with Claude Vision
                  try {
                    const imageBuffer = await readImage(relativePath);
                    if (imageBuffer) {
                      const imageBase64 = imageBuffer.toString("base64");
                      const scores = await scoreGeneratedImage(
                        imageBase64,
                        img.mimeType,
                        {
                          prompt: creative.visualPrompt,
                          brandName: brand.name,
                          personaName: persona?.name,
                        }
                      );

                      await updateImageScoreData(imageId, scores);

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "score",
                            imageId,
                            scores,
                          })}\n\n`
                        )
                      );

                      // Auto-iteration if score < 3
                      if (scores.overall < 3 && (creative as Record<string, unknown>).__iterationLevel !== 2) {
                        controller.enqueue(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              type: "iteration",
                              imageId,
                              reason: `Score global ${scores.overall}/10 — re-generation automatique`,
                            })}\n\n`
                          )
                        );

                        try {
                          const improvedPromptText = await improvePrompt(
                            creative.visualPrompt,
                            scores,
                            brand.name
                          );

                          const iterResult = await generateImage({
                            prompt: improvedPromptText,
                            aspectRatio: aspectRatio as AspectRatio,
                            referenceImage: productReferenceImage || undefined,
                          });

                          if (iterResult.success && iterResult.images.length > 0) {
                            const iterImg = iterResult.images[0];
                            const iterFileName = generateFileName(generationId, completed * 10 + j + 100, iterImg.mimeType);
                            const iterPath = await saveImage(iterImg.data, subDir, iterFileName);
                            const currentLevel = ((creative as Record<string, unknown>).__iterationLevel as number) || 0;

                            const iterImageId = await saveGeneratedImage({
                              generationId,
                              brandId,
                              filePath: iterPath,
                              mimeType: iterImg.mimeType,
                              fileSizeBytes: iterImg.data.length,
                              format,
                              personaId: personaId || undefined,
                              tags: [format, creative.consciousnessLevel, `iteration_${currentLevel + 1}`],
                            });

                            // Update iteration fields
                            await db.update(generatedImages).set({
                              iterationOf: imageId,
                              iterationLevel: currentLevel + 1,
                            }).where(eq(generatedImages.id, iterImageId));

                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify({
                                  type: "image",
                                  id: iterImageId,
                                  url: getImageUrl(iterPath),
                                  concept: creative.concept + " (iteration amelioree)",
                                  angle: creative.creativeAngle,
                                  level: creative.consciousnessLevel,
                                  emotion: creative.emotionalHook,
                                  index: i,
                                  current: i + 1,
                                  total: creativeResult.prompts.length,
                                  isIteration: true,
                                  iterationOf: imageId,
                                })}\n\n`
                              )
                            );

                            // Score the iteration too
                            const iterBuffer = await readImage(iterPath);
                            if (iterBuffer) {
                              const iterScores = await scoreGeneratedImage(
                                iterBuffer.toString("base64"),
                                iterImg.mimeType,
                                {
                                  prompt: improvedPromptText,
                                  brandName: brand.name,
                                  personaName: persona?.name,
                                }
                              );
                              await updateImageScoreData(iterImageId, iterScores);
                              controller.enqueue(
                                encoder.encode(
                                  `data: ${JSON.stringify({
                                    type: "score",
                                    imageId: iterImageId,
                                    scores: iterScores,
                                  })}\n\n`
                                )
                              );
                            }
                          }
                        } catch (iterErr) {
                          console.error("Auto-iteration error:", iterErr);
                        }
                      }
                    }
                  } catch (scoreErr) {
                    console.error("Scoring error:", scoreErr);
                  }
                }

                // Save prompt history
                await savePromptHistory({
                  generationId,
                  compiledPrompt: creative.visualPrompt,
                });

                completed++;
              } else {
                failed++;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      index: i,
                      concept: creative.concept,
                      error: result.error || "Echec de generation",
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
                    concept: creative.concept,
                    error: (err as Error).message,
                  })}\n\n`
                )
              );
            }

            if (i < creativeResult.prompts.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }

          await updateGenerationStatus(generationId, "completed", {
            actualCost: completed * 0.134,
            completedAt: new Date().toISOString(),
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                generationId,
                completed,
                failed,
                total: creativeResult.prompts.length,
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
    console.error("Batch generation error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
