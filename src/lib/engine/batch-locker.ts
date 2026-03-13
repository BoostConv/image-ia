import Anthropic from "@anthropic-ai/sdk";
import type { FilteredContext, BatchLockConfig } from "./types";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";

// ============================================================
// COMPONENT J: BATCH LOCKER
// Derives campaign-level locked values shared by all concepts.
// Ensures strategic coherence across a batch.
// Single Claude call per batch.
// ============================================================

const getClient = () => new Anthropic();

/**
 * Lock the batch: derive a campaign thesis, promise, and proof
 * that ALL concepts in the batch will share.
 * Concepts vary archetype/hook/composition but NOT the core message.
 */
export async function lockBatch(
  context: FilteredContext,
  _count: number
): Promise<BatchLockConfig> {
  const client = getClient();

  const response = await callClaudeWithRetry(() => client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `Tu es un strategiste de campagne publicitaire. Ta mission : definir le socle strategique commun pour un batch de variantes publicitaires Meta.

Tous les visuels du batch doivent partager la meme these, la meme promesse et la meme preuve. Seuls l'archetype visuel, le hook, la composition et l'ambiance varient.

Reponds UNIQUEMENT en JSON valide.`,
    messages: [
      {
        role: "user",
        content: `Definis le socle strategique pour ce batch :

Marque: ${context.brand_name}
Produit: ${context.product_name}
Benefice cle: ${context.product_key_benefit}
Tension audience: ${context.audience_tension}
Promesse brute: ${context.promise}
Preuve brute: ${context.proof}
Angle emotionnel: ${context.emotional_angle}
Niveau de conscience: ${context.awareness_level}

=== FORMAT ===
{
  "campaignThesis": "La these de campagne en 1 phrase (ex: 'Le cafe premium ne devrait pas detruire la planete')",
  "lockedPromise": "La promesse unique, formulee pour la pub (ex: 'Un espresso parfait, zero dechet')",
  "lockedProof": "La preuve la plus forte, formulee visuellement (ex: 'Capsule inox reutilisable 10 000 fois')"
}`,
      },
    ],
  }));

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("BatchLocker: pas de reponse textuelle");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const lock = JSON.parse(jsonStr.trim()) as BatchLockConfig;
    console.log("[BatchLocker] Locked:", {
      thesis: lock.campaignThesis.slice(0, 60),
      promise: lock.lockedPromise.slice(0, 60),
      proof: lock.lockedProof.slice(0, 60),
    });
    return lock;
  } catch (e) {
    console.error("[BatchLocker] JSON parse error:", jsonStr.slice(0, 200));
    throw new Error(`BatchLocker: JSON invalide — ${(e as Error).message}`);
  }
}
