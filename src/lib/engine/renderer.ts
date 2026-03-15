import { generateImage } from "../ai/client";
import type { BuiltPrompt, CreativeBrief, RenderResult } from "./types";
import { getPrimaryReference } from "./reference-selector";
import { postProcess } from "./post-process";
import type { AspectRatio } from "../ai/types";

// ============================================================
// LAYER E: RENDERER
// Two-pass rendering with post-processing:
//   Pass 1: Base composition from prompt + reference → postProcess
//   Pass 2: Refinement (guarded) → postProcess
// ============================================================

/**
 * Render a single concept through up to 2 passes.
 * Pass 2 is skipped for product_first (already precise) and guarded against divergence.
 */
export async function renderConcept(
  index: number,
  prompt: BuiltPrompt,
  brief: CreativeBrief
): Promise<RenderResult> {
  const primaryRef = getPrimaryReference(prompt.selected_reference_images);
  const aspectRatio = prompt.image_generation_config.aspect_ratio as AspectRatio;

  // Collect all reference image buffers AND their roles for annotation
  const refsWithBuffers = prompt.selected_reference_images.filter((r) => r.buffer);
  const refBuffers = refsWithBuffers.map((r) => r.buffer!);
  const refRoles = refsWithBuffers.map((r) => r.role);

  // ─── PASS 1: Base composition ──────────────────────────────
  console.log(`[Renderer] Pass 1 for concept ${index + 1}...`);

  const pass1Result = await generateImage({
    prompt: prompt.prompt_for_model,
    systemInstruction: prompt.system_instruction,
    aspectRatio,
    referenceImages: refBuffers.length > 0 ? refBuffers : undefined,
    referenceImageRoles: refBuffers.length > 0 ? refRoles : undefined,
    referenceImage: refBuffers.length === 0 ? primaryRef?.buffer : undefined,
  });

  if (!pass1Result.success || pass1Result.images.length === 0) {
    console.error(`[Renderer] Pass 1 FAILED for concept ${index + 1}:`, pass1Result.error);
    throw new Error(`Render pass 1 failed: ${pass1Result.error}`);
  }

  // Post-process pass 1
  const pass1Raw = pass1Result.images[0];
  const pass1Buffer = await postProcess(pass1Raw.data, { aspectRatio });
  console.log(`[Renderer] Pass 1 SUCCESS for concept ${index + 1} (post-processed)`);

  // ─── PASS 2: Edit/Refinement (guarded) ──────────────────────
  let editedImage: { buffer: Buffer; mime_type: string; edit_prompt_used: string } | undefined;
  let pass2Success = false;
  let pass2Attempted = false;

  // Skip Pass 2 for product_first — product is already precise from pass 1
  const skipPass2 = brief.renderMode === "product_first";

  if (prompt.edit_prompt_round_2 && !skipPass2) {
    pass2Attempted = true;
    console.log(`[Renderer] Pass 2 (refinement) for concept ${index + 1}...`);

    try {
      // Prefix the edit prompt to force refinement (not regeneration)
      const refinementPrompt =
        "REFINE THIS EXACT IMAGE. Do NOT generate a new scene. Keep the same composition, same subjects, same layout. Only apply these improvements:\n\n" +
        prompt.edit_prompt_round_2;

      const pass2Result = await generateImage({
        prompt: refinementPrompt,
        aspectRatio,
        referenceImage: pass1Buffer, // Post-processed pass 1 as reference
      });

      if (pass2Result.success && pass2Result.images.length > 0) {
        const pass2Raw = pass2Result.images[0].data;

        // Divergence check: if pass 2 size is wildly different from pass 1,
        // the model likely generated a completely new image → discard
        const sizeRatio = pass2Raw.length / pass1Buffer.length;
        if (sizeRatio < 0.3 || sizeRatio > 3.0) {
          console.warn(
            `[Renderer] Pass 2 diverged for concept ${index + 1} (size ratio: ${sizeRatio.toFixed(2)}) — keeping pass 1`
          );
        } else {
          // Post-process pass 2
          const pass2Buffer = await postProcess(pass2Raw, { aspectRatio });
          editedImage = {
            buffer: pass2Buffer,
            mime_type: "image/png",
            edit_prompt_used: refinementPrompt,
          };
          pass2Success = true;
          console.log(`[Renderer] Pass 2 SUCCESS for concept ${index + 1} (post-processed)`);
        }
      } else {
        console.warn(
          `[Renderer] Pass 2 failed for concept ${index + 1}, using pass 1:`,
          pass2Result.error
        );
      }
    } catch (err) {
      console.warn(`[Renderer] Pass 2 error for concept ${index + 1}, using pass 1:`, err);
    }
  } else if (skipPass2) {
    console.log(`[Renderer] Skipping Pass 2 for concept ${index + 1} (product_first mode)`);
  }

  // Use pass 2 result if available, otherwise fall back to pass 1
  const finalImage = editedImage?.buffer || pass1Buffer;
  const finalMimeType = "image/png"; // Always PNG after post-processing

  return {
    concept_index: index,
    brief,
    art_direction: {} as any, // Will be filled by pipeline
    base_image: {
      buffer: pass1Buffer,
      mime_type: "image/png",
      prompt_used: prompt.prompt_for_model,
    },
    edited_image: editedImage,
    final_image: finalImage,
    final_mime_type: finalMimeType,
    generation_metadata: {
      pass_1_success: true,
      pass_2_success: pass2Success,
      pass_2_attempted: pass2Attempted,
      total_api_calls: pass2Attempted ? 2 : 1,
      reference_images_used: prompt.selected_reference_images.length,
    },
  };
}

/**
 * Render an entire batch of concepts.
 * Sequential to respect API rate limits.
 */
export async function renderBatch(
  prompts: BuiltPrompt[],
  briefs: CreativeBrief[],
  onPass1?: (index: number, success: boolean) => void,
  onPass2?: (index: number, success: boolean) => void
): Promise<RenderResult[]> {
  const results: RenderResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    try {
      const result = await renderConcept(i, prompts[i], briefs[i]);
      onPass1?.(i, result.generation_metadata.pass_1_success);
      if (result.generation_metadata.pass_2_attempted) {
        onPass2?.(i, result.generation_metadata.pass_2_success);
      }
      results.push(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Renderer] Concept ${i + 1} completely failed:`, errMsg);
      onPass1?.(i, false);
      // Store the error for upstream reporting
      (results as any).__renderErrors = (results as any).__renderErrors || [];
      (results as any).__renderErrors.push({ index: i, error: errMsg });
      // Continue with other concepts — don't fail the whole batch
    }

    // Rate limiting pause between concepts
    if (i < prompts.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return results;
}
