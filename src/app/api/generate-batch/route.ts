import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/engine/pipeline";
import type { RawPipelineInput, PipelineEvent } from "@/lib/engine/types";
import {
  createGeneration,
  updateGenerationStatus,
  saveGeneratedImage,
  savePromptHistory,
} from "@/lib/db/queries/generations";
import {
  saveImage,
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
      renderStrategy = "complete_ad",
      selectedImagePaths,
      additionalRefImages,
    } = body as {
      brandId: string;
      productId?: string;
      personaId?: string;
      brief?: string;
      format?: string;
      aspectRatio?: string;
      count?: number;
      renderStrategy?: string;
      selectedImagePaths?: string[];
      additionalRefImages?: string[];
    };

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

    const generationId = await createGeneration({
      brandId,
      productId: productId || undefined,
      personaId: personaId || undefined,
      mode: "batch",
      promptLayers: { brand: "", persona: "", brief: brief || "", format: "", custom: "" },
      compiledPrompt: `[ENGINE v3.1] pipeline A→J→B→B2→C(v3)→D(v3)→E→H1→G(v3)→H2→K→F x${count}`,
      format,
      aspectRatio,
      estimatedCost: count * 0.25,
    });

    await updateGenerationStatus(generationId, "generating");

    // Build raw pipeline input
    const pipelineInput: RawPipelineInput = {
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
        // V1 Brief fields
        identiteFondamentale: brand.identiteFondamentale || undefined,
        positionnementStrategique: brand.positionnementStrategique || undefined,
        tonCommunication: brand.tonCommunication || undefined,
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
            // Use user-selected images if provided, otherwise all product images
            imagePaths: selectedImagePaths?.length
              ? selectedImagePaths
              : (product.imagePaths as string[]) || undefined,
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
      renderStrategy: renderStrategy as "clean" | "complete_ad",
      // Additional reference images uploaded by user (base64 → Buffer)
      additionalReferenceImages: additionalRefImages?.length
        ? additionalRefImages.map((b64: string) => {
            const clean = b64.replace(/^data:image\/[^;]+;base64,/, "");
            return Buffer.from(clean, "base64");
          })
        : undefined,
      // Brand style images (Phase 5+)
      brandStyleImagePaths: brand.brandStyleImages || undefined,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const result = await runPipeline({
            input: pipelineInput,
            onEvent: (event: PipelineEvent) => {
              switch (event.type) {
                case "phase":
                  send({ type: "phase", phase: event.phase, message: event.message });
                  break;

                case "batch_locked":
                  send({
                    type: "phase",
                    phase: "J",
                    message: `Batch verrouillé: ${event.lock.campaignThesis.slice(0, 60)}...`,
                  });
                  break;

                case "concepts_generated":
                  send({
                    type: "phase",
                    phase: "B",
                    message: `${event.concepts.length} concepts générés (sur-génération pour filtrage)`,
                  });
                  break;

                case "concepts_scored":
                  send({
                    type: "phase",
                    phase: "B2",
                    message: `Critique: ${event.kept} retenus, ${event.rejected} rejetés`,
                  });
                  break;

                case "briefs_generated":
                  // Bridge to old "concepts" format for UI compatibility
                  send({
                    type: "concepts",
                    concepts: event.briefs.map((b) => ({
                      concept: b.single_visual_idea.slice(0, 80),
                      angle: b.creative_archetype,
                      level: b.awareness_level,
                      emotion: b.emotional_mechanic,
                      renderMode: b.renderMode,
                      overlayIntent: b.overlayIntent,
                    })),
                  });
                  break;

                case "prompt_built":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: `Concept ${event.index + 1} prêt`,
                  });
                  break;

                case "render_pass_1":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: event.success
                      ? `Concept ${event.index + 1} — pass 1 OK`
                      : `Concept ${event.index + 1} — pass 1 échoué`,
                  });
                  break;

                case "render_pass_2":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: event.success
                      ? `Concept ${event.index + 1} — pass 2 (edit) OK`
                      : `Concept ${event.index + 1} — pass 2 (edit) échoué`,
                  });
                  break;

                case "render_gate":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: `Concept ${event.index + 1} — gate: ${event.verdict.action}`,
                  });
                  break;

                case "composing":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: `Concept ${event.index + 1} — composition (${event.layout})`,
                  });
                  break;

                case "composed":
                  send({
                    type: "progress",
                    current: event.index + 1,
                    total: count,
                    concept: `Concept ${event.index + 1} — composé (${event.layoutUsed})`,
                  });
                  break;

                case "error":
                  send({
                    type: "error",
                    index: event.index,
                    error: event.error,
                  });
                  break;

                default:
                  break;
              }
            },
          });

          // Save rendered images + composed ads to disk and DB
          let completed = 0;
          let failed = 0;
          const subDir = getSubDir(generationId);

          if (result.renders.length === 0) {
            send({
              type: "fatal_error",
              error: "Aucun visuel n'a pu être généré. L'API Gemini a échoué sur tous les concepts. Vérifiez les logs serveur pour plus de détails.",
            });
            await updateGenerationStatus(generationId, "failed", {
              errorMessage: "Tous les renders ont échoué",
            });
            controller.close();
            return;
          }

          for (let i = 0; i < result.renders.length; i++) {
            const render = result.renders[i];
            const composedAd = result.composedAds[i];
            const dualEval = result.evaluation.individual[i];
            const renderGate = result.renderGateVerdicts[i];
            const compositionGateVerdict = result.compositionGateVerdicts[i];

            try {
              // Save raw render
              const fileName = generateFileName(generationId, i, render.final_mime_type);
              const relativePath = await saveImage(render.final_image, subDir, fileName);

              // Save composed ad
              let composedFilePath: string | undefined;
              if (composedAd && composedAd.layoutUsed !== "none") {
                const composedFileName = generateFileName(generationId, i, "image/png").replace(
                  ".png",
                  "_composed.png"
                );
                composedFilePath = await saveImage(composedAd.buffer, subDir, composedFileName);
              }

              const imageId = await saveGeneratedImage({
                generationId,
                brandId,
                filePath: composedFilePath || relativePath,
                mimeType: composedAd ? "image/png" : render.final_mime_type,
                fileSizeBytes: composedAd ? composedAd.buffer.length : render.final_image.length,
                format,
                personaId: personaId || undefined,
                tags: [
                  format,
                  render.brief.creative_archetype,
                  render.brief.hook_type,
                  render.brief.renderMode || "scene_first",
                  composedAd?.layoutUsed || "none",
                  `batch_${i + 1}`,
                ],
              });

              // Save full creative data (brief + art direction + evaluations + gates + v3 taxonomy)
              const conceptIdx = render.concept_index ?? i;
              const concept = result.keptConcepts[conceptIdx];
              const scoredConcept = result.scoredConcepts.find(
                (sc) => sc.concept === concept
              );

              await db.update(generatedImages).set({
                composedFilePath: composedFilePath || null,
                creativeData: {
                  brief: render.brief as unknown as Record<string, unknown>,
                  artDirection: render.art_direction as unknown as Record<string, unknown>,
                  evaluation: dualEval?.base as unknown as Record<string, unknown>,
                  composedEvaluation: dualEval?.composed as unknown as Record<string, unknown>,
                  gateVerdict: renderGate as unknown as Record<string, unknown>,
                  compositionGateVerdict: compositionGateVerdict as unknown as Record<string, unknown>,
                  prompt_used: render.base_image.prompt_used,
                  // ── v3 flat taxonomy fields (for learning & analytics) ──
                  format_family: concept?.format_family,
                  layout_family: concept?.layout_family,
                  proof_mechanism: concept?.proof_mechanism,
                  awareness_stage: concept?.awareness_stage,
                  render_family: concept?.render_family,
                  ad_job: concept?.ad_job,
                  visual_style: concept?.visual_style,
                  style_mode: concept?.style_mode,
                  rupture_structure: concept?.rupture_structure,
                  graphic_tension: concept?.graphic_tension,
                  marketing_lever: concept?.marketing_lever,
                  human_presence: concept?.human_presence,
                  product_role: concept?.product_role,
                  // ── v3 critic scores ──
                  critic_score: scoredConcept?.scores?.composite_score,
                  critic_stop_scroll: scoredConcept?.scores?.stop_scroll,
                  critic_message_clarity: scoredConcept?.scores?.message_clarity,
                  critic_ad_likeness: scoredConcept?.scores?.ad_likeness,
                  critic_proof_strength: scoredConcept?.scores?.proof_strength,
                  // ── v3 concept metadata ──
                  headline: concept?.headline,
                  cta: concept?.cta,
                  belief_shift: concept?.belief_shift,
                  customer_insight: concept?.customer_insight,
                  learning_hypothesis: concept?.learning_hypothesis,
                  engine_version: "v3.1",
                },
                // Bridge old scoreData format for backward compatibility
                scoreData: {
                  composition: dualEval?.base?.craft?.composition_quality || 0,
                  colorHarmony: dualEval?.base?.craft?.material_coherence || 0,
                  emotionalImpact: dualEval?.base?.ad_performance?.stop_scroll_power || 0,
                  brandAlignment: dualEval?.base?.ad_performance?.visible_promise || 0,
                  audienceAppeal: dualEval?.base?.ad_performance?.meta_native_feel || 0,
                  scrollStopping: dualEval?.composed?.stop_scroll_power || 0,
                  copyIntegration: dualEval?.composed?.text_legibility || 0,
                  uniqueness: dualEval?.base?.ad_performance?.visual_distinctiveness || 0,
                  technicalQuality: dualEval?.base?.craft?.overall_craft || 0,
                  overall: dualEval?.final_score || 0,
                },
              }).where(eq(generatedImages.id, imageId));

              // Emit image event for UI — use composed image URL if available
              const displayPath = composedFilePath || relativePath;
              send({
                type: "image",
                id: imageId,
                url: getImageUrl(displayPath),
                concept: render.brief.single_visual_idea.slice(0, 80),
                angle: render.brief.creative_archetype,
                level: render.brief.awareness_level,
                emotion: render.brief.emotional_mechanic,
                renderMode: render.brief.renderMode,
                layout: composedAd?.layoutUsed,
                index: i,
                current: i + 1,
                total: result.renders.length,
              });

              // Emit score event
              if (dualEval) {
                send({
                  type: "score",
                  imageId,
                  scores: {
                    base_craft: dualEval.base?.craft?.overall_craft || 0,
                    base_ad: dualEval.base?.ad_performance?.overall_ad || 0,
                    base_combined: dualEval.base?.combined_score || 0,
                    composed: dualEval.composed?.overall_composed || 0,
                    final: dualEval.final_score || 0,
                    overall: dualEval.final_score || 0,
                  },
                });
              }

              // Save prompt history
              await savePromptHistory({
                generationId,
                compiledPrompt: render.base_image.prompt_used,
              });

              completed++;
            } catch (err) {
              console.error(`Failed to save image ${i}:`, err);
              failed++;
            }
          }

          // Save ranking data on first image of the batch
          if (result.evaluation.pairwise && result.renders.length > 0) {
            const firstImageId = await db
              .select({ id: generatedImages.id })
              .from(generatedImages)
              .where(eq(generatedImages.generationId, generationId))
              .limit(1);

            if (firstImageId[0]) {
              await db.update(generatedImages).set({
                rankingData: result.evaluation.pairwise as unknown as Record<string, unknown>,
              }).where(eq(generatedImages.id, firstImageId[0].id));
            }
          }

          await updateGenerationStatus(generationId, "completed", {
            actualCost: completed * 0.25,
            completedAt: new Date().toISOString(),
          });

          send({
            type: "complete",
            generationId,
            completed,
            failed,
            total: count,
          });
        } catch (err) {
          send({
            type: "fatal_error",
            error: (err as Error).message,
          });

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
