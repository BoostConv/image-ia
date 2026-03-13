import Anthropic from "@anthropic-ai/sdk";
import type {
  RenderResult,
  FilteredContext,
  ImageEvaluation,
  PairwiseRanking,
  BatchEvaluation,
} from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";

// ============================================================
// LAYER F: EVALUATOR
// Dual scoring: Craft (technical quality) + Ad Performance (Meta feed).
// Pairwise ranking across the batch for comparative selection.
// Uses Claude Vision to analyze generated images.
// ============================================================

const getClient = () => new Anthropic();

/**
 * Evaluate a single image on craft and ad performance.
 */
export async function evaluateImage(
  result: RenderResult,
  context: FilteredContext
): Promise<ImageEvaluation> {
  const client = getClient();

  const imageBase64 = result.final_image.toString("base64");
  const mediaType = result.final_mime_type.includes("png")
    ? "image/png" as const
    : "image/jpeg" as const;

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Tu es un evaluateur expert en publicite Meta (Facebook/Instagram) et en qualite d'image publicitaire. Tu evalues chaque image sur 2 axes independants :

1. CRAFT (qualite technique) — L'image est-elle bien executee techniquement ?
2. AD PERFORMANCE (performance publicitaire) — L'image va-t-elle performer dans un feed Meta ?

Chaque score de 1 a 10. Sois SEVERE. Un 7 = professionnel correct. Un 9 = exceptionnel. Un 5 = amateur.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Evalue cette image publicitaire pour le contexte suivant :

Marque: ${context.brand_name}
Produit: ${context.product_name}
Promesse: ${context.promise}
Cible archetype: ${result.brief.creative_archetype}
Idee visuelle visee: ${result.brief.single_visual_idea}
Hook vise: ${result.brief.hook_type}

=== FORMAT DE SORTIE ===
{
  "craft": {
    "realism": <1-10, qualite du photoréalisme/rendu>,
    "product_fidelity": <1-10, fidelite au produit decrit>,
    "composition_quality": <1-10, qualite de la composition>,
    "lighting_quality": <1-10, qualite et coherence de l'eclairage>,
    "premium_visual_feel": <1-10, impression premium/haut de gamme>,
    "material_coherence": <1-10, coherence des materiaux et textures>,
    "overall_craft": <1-10, note globale craft>
  },
  "ad_performance": {
    "stop_scroll_power": <1-10, capacite a arreter le scroll>,
    "instant_clarity": <1-10, on comprend le message en 0.5s>,
    "visible_promise": <1-10, la promesse est visible sans texte>,
    "visible_proof": <1-10, la preuve est visible dans l'image>,
    "meta_native_feel": <1-10, l'image semble native dans un feed Meta>,
    "visual_distinctiveness": <1-10, se distingue des autres ads>,
    "text_overlay_readiness": <1-10, zones claires pour ajouter du texte>,
    "likelihood_to_win_in_feed": <1-10, probabilite de surperformer>,
    "overall_ad": <1-10, note globale performance ad>
  },
  "combined_score": <1-10, moyenne ponderee craft 40% + ad 60%>,
  "strengths": ["force 1", "force 2", "force 3"],
  "weaknesses": ["faiblesse 1", "faiblesse 2"],
  "edit_suggestions": ["suggestion d'amelioration 1", "suggestion 2"]
}`,
          },
        ],
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Evaluator: pas de reponse textuelle");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const evaluation = JSON.parse(jsonStr.trim()) as ImageEvaluation;
    console.log(`[Evaluator] Concept ${result.concept_index + 1}:`, {
      craft: evaluation.craft.overall_craft,
      ad: evaluation.ad_performance.overall_ad,
      combined: evaluation.combined_score,
    });
    return evaluation;
  } catch (e) {
    console.error("[Evaluator] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`Evaluator: JSON invalide — ${(e as Error).message}`);
  }
}

/**
 * Pairwise ranking across a batch — which image is best for what.
 */
export async function rankBatch(
  results: RenderResult[],
  evaluations: ImageEvaluation[],
  context: FilteredContext
): Promise<PairwiseRanking> {
  if (results.length <= 1) {
    return {
      best_for_scroll_stop: 0,
      best_for_product_showcase: 0,
      best_for_promise_communication: 0,
      best_for_premium_feel: 0,
      best_overall_for_meta_feed: 0,
      ranking_rationale: "Un seul concept genere — pas de comparaison possible.",
    };
  }

  const client = getClient();

  // Build image array for multi-image comparison
  const imageContents: Anthropic.Messages.ContentBlockParam[] = [];
  for (let i = 0; i < results.length; i++) {
    const imageBase64 = results[i].final_image.toString("base64");
    const mediaType = results[i].final_mime_type.includes("png")
      ? "image/png" as const
      : "image/jpeg" as const;

    imageContents.push({
      type: "text",
      text: `--- IMAGE ${i + 1} (${results[i].brief.creative_archetype}) ---`,
    });
    imageContents.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: imageBase64 },
    });
  }

  // Add evaluation context
  const evalSummary = evaluations
    .map((e, i) => `Image ${i + 1}: craft=${e.craft.overall_craft}/10, ad=${e.ad_performance.overall_ad}/10, combined=${e.combined_score}/10`)
    .join("\n");

  imageContents.push({
    type: "text",
    text: `Compare ces ${results.length} images publicitaires pour ${context.brand_name} — ${context.product_name}.

Scores individuels :
${evalSummary}

Promesse a communiquer : ${context.promise}

=== REPONDS EN JSON ===
{
  "best_for_scroll_stop": <index 0-based de la meilleure pour arreter le scroll>,
  "best_for_product_showcase": <index pour montrer le produit>,
  "best_for_promise_communication": <index pour communiquer la promesse>,
  "best_for_premium_feel": <index pour le feel premium>,
  "best_overall_for_meta_feed": <index meilleure overall pour Meta>,
  "ranking_rationale": "Explication en 2-3 phrases de pourquoi ces choix"
}`,
  });

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: "Tu es un media buyer expert Meta ads. Compare des variantes publicitaires et designe les meilleures. Reponds UNIQUEMENT en JSON valide.",
    messages: [{ role: "user", content: imageContents }],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Evaluator ranking: pas de reponse textuelle");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const ranking = JSON.parse(jsonStr.trim()) as PairwiseRanking;
    console.log("[Evaluator] Ranking:", ranking);
    return ranking;
  } catch (e) {
    console.error("[Evaluator] Ranking JSON error:", jsonStr.slice(0, 300));
    throw new Error(`Evaluator ranking: JSON invalide — ${(e as Error).message}`);
  }
}

/**
 * Full evaluation pipeline: individual scores + pairwise ranking.
 */
export async function evaluateBatch(
  results: RenderResult[],
  context: FilteredContext
): Promise<BatchEvaluation> {
  // Score each image individually
  const individualScores: ImageEvaluation[] = [];
  for (let i = 0; i < results.length; i++) {
    const score = await evaluateImage(results[i], context);
    individualScores.push(score);
    // Small delay between sequential evaluations to avoid rate limits
    if (i < results.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Pairwise ranking
  const pairwise = await rankBatch(results, individualScores, context);

  return { individual_scores: individualScores, pairwise };
}
