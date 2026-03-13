import Anthropic from "@anthropic-ai/sdk";
import type { ConceptSpec, CriticScores, ScoredConcept, FilteredContext } from "./types";
import type { BrandStylePolicy } from "./brand-style-policy";
import { checkPolicyViolations, countStretchInBatch } from "./brand-style-policy";
import { isValidFormatForAwareness, isValidJobForAwareness } from "./taxonomy";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";

// ============================================================
// LAYER B2: CREATIVE CRITIC
//
// Scores each ConceptSpec BEFORE rendering (no pixels wasted).
// 11 criteria (1-10) → weighted composite → sort → keep top N.
//
// Key insight: it's cheaper to over-generate concepts and filter
// than to render bad ones and discard after.
//
// Includes RENDERABILITY score — evaluates whether an AI image
// model can actually execute the visual device well.
// ============================================================

const getClient = () => new Anthropic();

// ─── Weights for composite score ────────────────────────────
// Higher weight = more important for final ranking.

const WEIGHTS: Record<keyof Omit<CriticScores, "composite_score" | "pass" | "rejection_reason">, number> = {
  stop_scroll: 1.5,
  message_clarity: 1.3,
  ad_likeness: 1.2,
  proof_strength: 1.0,
  visual_hierarchy: 1.1,
  thumb_readability: 1.2,
  product_visibility: 1.0,
  brand_fit: 0.8,
  novelty: 0.7,
  renderability: 1.4,   // HIGH weight — no point in a concept that can't be rendered
  confusion_risk: 1.0,  // Inverted: 10 = very confusing = bad
};

const PASS_THRESHOLD = 5.5; // Composite score below this = reject

// ─── Deterministic pre-checks ───────────────────────────────

/**
 * Fast deterministic checks before AI scoring.
 * Returns violations that may cause rejection or score penalties.
 */
function deterministicChecks(
  concept: ConceptSpec,
  policy: BrandStylePolicy
): { violations: string[]; penalties: Record<string, number> } {
  const violations: string[] = [];
  const penalties: Record<string, number> = {};

  // Check taxonomy compatibility
  if (!isValidFormatForAwareness(concept.format_family, concept.awareness_stage)) {
    violations.push(
      `Format "${concept.format_family}" is not recommended for awareness "${concept.awareness_stage}"`
    );
    penalties.ad_likeness = -1;
  }

  if (!isValidJobForAwareness(concept.ad_job, concept.awareness_stage)) {
    violations.push(
      `Ad job "${concept.ad_job}" is not typical for awareness "${concept.awareness_stage}"`
    );
    penalties.message_clarity = -1;
  }

  // Check brand policy violations
  const policyViolations = checkPolicyViolations(policy, {
    style_mode: concept.style_mode,
    visual_style: concept.visual_style,
    render_family: concept.render_family,
    human_presence: concept.human_presence,
    product_role: concept.product_role,
    headline: concept.headline,
    cta: concept.cta,
  });

  if (policyViolations.length > 0) {
    violations.push(...policyViolations);
    penalties.brand_fit = -2;
  }

  // Check visual_device length (too short = underspecified, too long = confusing)
  if (concept.visual_device.length < 50) {
    violations.push("visual_device too short — underspecified scene");
    penalties.renderability = -2;
  }
  if (concept.visual_device.length > 600) {
    violations.push("visual_device too long — may confuse the renderer");
    penalties.confusion_risk = 2; // Increases confusion
  }

  // Check headline length
  if (concept.headline.length > 50) {
    violations.push(`Headline too long: ${concept.headline.length} chars`);
    penalties.thumb_readability = -1;
  }
  if (concept.headline.length < 3) {
    violations.push("Headline too short");
    penalties.message_clarity = -1;
  }

  return { violations, penalties };
}

// ─── AI-powered scoring ─────────────────────────────────────

/**
 * Score a batch of concepts using Claude as creative critic.
 * Returns scored + ranked concepts.
 */
export async function critiqueConcepts(
  concepts: ConceptSpec[],
  context: FilteredContext,
  policy: BrandStylePolicy,
  keepCount: number
): Promise<ScoredConcept[]> {
  // Run deterministic checks first
  const preChecks = concepts.map((c) => deterministicChecks(c, policy));

  // Hard reject concepts with forbidden style violations
  const hardRejects = new Set<number>();
  preChecks.forEach((check, i) => {
    const hasForbidden = check.violations.some((v) => v.includes("FORBIDDEN"));
    if (hasForbidden) {
      hardRejects.add(i);
    }
  });

  // Try AI scoring
  let aiScores: CriticScores[];
  try {
    aiScores = await aiScoreBatch(concepts, context);
  } catch (err) {
    console.warn("[CreativeCritic] AI scoring failed, using deterministic fallback:", err);
    aiScores = concepts.map((c) => deterministicFallbackScore(c, context));
  }

  // Apply deterministic penalties to AI scores
  const finalScores: CriticScores[] = aiScores.map((score, i) => {
    const { penalties, violations } = preChecks[i];

    // Apply penalties
    const adjusted = { ...score };
    for (const [key, penalty] of Object.entries(penalties)) {
      const k = key as keyof CriticScores;
      if (typeof adjusted[k] === "number") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adjusted as any)[k] = Math.max(
          1,
          Math.min(10, (adjusted[k] as number) + penalty)
        );
      }
    }

    // Recompute composite
    adjusted.composite_score = computeComposite(adjusted);

    // Hard rejects
    if (hardRejects.has(i)) {
      adjusted.composite_score = 0;
      adjusted.pass = false;
      adjusted.rejection_reason = `Policy violation: ${violations.join("; ")}`;
    } else {
      adjusted.pass = adjusted.composite_score >= PASS_THRESHOLD;
      if (!adjusted.pass) {
        adjusted.rejection_reason = `Composite score ${adjusted.composite_score.toFixed(2)} below threshold ${PASS_THRESHOLD}`;
      }
    }

    return adjusted;
  });

  // Build scored concepts and sort by composite
  const scored: ScoredConcept[] = concepts.map((concept, i) => ({
    concept,
    scores: finalScores[i],
    rank: 0, // Will be assigned after sort
  }));

  // Sort descending by composite score
  scored.sort((a, b) => b.scores.composite_score - a.scores.composite_score);

  // Assign ranks
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  // Check stretch budget
  const kept = scored.slice(0, keepCount);
  const stretchCount = countStretchInBatch(
    policy,
    kept.map((s) => s.concept)
  );
  if (stretchCount > policy.max_stretch_per_batch) {
    // Replace excess stretch concepts with non-stretch alternatives from remaining pool
    const remaining = scored.slice(keepCount);
    let replacements = 0;
    const maxReplacements = stretchCount - policy.max_stretch_per_batch;

    for (let i = kept.length - 1; i >= 0 && replacements < maxReplacements; i--) {
      const perm = policy.style_permissions[kept[i].concept.style_mode]?.[kept[i].concept.visual_style];
      if (perm === "stretch") {
        // Find a non-stretch replacement
        const replacement = remaining.find((r) => {
          const rPerm = policy.style_permissions[r.concept.style_mode]?.[r.concept.visual_style];
          return rPerm !== "stretch" && rPerm !== "forbidden";
        });
        if (replacement) {
          const replacedIdx = remaining.indexOf(replacement);
          remaining.splice(replacedIdx, 1);
          remaining.push(kept[i]);
          kept[i] = replacement;
          replacements++;
        }
      }
    }
  }

  // Log results
  const rejected = scored.filter((s) => !s.scores.pass);
  console.log(`[CreativeCritic] Scored ${concepts.length} concepts:`);
  scored.forEach((s) => {
    const status = s.scores.pass ? "✓" : "✗";
    console.log(
      `  ${status} Rank #${s.rank}: ${s.concept.ad_job}/${s.concept.format_family} — ${s.scores.composite_score.toFixed(2)} (renderability: ${s.scores.renderability}/10)`
    );
  });
  console.log(
    `[CreativeCritic] Keeping ${keepCount}/${concepts.length} (${rejected.length} rejected)`
  );

  return scored;
}

// ─── AI scoring via Claude ──────────────────────────────────

async function aiScoreBatch(
  concepts: ConceptSpec[],
  context: FilteredContext
): Promise<CriticScores[]> {
  const client = getClient();

  const conceptsSummary = concepts
    .map(
      (c, i) =>
        `--- CONCEPT ${i + 1} ---
ad_job: ${c.ad_job}
format_family: ${c.format_family}
awareness_stage: ${c.awareness_stage}
marketing_lever: ${c.marketing_lever}
proof_mechanism: ${c.proof_mechanism}
layout_family: ${c.layout_family}
render_family: ${c.render_family}
rupture_structure: ${c.rupture_structure}
visual_style: ${c.visual_style}
style_mode: ${c.style_mode}
human_presence: ${c.human_presence}
product_role: ${c.product_role}
visual_device: ${c.visual_device}
headline: "${c.headline}"
cta: "${c.cta}"
belief_shift: ${c.belief_shift}
proof_text: ${c.proof_text || "none"}
customer_insight: ${c.customer_insight}
realism_target: ${c.realism_target}`
    )
    .join("\n\n");

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `Tu es un critique publicitaire senior pour Meta ads. Tu evalues des CONCEPTS (avant rendu) sur 11 criteres, chacun note de 1 a 10.

CRITERES :
1. stop_scroll (1-10) : Ce concept va-t-il arreter le scroll en 0.3 secondes ?
2. message_clarity (1-10) : Le message est-il instantanement lisible ?
3. ad_likeness (1-10) : Ceci ressemble-t-il a une VRAIE pub Meta performante ?
4. proof_strength (1-10) : Le mecanisme de preuve est-il credible ?
5. visual_hierarchy (1-10) : Y a-t-il un parcours de lecture clair ?
6. thumb_readability (1-10) : Lisible a la taille d'un pouce sur mobile ?
7. product_visibility (1-10) : Le produit est-il assez visible ?
8. brand_fit (1-10) : Coherent avec les codes marque ?
9. novelty (1-10) : Frais et original vs deja-vu ?
10. renderability (1-10) : Un generateur d'images IA peut-il BIEN executer cette scene ?
    - 10 = scene simple, claire, bien definie (objets concrets, eclairage realiste, pas de texte)
    - 5 = scene faisable mais risquee (beaucoup d'elements, perspectives complexes)
    - 1 = scene quasi impossible pour l'IA (abstractions, metaphores visuelles ambigues, trop de personnages)
11. confusion_risk (1-10) : 1=tres clair, 10=tres confus (INVERSE - un score haut est MAUVAIS)

Reponds UNIQUEMENT en JSON valide : un array de ${concepts.length} objets avec ces 11 scores (1-10 chacun).`,
      messages: [
        {
          role: "user",
          content: `Evalue ces ${concepts.length} concepts pour la marque "${context.brand_name}" (produit: ${context.product_name}).

Contexte : ton visuel "${context.brand_visual_code.visual_tone}", awareness "${context.awareness_level}"

${conceptsSummary}

Reponds en JSON : array de ${concepts.length} objets avec les 11 scores (1-10).
Format :
[
  {
    "stop_scroll": <1-10>,
    "message_clarity": <1-10>,
    "ad_likeness": <1-10>,
    "proof_strength": <1-10>,
    "visual_hierarchy": <1-10>,
    "thumb_readability": <1-10>,
    "product_visibility": <1-10>,
    "brand_fit": <1-10>,
    "novelty": <1-10>,
    "renderability": <1-10>,
    "confusion_risk": <1-10>
  }
]`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("CreativeCritic: no text response from Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  const rawScores = JSON.parse(jsonStr.trim()) as Array<{
    stop_scroll: number;
    message_clarity: number;
    ad_likeness: number;
    proof_strength: number;
    visual_hierarchy: number;
    thumb_readability: number;
    product_visibility: number;
    brand_fit: number;
    novelty: number;
    renderability: number;
    confusion_risk: number;
  }>;

  // Validate and convert to CriticScores
  return rawScores.map((raw) => {
    const scores: CriticScores = {
      stop_scroll: clamp(raw.stop_scroll),
      message_clarity: clamp(raw.message_clarity),
      ad_likeness: clamp(raw.ad_likeness),
      proof_strength: clamp(raw.proof_strength),
      visual_hierarchy: clamp(raw.visual_hierarchy),
      thumb_readability: clamp(raw.thumb_readability),
      product_visibility: clamp(raw.product_visibility),
      brand_fit: clamp(raw.brand_fit),
      novelty: clamp(raw.novelty),
      renderability: clamp(raw.renderability),
      confusion_risk: clamp(raw.confusion_risk),
      composite_score: 0,
      pass: false,
    };
    scores.composite_score = computeComposite(scores);
    scores.pass = scores.composite_score >= PASS_THRESHOLD;
    if (!scores.pass) {
      scores.rejection_reason = `Composite score ${scores.composite_score.toFixed(2)} below threshold ${PASS_THRESHOLD}`;
    }
    return scores;
  });
}

// ─── Composite score computation ────────────────────────────

function computeComposite(scores: CriticScores): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const k = key as keyof typeof WEIGHTS;
    let value = scores[k] as number;

    // Invert confusion_risk (high = bad → low composite contribution)
    if (k === "confusion_risk") {
      value = 11 - value; // 1→10, 10→1
    }

    weightedSum += value * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// ─── Deterministic fallback scoring ─────────────────────────

/**
 * If Claude AI fails, provide a basic deterministic score.
 * Better than no scoring at all.
 */
function deterministicFallbackScore(
  concept: ConceptSpec,
  _context: FilteredContext
): CriticScores {
  const scores: CriticScores = {
    // Use planner self-assessment as base
    stop_scroll: Math.min(10, concept.novelty_score + 1),
    message_clarity: concept.clarity_score,
    ad_likeness: 6, // Default — can't judge without AI
    proof_strength: concept.proof_mechanism === "data" || concept.proof_mechanism === "social_proof" ? 7 : 5,
    visual_hierarchy: concept.layout_family.includes("hero") ? 7 : 6,
    thumb_readability: concept.headline.length <= 25 ? 7 : 5,
    product_visibility: concept.product_role === "hero" ? 8 : concept.product_role === "absent" ? 2 : 6,
    brand_fit: concept.brand_fit_score,
    novelty: concept.novelty_score,
    renderability: concept.render_family === "design_led" ? 8 : concept.render_family === "photo_led" ? 6 : 7,
    confusion_risk: concept.visual_device.length > 400 ? 6 : 3,
    composite_score: 0,
    pass: false,
  };

  scores.composite_score = computeComposite(scores);
  scores.pass = scores.composite_score >= PASS_THRESHOLD;
  if (!scores.pass) {
    scores.rejection_reason = `Fallback score ${scores.composite_score.toFixed(2)} below threshold ${PASS_THRESHOLD}`;
  }

  return scores;
}

// ─── Utility ────────────────────────────────────────────────

function clamp(value: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
