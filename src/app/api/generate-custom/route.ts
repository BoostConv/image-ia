import { NextRequest } from "next/server";
import { generateImage } from "@/lib/ai/client";
import { postProcess } from "@/lib/engine/post-process";
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
import type { AspectRatio } from "@/lib/ai/types";

export const maxDuration = 300;

interface CustomPromptEntry {
  prompt: string;
  referenceImages?: string[]; // base64 strings
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      prompts,
      aspectRatio = "1:1",
      format = "feed_square",
      globalReferenceImages,
    } = body as {
      brandId: string;
      prompts: (string | CustomPromptEntry)[];
      aspectRatio?: string;
      format?: string;
      globalReferenceImages?: string[]; // base64 strings shared across all prompts
    };

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "brandId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!prompts || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Au moins un prompt requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize prompts to CustomPromptEntry[]
    const entries: CustomPromptEntry[] = prompts.map((p) =>
      typeof p === "string" ? { prompt: p } : p
    );

    // Convert global reference images to buffers once
    const globalRefBuffers: Buffer[] = (globalReferenceImages || [])
      .map((b64) => {
        try {
          // Strip data URL prefix if present
          const clean = b64.replace(/^data:image\/[^;]+;base64,/, "");
          return Buffer.from(clean, "base64");
        } catch {
          return null;
        }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    const generationId = await createGeneration({
      brandId,
      mode: "batch",
      promptLayers: {
        brand: "",
        persona: "",
        brief: "",
        format: "",
        custom: entries.map((e) => e.prompt).join("\n---\n"),
      },
      compiledPrompt: `[CUSTOM] ${entries.length} prompt(s) direct`,
      format,
      aspectRatio,
      estimatedCost: entries.length * 0.15,
    });

    await updateGenerationStatus(generationId, "generating");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        let completed = 0;
        let failed = 0;
        const subDir = getSubDir(generationId);

        send({
          type: "phase",
          phase: "custom",
          message: `Mode custom — ${entries.length} prompt(s) a traiter`,
        });

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];

          send({
            type: "progress",
            current: i + 1,
            total: entries.length,
            concept: `Prompt ${i + 1}/${entries.length}: ${entry.prompt.slice(0, 80)}...`,
          });

          try {
            // Build reference buffers for this prompt
            const perPromptRefs: Buffer[] = (entry.referenceImages || [])
              .map((b64) => {
                try {
                  const clean = b64.replace(/^data:image\/[^;]+;base64,/, "");
                  return Buffer.from(clean, "base64");
                } catch {
                  return null;
                }
              })
              .filter((b): b is NonNullable<typeof b> => b !== null);

            // Combine global + per-prompt references
            const allRefs = [...globalRefBuffers, ...perPromptRefs];

            const result = await generateImage({
              prompt: entry.prompt,
              aspectRatio: aspectRatio as AspectRatio,
              referenceImages: allRefs.length > 0 ? allRefs : undefined,
            });

            if (!result.success || result.images.length === 0) {
              send({
                type: "error",
                index: i,
                error: result.error || "Aucune image generee",
              });
              failed++;
              continue;
            }

            // Post-process
            const rawBuffer = result.images[0].data;
            const processed = await postProcess(rawBuffer, { aspectRatio });

            // Save to disk
            const fileName = generateFileName(generationId, i, "image/png");
            const relativePath = await saveImage(processed, subDir, fileName);

            // Save to DB
            const imageId = await saveGeneratedImage({
              generationId,
              brandId,
              filePath: relativePath,
              mimeType: "image/png",
              fileSizeBytes: processed.length,
              format,
              tags: ["custom", `prompt_${i + 1}`],
            });

            await savePromptHistory({
              generationId,
              compiledPrompt: entry.prompt,
            });

            send({
              type: "image",
              id: imageId,
              url: getImageUrl(relativePath),
              concept: entry.prompt.slice(0, 120),
              angle: "custom",
              level: "custom",
              emotion: "custom",
              index: i,
              current: i + 1,
              total: entries.length,
            });

            completed++;
          } catch (err) {
            console.error(`[Custom] Prompt ${i + 1} failed:`, err);
            send({
              type: "error",
              index: i,
              error: (err as Error).message,
            });
            failed++;
          }

          // Rate limiting between prompts
          if (i < entries.length - 1) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }

        await updateGenerationStatus(generationId, "completed", {
          actualCost: completed * 0.15,
          completedAt: new Date().toISOString(),
        });

        send({
          type: "complete",
          generationId,
          completed,
          failed,
          total: entries.length,
        });

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
    console.error("Custom generation error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
