import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import type { BrandRules, BrandRule, BrandRuleCategory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { callClaudeWithRetry } from "./claude-retry";
import { extractJsonFromResponse } from "./json-parser";

const getClient = () => new Anthropic();

interface RejectionContext {
  brandId: string;
  comment: string;
  imageId: string;
}

/**
 * Analyze a rejection comment and automatically generate a brand rule.
 * Called on EVERY rejection with a comment — learns from the first one.
 */
export async function learnFromRejection(ctx: RejectionContext): Promise<BrandRule | null> {
  const { brandId, comment, imageId } = ctx;

  if (!comment || comment.trim().length < 5) {
    return null;
  }

  try {
    // Fetch current brand rules
    const brandResult = await db
      .select({ brandRules: brands.brandRules, name: brands.name })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brandResult[0]) return null;

    const currentRules: BrandRules = brandResult[0].brandRules || { rules: [] };
    const existingRulesText = currentRules.rules.map((r) => `[${r.category}] ${r.text}`).join("\n");

    // Ask Claude to extract a rule from the rejection comment
    const client = getClient();
    const response = await callClaudeWithRetry(() =>
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: `Tu es un assistant qui analyse les retours de rejet sur des visuels publicitaires pour en extraire des regles permanentes.

A partir d'un commentaire de rejet, tu dois:
1. Determiner si le commentaire contient un retour GENERALISABLE (applicable a toutes les futures generations)
2. Si oui, formuler une regle courte et precise
3. Classifier la regle dans une categorie: "copy" (formulation), "visual" (visuels), "concept" (type d'idee), "global" (general)

Retours NON generalisables (ne pas creer de regle):
- Commentaires trop vagues ("pas bien", "je n'aime pas")
- Preferences ponctuelles sur UNE image specifique ("le bleu est trop fonce ici")
- Corrections de detail sans pattern ("la typo est mal placee")

Retours generalisables (creer une regle):
- "Jamais de fond noir" → visual
- "Ne pas utiliser de jeux de mots" → copy
- "Pas de visuels avec des enfants" → visual
- "Eviter les concepts humoristiques" → concept
- "Ne pas mentionner le prix" → copy

Reponds en JSON: { "generalisable": true/false, "rule": "texte de la regle", "category": "copy|visual|concept|global" }
Si non generalisable: { "generalisable": false }`,
        messages: [
          {
            role: "user",
            content: `Marque: ${brandResult[0].name}
Image rejetee: ${imageId}

Commentaire de rejet:
"${comment}"

Regles existantes:
${existingRulesText || "(aucune)"}

Analyse ce commentaire et determine s'il contient une regle generalisable.`,
          },
        ],
      })
    );

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") return null;

    const jsonStr = extractJsonFromResponse(textContent.text);
    const result = JSON.parse(jsonStr) as {
      generalisable: boolean;
      rule?: string;
      category?: BrandRuleCategory;
    };

    if (!result.generalisable || !result.rule || !result.category) {
      console.log(`[RejectionLearner] Comment not generalizable: "${comment.slice(0, 50)}..."`);
      return null;
    }

    // Check for duplicate rules
    const isDuplicate = currentRules.rules.some(
      (existing) =>
        existing.category === result.category &&
        existing.text.toLowerCase().includes(result.rule!.toLowerCase().slice(0, 20))
    );

    if (isDuplicate) {
      console.log(`[RejectionLearner] Rule already exists, skipping: "${result.rule}"`);
      return null;
    }

    // Create the new rule
    const newRule: BrandRule = {
      id: nanoid(),
      text: result.rule,
      category: result.category,
    };

    // Save to DB
    const updatedRules: BrandRules = {
      rules: [...currentRules.rules, newRule],
    };

    await db
      .update(brands)
      .set({ brandRules: updatedRules, updatedAt: new Date().toISOString() })
      .where(eq(brands.id, brandId));

    console.log(`[RejectionLearner] New rule added: [${newRule.category}] "${newRule.text}" (from rejection on image ${imageId})`);

    return newRule;
  } catch (err) {
    console.error("[RejectionLearner] Error:", err);
    return null;
  }
}
