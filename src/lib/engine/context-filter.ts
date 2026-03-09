import Anthropic from "@anthropic-ai/sdk";
import type { RawPipelineInput, FilteredContext } from "./types";

// ============================================================
// LAYER A: CONTEXT FILTER
// Reduces raw brand/product/persona data to what matters for ONE ad.
// Extracts audience tension, promise, proof, emotional angle.
// ============================================================

const getClient = () => new Anthropic();

export async function filterContext(input: RawPipelineInput): Promise<FilteredContext> {
  const client = getClient();

  const rawContext = buildRawContextDump(input);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Tu es un strategiste publicitaire senior. Ta mission : extraire d'un contexte brut les SEULS elements qui comptent pour creer une publicite performante sur Meta (Facebook/Instagram).

Ne garde que l'essentiel. Pas de blabla. Chaque champ doit etre actionnable pour un directeur creatif.

Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.`,
    messages: [
      {
        role: "user",
        content: `Analyse ce contexte brut et extrais les elements strategiques pour creer des ads performantes.

=== CONTEXTE BRUT ===
${rawContext}

=== FORMAT DE SORTIE ===
{
  "audience_tension": "La tension/frustration principale de l'audience cible (1 phrase percutante)",
  "promise": "La promesse unique du produit (1 phrase)",
  "proof": "La preuve la plus forte pour soutenir la promesse (fait, chiffre, mecanisme)",
  "emotional_angle": "L'emotion dominante a exploiter (peur, desir, fierte, liberation, etc.)",
  "awareness_level": "unaware|problem_aware|solution_aware|product_aware|most_aware",
  "brand_visual_code": {
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "accent_color": "#hex",
    "font_style": "style de police dominant (serif, sans-serif, display, etc.)",
    "visual_tone": "description du ton visuel en 3-5 mots (ex: premium minimaliste chaleureux)"
  },
  "format_goal": "Objectif specifique du format (ex: arreter le scroll dans un feed Instagram carre)",
  "constraints": ["contrainte 1 (ex: pas de rouge)", "contrainte 2"],
  "brief_summary": "Resume du brief en 1 phrase si brief fourni, sinon null",
  "product_name": "Nom exact du produit",
  "product_key_benefit": "Le benefice #1 a communiquer visuellement",
  "brand_name": "Nom de la marque"
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Context filter: pas de reponse textuelle de Claude");
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    const parsed = JSON.parse(jsonStr.trim()) as FilteredContext;
    console.log("[ContextFilter] Filtered context:", {
      tension: parsed.audience_tension,
      promise: parsed.promise,
      awareness: parsed.awareness_level,
      product: parsed.product_name,
    });
    return parsed;
  } catch (e) {
    console.error("[ContextFilter] JSON parse error:", jsonStr.slice(0, 200));
    throw new Error(`Context filter: JSON invalide — ${(e as Error).message}`);
  }
}

function buildRawContextDump(input: RawPipelineInput): string {
  const parts: string[] = [];

  // Brand
  parts.push(`MARQUE: ${input.brand.name}`);
  if (input.brand.description) parts.push(`Description: ${input.brand.description}`);
  if (input.brand.positioning) parts.push(`Positionnement: ${input.brand.positioning}`);
  if (input.brand.tone) parts.push(`Ton: ${input.brand.tone}`);
  if (input.brand.targetMarket) parts.push(`Marche cible: ${input.brand.targetMarket}`);
  if (input.brand.colorPalette) {
    parts.push(`Couleurs: primaire ${input.brand.colorPalette.primary}, secondaire ${input.brand.colorPalette.secondary}, accent ${input.brand.colorPalette.accent}`);
  }
  if (input.brand.typography) {
    parts.push(`Typo: titres ${input.brand.typography.headingFont}, corps ${input.brand.typography.bodyFont}`);
  }

  // Product
  if (input.product) {
    parts.push(`\nPRODUIT: ${input.product.name}`);
    if (input.product.category) parts.push(`Categorie: ${input.product.category}`);
    if (input.product.usp) parts.push(`USP: ${input.product.usp}`);
    if (input.product.benefits?.length) parts.push(`Benefices: ${input.product.benefits.join(" | ")}`);
    if (input.product.competitiveAdvantage) parts.push(`Avantage concurrentiel: ${input.product.competitiveAdvantage}`);
    if (input.product.marketingArguments) {
      const ma = input.product.marketingArguments;
      if (ma.headlines?.length) parts.push(`Headlines: ${ma.headlines.join(" | ")}`);
      if (ma.hooks?.length) parts.push(`Hooks: ${ma.hooks.join(" | ")}`);
      if (ma.emotionalTriggers?.length) parts.push(`Triggers: ${ma.emotionalTriggers.join(", ")}`);
      if (ma.socialProof?.length) parts.push(`Preuves: ${ma.socialProof.join(", ")}`);
    }
  }

  // Persona
  if (input.persona) {
    parts.push(`\nPERSONA: ${input.persona.name}`);
    if (input.persona.description) parts.push(`Description: ${input.persona.description}`);
    if (input.persona.psychographics?.painPoints?.length)
      parts.push(`Douleurs: ${input.persona.psychographics.painPoints.join(", ")}`);
    if (input.persona.psychographics?.motivations?.length)
      parts.push(`Motivations: ${input.persona.psychographics.motivations.join(", ")}`);
  }

  // Brief
  if (input.brief) parts.push(`\nBRIEF: ${input.brief}`);

  // Format
  parts.push(`\nFORMAT: ${input.format} (${input.aspectRatio})`);

  // Guidelines (already compiled — keep short)
  if (input.guidelinesPrompt) parts.push(`\nGUIDELINES (resume): ${input.guidelinesPrompt.slice(0, 500)}`);

  // Documents
  if (input.documentsPrompt) parts.push(`\nDOCUMENTS MARQUE (resume): ${input.documentsPrompt.slice(0, 500)}`);

  // Inspirations
  if (input.inspirationPrompt) parts.push(`\nINSPIRATIONS ADS (resume): ${input.inspirationPrompt.slice(0, 500)}`);

  return parts.join("\n");
}
