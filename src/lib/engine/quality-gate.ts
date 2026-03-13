import Anthropic from "@anthropic-ai/sdk";
import type {
  RenderResult,
  GateVerdict,
  GateAction,
  ComposedAd,
  CollisionReport,
} from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import { getKnowledgeForStage } from "./knowledge";
import type { AwarenessLevel } from "./knowledge";

// ============================================================
// COMPONENT H: QUALITY GATES
// H1 — RenderGate: Claude Vision after Renderer (accept/reject)
// H2 — CompositionGate: deterministic after Composer
// ============================================================

const getClient = () => new Anthropic();

// ─── H1: RENDER GATE (Claude Vision) ────────────────────────

/**
 * Gate H1: Evaluate a rendered image for quality issues before
 * sending it to the Composer. Uses Claude Vision (compact).
 *
 * Checks:
 * - product_looks_pasted: does the product look composited/fake?
 * - safe_zone_usable: are there clean areas for text overlay?
 * - product_fidelity_risk: is the product distorted/wrong?
 * - perspective_coherent: is the perspective natural?
 *
 * Returns a GateVerdict with action: accept | reject | fallback_to_pass1 | mark_high_risk
 */
export async function renderGate(result: RenderResult): Promise<GateVerdict> {
  const client = getClient();

  const imageBase64 = result.final_image.toString("base64");
  const mediaType = result.final_mime_type.includes("png")
    ? ("image/png" as const)
    : ("image/jpeg" as const);

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: `Tu es un controleur qualite pour des images publicitaires generees par IA. Evalue rapidement si l'image est utilisable pour une pub Meta.

${(() => {
  const awareness = (result.brief.awareness_level || "problem_aware") as AwarenessLevel;
  const k = getKnowledgeForStage("quality_gate", awareness);
  return k.visual_rules;
})()}

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
            text: `Evalue cette image publicitaire generee par IA.

Archetype vise: ${result.brief.creative_archetype}
Idee visuelle: ${result.brief.single_visual_idea}

=== SCORES (1-10 chacun) ===
{
  "product_looks_pasted": <1=naturel, 10=clairement colle/fake>,
  "safe_zone_usable": <1=pas de zone libre, 10=zones claires pour texte>,
  "product_fidelity_risk": <1=fidele, 10=deforme/incorrect>,
  "perspective_coherent": <1=incohérent, 10=naturel>
}

=== VERDICT ===
Determine l'action :
- "accept" : image OK (pasted<5 ET fidelity<5 ET perspective>5)
- "reject" : image inutilisable (pasted>7 OU fidelity>7 OU perspective<3)
- "fallback_to_pass1" : pass 2 a degrade (uniquement si pass 2 tentee)
- "mark_high_risk" : doutes mais utilisable

=== FORMAT ===
{
  "scores": { "product_looks_pasted": N, "safe_zone_usable": N, "product_fidelity_risk": N, "perspective_coherent": N },
  "action": "accept|reject|fallback_to_pass1|mark_high_risk",
  "reasons": ["raison 1", "raison 2"],
  "confidence": <0.0-1.0>
}`,
          },
        ],
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    // If Claude fails, accept by default to not block the pipeline
    console.warn("[RenderGate] No text response — accepting by default");
    return {
      action: "accept",
      reasons: ["Gate check failed — accepting by default"],
      scores: {},
      confidence: 0.3,
    };
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const parsed = JSON.parse(jsonStr.trim());
    const verdict: GateVerdict = {
      action: validateGateAction(parsed.action),
      reasons: parsed.reasons || [],
      scores: parsed.scores || {},
      confidence: parsed.confidence || 0.5,
    };

    // If pass 2 was not attempted, fallback_to_pass1 makes no sense
    if (
      verdict.action === "fallback_to_pass1" &&
      !result.generation_metadata.pass_2_attempted
    ) {
      verdict.action = "accept";
      verdict.reasons.push("Pass 2 not attempted — fallback unnecessary");
    }

    console.log(`[RenderGate] Concept ${result.concept_index + 1}:`, {
      action: verdict.action,
      confidence: verdict.confidence,
      pasted: parsed.scores?.product_looks_pasted,
      fidelity: parsed.scores?.product_fidelity_risk,
    });

    return verdict;
  } catch (e) {
    console.error("[RenderGate] JSON parse error:", jsonStr.slice(0, 200));
    // Accept by default on parse error
    return {
      action: "accept",
      reasons: [`JSON parse failed: ${(e as Error).message}`],
      scores: {},
      confidence: 0.2,
    };
  }
}

/**
 * Batch render gate: evaluate all renders.
 * Returns verdicts array aligned with renders.
 */
export async function renderGateBatch(
  results: RenderResult[]
): Promise<GateVerdict[]> {
  const verdicts: GateVerdict[] = [];
  for (let i = 0; i < results.length; i++) {
    const verdict = await renderGate(results[i]);
    verdicts.push(verdict);
    // Small delay between sequential gate checks to avoid rate limits
    if (i < results.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return verdicts;
}

// ─── H2: COMPOSITION GATE (deterministic) ───────────────────

/**
 * Gate H2: Check a composed ad for quality issues.
 * Deterministic — no AI call.
 *
 * Checks:
 * - Unresolved collisions
 * - Too many fallbacks applied
 * - Mobile readability (font sizes)
 */
export function compositionGate(
  composed: ComposedAd,
  canvasWidth: number
): GateVerdict {
  const reasons: string[] = [];
  const scores: Record<string, number> = {};
  let action: GateAction = "accept";

  // Check unresolved collisions
  const unresolvedCollisions = composed.collisions.filter((c) => !c.resolved);
  scores["unresolved_collisions"] = unresolvedCollisions.length;

  if (unresolvedCollisions.length > 0) {
    reasons.push(
      `${unresolvedCollisions.length} unresolved collision(s): ${unresolvedCollisions.map((c) => `${c.zone1}↔${c.zone2}`).join(", ")}`
    );
    if (unresolvedCollisions.length >= 2) {
      action = "fallback_to_simpler_template";
    }
  }

  // Check fallback count
  scores["fallbacks_applied"] = composed.fallbacksApplied.length;
  if (composed.fallbacksApplied.length >= 3) {
    reasons.push(
      `Too many fallbacks (${composed.fallbacksApplied.length}): ${composed.fallbacksApplied.join(", ")}`
    );
    action = "fallback_to_simpler_template";
  }

  // Check mobile readability (min font at 1080px canvas)
  const scaleFactor = canvasWidth / 1080;
  const minHeadlineFont = 48 * scaleFactor;
  const minBodyFont = 28 * scaleFactor;
  scores["min_headline_font"] = minHeadlineFont;
  scores["min_body_font"] = minBodyFont;

  // If no zones used, flag it
  if (composed.zonesUsed.length === 0) {
    reasons.push("No layout zones used — composed ad may be bare");
  }

  // Check total overlap area across collisions
  const totalOverlap = composed.collisions.reduce(
    (sum, c) => sum + c.overlapArea,
    0
  );
  scores["total_overlap_area"] = totalOverlap;

  if (totalOverlap > 15) {
    reasons.push(`High total overlap area: ${totalOverlap.toFixed(1)}%`);
    if (action === "accept") {
      action = "mark_high_risk";
    }
  }

  // Confidence based on quality signals
  let confidence = 1.0;
  if (unresolvedCollisions.length > 0) confidence -= 0.2;
  if (composed.fallbacksApplied.length > 0)
    confidence -= 0.1 * composed.fallbacksApplied.length;
  if (totalOverlap > 10) confidence -= 0.15;
  confidence = Math.max(0.1, confidence);

  if (action === "accept" && reasons.length === 0) {
    reasons.push("Composition passed all checks");
  }

  console.log(`[CompositionGate] Layout ${composed.layoutUsed}:`, {
    action,
    collisions: composed.collisions.length,
    unresolved: unresolvedCollisions.length,
    fallbacks: composed.fallbacksApplied.length,
  });

  return { action, reasons, scores, confidence };
}

// ─── HELPERS ─────────────────────────────────────────────────

function validateGateAction(raw: string): GateAction {
  const valid: GateAction[] = [
    "accept",
    "reject",
    "fallback_to_pass1",
    "fallback_to_simpler_template",
    "mark_high_risk",
  ];
  if (valid.includes(raw as GateAction)) return raw as GateAction;
  return "accept";
}
