import Anthropic from "@anthropic-ai/sdk";
import type {
  RenderResult,
  FilteredContext,
  ComposedAd,
  BaseImageEvaluation,
  ComposedAdEvaluation,
  DualEvaluation,
  DualBatchEvaluation,
  PairwiseRanking,
} from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { getKnowledgeForStage } from "./knowledge";
import type { AwarenessLevel } from "./knowledge";
import { getBaseImageCalibrationDirective, getComposedAdCalibrationDirective } from "./knowledge/evaluator-calibration";

// ============================================================
// COMPONENT K: DUAL EVALUATOR
// Evaluates both the base rendered image (craft + ad potential)
// and the final composed ad (text, layout, mobile readability).
// Final score = 30% base + 70% composed.
// ============================================================

const getClient = () => new Anthropic();

// ─── BASE IMAGE EVALUATION ──────────────────────────────────

/**
 * Evaluate a base rendered image (before composition).
 * Same criteria as the original evaluator but returns BaseImageEvaluation.
 */
export async function evaluateBaseImage(
  result: RenderResult,
  context: FilteredContext
): Promise<BaseImageEvaluation> {
  const client = getClient();

  const imageBase64 = result.final_image.toString("base64");
  const mediaType = result.final_mime_type.includes("png")
    ? ("image/png" as const)
    : ("image/jpeg" as const);

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1536,
    system: `Tu es un evaluateur expert en qualite d'image publicitaire. Evalue l'image BRUTE (avant composition texte/layout). Focus sur la qualite technique et le potentiel publicitaire.

Chaque score de 1 a 10. Sois SEVERE. Un 7 = pro correct. Un 9 = exceptionnel.

${(() => {
  const awareness = (result.brief.awareness_level || "problem_aware") as AwarenessLevel;
  const k = getKnowledgeForStage("evaluator", awareness);
  return k.visual_rules;
})()}

${getBaseImageCalibrationDirective()}

Reponds UNIQUEMENT en JSON valide.`,
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
            text: `Evalue cette image brute pour :
Marque: ${context.brand_name}
Produit: ${context.product_name}
Promesse: ${context.promise}
Archetype: ${result.brief.creative_archetype}

=== FORMAT ===
{
  "craft": {
    "realism": <1-10>,
    "product_fidelity": <1-10>,
    "composition_quality": <1-10>,
    "lighting_quality": <1-10>,
    "premium_visual_feel": <1-10>,
    "material_coherence": <1-10>,
    "overall_craft": <1-10>
  },
  "ad_performance": {
    "stop_scroll_power": <1-10>,
    "instant_clarity": <1-10>,
    "visible_promise": <1-10>,
    "visible_proof": <1-10>,
    "meta_native_feel": <1-10>,
    "visual_distinctiveness": <1-10>,
    "text_overlay_readiness": <1-10>,
    "likelihood_to_win_in_feed": <1-10>,
    "overall_ad": <1-10>
  },
  "combined_score": <1-10, craft 40% + ad 60%>,
  "strengths": ["force 1", "force 2"],
  "weaknesses": ["faiblesse 1", "faiblesse 2"]
}`,
          },
        ],
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("DualEvaluator base: pas de reponse textuelle");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const evaluation = JSON.parse(jsonStr.trim()) as BaseImageEvaluation;
    console.log(`[DualEval/Base] Concept ${result.concept_index + 1}:`, {
      craft: evaluation.craft.overall_craft,
      ad: evaluation.ad_performance.overall_ad,
      combined: evaluation.combined_score,
    });
    return evaluation;
  } catch (e) {
    console.error("[DualEval/Base] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`DualEvaluator base: JSON invalide — ${(e as Error).message}`);
  }
}

// ─── COMPOSED AD EVALUATION ─────────────────────────────────

/**
 * Evaluate a composed ad (after text overlay, layout, CTA).
 * New criteria: message clarity, mobile readability, visual cohesion, etc.
 */
export async function evaluateComposedAd(
  composed: ComposedAd,
  context: FilteredContext,
  conceptIndex: number
): Promise<ComposedAdEvaluation> {
  // If no composition was applied (textDensity="none"), return default scores
  if (composed.layoutUsed === "none") {
    return {
      stop_scroll_power: 5,
      message_clarity: 3,
      mobile_readability: 5,
      visual_cohesion: 7,
      text_legibility: 5,
      hierarchy_effectiveness: 3,
      cta_visibility: 1,
      brand_consistency: 5,
      overall_composed: 4,
      improvement_notes: ["No composition applied — image brute sans texte"],
    };
  }

  const client = getClient();

  const imageBase64 = composed.buffer.toString("base64");

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `Tu es un expert en publicite Meta (Facebook/Instagram). Evalue la PUB COMPOSEE FINALE — l'image avec ses textes, CTA, preuves overlays. Focus sur la lisibilite mobile, la hierarchie visuelle et l'efficacite de la composition.

Chaque score de 1 a 10. Sois SEVERE. Un 7 = pro correct.

CRITERES COPY: Max 7 mots pour headline sur image. Mots puissants (Gratuit, Nouveau, Garanti)? Ton conversationnel? Specifique?
CRITERES VISUELS: Pattern Z respecte? Point focal unique? Contraste CTA suffisant? Lisible en 0.3s sur mobile?

${getComposedAdCalibrationDirective()}

Reponds UNIQUEMENT en JSON valide.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Evalue cette pub composee finale :
Marque: ${context.brand_name}
Produit: ${context.product_name}
Layout utilise: ${composed.layoutUsed}
Zones utilisees: ${composed.zonesUsed.join(", ")}
Headline: "${composed.copyAssets.headline}"
CTA: "${composed.copyAssets.cta || "aucun"}"

=== FORMAT ===
{
  "stop_scroll_power": <1-10, arrete-t-on le scroll?>,
  "message_clarity": <1-10, comprend-on le message en 1s?>,
  "mobile_readability": <1-10, lisible sur iPhone 14?>,
  "visual_cohesion": <1-10, texte integre naturellement?>,
  "text_legibility": <1-10, contraste texte/fond suffisant?>,
  "hierarchy_effectiveness": <1-10, oeil suit headline→proof→CTA?>,
  "cta_visibility": <1-10, le CTA est-il visible et cliquable?>,
  "brand_consistency": <1-10, coherence avec la marque?>,
  "overall_composed": <1-10, note globale pub composee>,
  "improvement_notes": ["note 1", "note 2"]
}`,
          },
        ],
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("DualEvaluator composed: pas de reponse textuelle");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const evaluation = JSON.parse(jsonStr.trim()) as ComposedAdEvaluation;
    console.log(`[DualEval/Composed] Concept ${conceptIndex + 1}:`, {
      overall: evaluation.overall_composed,
      clarity: evaluation.message_clarity,
      mobile: evaluation.mobile_readability,
    });
    return evaluation;
  } catch (e) {
    console.error("[DualEval/Composed] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`DualEvaluator composed: JSON invalide — ${(e as Error).message}`);
  }
}

// ─── DUAL EVALUATION (BASE + COMPOSED) ──────────────────────

/**
 * Run dual evaluation: base image + composed ad.
 * Final score = 30% base + 70% composed.
 */
export async function dualEvaluate(
  result: RenderResult,
  composed: ComposedAd,
  context: FilteredContext
): Promise<DualEvaluation> {
  const base = await evaluateBaseImage(result, context);
  const composedEval = await evaluateComposedAd(composed, context, result.concept_index);

  const final_score = Math.round(
    (base.combined_score * 0.3 + composedEval.overall_composed * 0.7) * 10
  ) / 10;

  return { base, composed: composedEval, final_score };
}

// ─── PAIRWISE RANKING (ON COMPOSED ADS) ─────────────────────

/**
 * Pairwise ranking across composed ads.
 */
export async function rankComposedBatch(
  composedAds: ComposedAd[],
  evaluations: DualEvaluation[],
  context: FilteredContext
): Promise<PairwiseRanking> {
  if (composedAds.length <= 1) {
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

  const imageContents: Anthropic.Messages.ContentBlockParam[] = [];
  for (let i = 0; i < composedAds.length; i++) {
    const imageBase64 = composedAds[i].buffer.toString("base64");

    imageContents.push({
      type: "text",
      text: `--- PUB ${i + 1} (layout: ${composedAds[i].layoutUsed}) ---`,
    });
    imageContents.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: imageBase64,
      },
    });
  }

  const evalSummary = evaluations
    .map(
      (e, i) =>
        `Pub ${i + 1}: base=${e.base.combined_score}/10, composed=${e.composed.overall_composed}/10, final=${e.final_score}/10`
    )
    .join("\n");

  imageContents.push({
    type: "text",
    text: `Compare ces ${composedAds.length} pubs composees pour ${context.brand_name} — ${context.product_name}.

Scores :
${evalSummary}

Promesse : ${context.promise}

=== JSON ===
{
  "best_for_scroll_stop": <index 0-based>,
  "best_for_product_showcase": <index>,
  "best_for_promise_communication": <index>,
  "best_for_premium_feel": <index>,
  "best_overall_for_meta_feed": <index>,
  "ranking_rationale": "Explication en 2-3 phrases"
}`,
  });

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system:
      "Tu es un media buyer expert Meta ads. Compare des pubs composees finales et designe les meilleures. Sois DISCRIMINANT — si deux pubs sont mediocres, dis-le clairement dans le rationale. Ne cherche pas a etre gentil. Reponds UNIQUEMENT en JSON valide.",
    messages: [{ role: "user", content: imageContents }],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("DualEvaluator ranking: pas de reponse textuelle");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const ranking = JSON.parse(jsonStr.trim()) as PairwiseRanking;
    console.log("[DualEval] Ranking:", ranking);
    return ranking;
  } catch (e) {
    console.error("[DualEval] Ranking JSON error:", jsonStr.slice(0, 300));
    throw new Error(`DualEvaluator ranking: JSON invalide — ${(e as Error).message}`);
  }
}

// ─── FULL DUAL BATCH EVALUATION ─────────────────────────────

/**
 * Full dual evaluation pipeline:
 * 1. Evaluate each base image + composed ad
 * 2. Pairwise ranking on composed ads
 */
export async function dualEvaluateBatch(
  results: RenderResult[],
  composedAds: ComposedAd[],
  context: FilteredContext
): Promise<DualBatchEvaluation> {
  const individual: DualEvaluation[] = [];

  for (let i = 0; i < results.length; i++) {
    const eval_ = await dualEvaluate(results[i], composedAds[i], context);
    individual.push(eval_);
    // Small delay between sequential evaluations to avoid rate limits
    if (i < results.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const pairwise = await rankComposedBatch(composedAds, individual, context);

  return { individual, pairwise };
}
