import Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import type { LayoutAnalysis } from "../db/schema";
import sharp from "sharp";

// ============================================================
// LAYOUT ANALYZER
// Analyzes layout inspiration screenshots with Claude Vision
// to extract structured composition data. Run once at import.
// The analysis is stored in DB and injected into the planner
// so Claude understands the visual structure it's assigning.
// ============================================================

const getClient = () => new Anthropic();

/**
 * Analyze a layout screenshot with Claude Vision.
 * Returns a structured LayoutAnalysis describing the composition.
 */
const MAX_IMAGE_BYTES = 4_500_000;

async function resizeIfNeeded(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_IMAGE_BYTES) return buffer;
  let quality = 80;
  let width = 1200;
  let result = buffer;
  while (result.length > MAX_IMAGE_BYTES && width >= 400) {
    result = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    width -= 200;
    quality -= 10;
  }
  return result;
}

export async function analyzeLayoutScreenshot(
  imageBuffer: Buffer,
  layoutFamily: string,
  name: string,
): Promise<LayoutAnalysis> {
  const client = getClient();

  // Resize if too large for Claude Vision
  const processedBuffer = await resizeIfNeeded(imageBuffer);

  const isPng = processedBuffer[0] === 0x89 && processedBuffer[1] === 0x50;
  const mediaType = isPng ? "image/png" as const : "image/jpeg" as const;

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: `Tu es un expert en direction artistique ET strategie publicitaire Meta/Instagram. On te montre un screenshot d'une VRAIE pub. Analyse sa COMPOSITION, sa STRUCTURE, et son INTENTION STRATEGIQUE — pas son contenu specifique (marque, produit). L'objectif est de decrire la structure ET l'intention marketing pour qu'un directeur artistique puisse reproduire cette approche avec un contenu completement different.

Reponds UNIQUEMENT en JSON valide.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: processedBuffer.toString("base64"),
              },
            },
            {
              type: "text",
              text: `Analyse ce screenshot de pub (famille: "${layoutFamily}", nom: "${name}").

Decris SA STRUCTURE DE COMPOSITION — pas le contenu specifique (marque, produit, texte).

JSON attendu:
{
  "grid_structure": "description de la grille/colonnes/lignes (ex: '2 colonnes: gauche 60% image, droite 40% texte sur fond uni')",
  "reading_order": "parcours de l'oeil (ex: 'Z-pattern: headline haut-gauche → image centre → CTA bas-droite')",
  "text_zones": ["zone 1: position + role + taille relative", "zone 2: ..."],
  "product_placement": "ou est le produit, quelle taille, quel fond (ex: 'centre, 40% du cadre, detouré sur fond gradient')",
  "visual_hierarchy": "ordre d'importance visuel (ex: '1. Image produit 2. Headline 3. Sous-texte 4. Logo')",
  "negative_space": "ou est l'espace vide, quel % approximatif, a quoi il sert",
  "color_strategy": "rapport fond/texte/accents (ex: 'fond blanc, texte noir, CTA en couleur accent')",
  "mood": "atmosphere generale en 2-3 mots (ex: 'premium minimaliste', 'urgence promo', 'lifestyle aspirationnel')",
  "key_elements": ["elements structurels notables: badges, barres, separateurs, overlays, cadres..."],
  "composition_summary": "2-3 phrases qui permettent de reproduire cette STRUCTURE avec n'importe quel contenu. Pas de reference au contenu actuel.",
  "strategic_intent": "Quel effet marketing cette structure cherche a produire et pourquoi. Ex: 'Le split 50/50 cree une tension comparative qui force le choix → ideal pour avant_apres, handle_objection'. Ex: 'Le produit surdimensionne en hero ecrase le feed et domine l'attention → ideal pour scroll_stop, product_focus'. Ex: 'La grille de temoignages multiples cree un effet de masse et de validation sociale → ideal pour social_proof, prove'. Sois precis sur le MECANISME psychologique (tension, curiosite, urgence, preuve, desir...) et les ad_jobs/format_families les plus adaptes."
}`,
            },
          ],
        },
      ],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Layout analyzer: no text response from Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);
  const analysis = JSON.parse(jsonStr.trim()) as LayoutAnalysis;

  // Validate required fields
  if (!analysis.grid_structure || !analysis.composition_summary) {
    throw new Error("Layout analyzer: incomplete analysis");
  }

  return analysis;
}

/**
 * Format a layout analysis as a directive for the planner prompt.
 * Compact format — just enough for Claude to understand the structure.
 */
export function formatLayoutAnalysisForPrompt(
  layoutFamily: string,
  analysis: LayoutAnalysis,
): string {
  const lines: string[] = [
    `[Structure "${layoutFamily.replace(/_/g, " ")}"]`,
    `Grille: ${analysis.grid_structure}`,
    `Lecture: ${analysis.reading_order}`,
    `Produit: ${analysis.product_placement}`,
    `Hiérarchie: ${analysis.visual_hierarchy}`,
  ];

  if (analysis.negative_space) {
    lines.push(`Espace vide: ${analysis.negative_space}`);
  }

  if (analysis.strategic_intent) {
    lines.push(`Intention strategique: ${analysis.strategic_intent}`);
  }

  lines.push(`→ ${analysis.composition_summary}`);

  return lines.join("\n");
}

/**
 * Format a layout analysis in COMPACT form for the planner.
 * The planner only needs the strategic intent + grid structure.
 * Full details go to art-director and prompt-builder.
 */
export function formatLayoutAnalysisCompact(
  layoutFamily: string,
  analysis: LayoutAnalysis,
): string {
  const name = layoutFamily.replace(/_/g, " ");
  // Extract first sentence of strategic_intent (the core mechanism)
  const intent = analysis.strategic_intent
    ? analysis.strategic_intent.split(".")[0] + "."
    : "";
  return `[${name}] ${analysis.grid_structure}. ${intent}`;
}
