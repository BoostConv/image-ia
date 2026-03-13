import Anthropic from "@anthropic-ai/sdk";
import type { ConceptSpec, FilteredContext } from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import { getCopywritingFrameworkDirective, getAllHeadlineMechanismsDirective } from "./knowledge/copywriting-framework";

// ============================================================
// STAGE F: COPY EDITOR (lightweight)
// Polishes headline and CTA before composition.
// Uses Claude Haiku for speed and cost efficiency.
// Replaces the brute truncation in deriveCopyAssetsV3.
// ~600 tokens/concept, negligible cost.
// ============================================================

const getClient = () => new Anthropic();

export interface PolishedCopy {
  headline: string;
  cta: string;
  subtitle?: string;
  proof?: string;
}

/**
 * Polish copy for a single concept.
 * Uses Claude Haiku (fast + cheap) to reformulate headlines
 * that exceed the word budget, improve CTA quality, etc.
 */
export async function polishCopy(
  concept: ConceptSpec,
  context: FilteredContext,
): Promise<PolishedCopy> {
  const headlineWords = concept.headline.split(/\s+/).length;

  // If headline is already within budget and CTA looks good, skip the AI call
  if (headlineWords <= 7 && concept.cta.length >= 4 && concept.cta.length <= 25) {
    return {
      headline: concept.headline,
      cta: concept.cta,
      subtitle: undefined,
      proof: concept.proof_text || undefined,
    };
  }

  const client = getClient();

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `Tu es un copywriter direct-response expert en ads statiques Meta. Tu REFORMULES le copy pour qu'il tienne dans les budgets sans perdre l'impact emotionnel.

${getCopywritingFrameworkDirective("composer")}

13 MECANISMES DE HEADLINE:
${getAllHeadlineMechanismsDirective()}

REGLES STRICTES:
- Headline: max 7 mots, FRANCAIS, doit arreter le scroll en 1 seconde
- CTA: 2-5 mots, action concrete, JAMAIS "Acheter maintenant" ou "En savoir plus"
- Preserver le registre emotionnel et le mecanisme du concept original
- Si la headline originale est deja bonne et dans le budget → la retourner INCHANGEE
- JAMAIS de tirets longs (—) dans le copy

Reponds UNIQUEMENT en JSON valide.`,
      messages: [
        {
          role: "user",
          content: `Reformule ce copy pour qu'il tienne dans les budgets :

HEADLINE ORIGINALE (${headlineWords} mots): "${concept.headline}"
CTA ORIGINAL: "${concept.cta}"
PROOF: "${concept.proof_text || "aucun"}"

CONTEXTE:
- Produit: ${context.product_name}
- Marque: ${context.brand_name}
- Promesse: ${context.promise}
- Tension: ${context.audience_tension}
- Ad Job: ${concept.ad_job}
- Marketing Lever: ${concept.marketing_lever}

=== FORMAT JSON ===
{
  "headline": "headline reformulee (max 7 mots)",
  "cta": "CTA 2-5 mots",
  "subtitle": "sous-texte optionnel (15-25 mots) ou null",
  "proof": "texte preuve ou null"
}`,
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    // Fallback: truncate manually
    return {
      headline: concept.headline.split(/\s+/).slice(0, 7).join(" "),
      cta: concept.cta,
      proof: concept.proof_text || undefined,
    };
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const polished = JSON.parse(jsonStr.trim()) as PolishedCopy;

    // Safety: enforce max 7 words even after AI
    const words = polished.headline.split(/\s+/);
    if (words.length > 7) {
      polished.headline = words.slice(0, 7).join(" ");
    }

    // Ensure CTA is present
    if (!polished.cta || polished.cta.length < 2) {
      polished.cta = concept.cta;
    }

    // Handle null subtitle/proof
    if (polished.subtitle === null || polished.subtitle === "null") {
      polished.subtitle = undefined;
    }
    if (polished.proof === null || polished.proof === "null") {
      polished.proof = undefined;
    }

    return polished;
  } catch {
    // Fallback on parse error
    return {
      headline: concept.headline.split(/\s+/).slice(0, 7).join(" "),
      cta: concept.cta,
      proof: concept.proof_text || undefined,
    };
  }
}

/**
 * Polish copy for a batch of concepts in parallel.
 */
export async function polishCopyBatch(
  concepts: ConceptSpec[],
  context: FilteredContext,
): Promise<PolishedCopy[]> {
  return Promise.all(
    concepts.map((concept) => polishCopy(concept, context))
  );
}
