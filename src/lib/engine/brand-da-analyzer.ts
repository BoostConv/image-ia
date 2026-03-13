import Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithRetry } from "../ai/claude-retry";
import { extractJsonFromResponse } from "@/lib/ai/json-parser";
import type { BrandStylePolicy } from "./brand-style-policy";
import type { VisualStyle, StyleMode } from "./taxonomy";

// ============================================================
// BRAND DA ANALYZER
// Extracts the real visual direction from brand style images
// using Claude Vision. Produces a BrandDAFingerprint that
// enriches the inferred BrandStylePolicy.
//
// Quick win: 1 Vision call on 3-5 brand images → structured DA.
// Corrects the gap between declared brief and actual visual reality.
// ============================================================

const getClient = () => new Anthropic();

export interface BrandDAFingerprint {
  // ─── COLOR ─────────────────────────────────────────────
  dominant_colors: string[];         // Actual hex colors observed
  color_temperature: "warm" | "cool" | "neutral" | "mixed";
  color_saturation: "low" | "medium" | "high";
  uses_gradients: boolean;
  gradient_style?: string;          // e.g., "linear warm-to-dark", "radial center glow"

  // ─── PHOTOGRAPHY ───────────────────────────────────────
  photo_style: string;              // e.g., "studio product on solid bg", "lifestyle outdoor"
  lighting_style: string;           // e.g., "soft diffused", "dramatic side light", "natural golden hour"
  camera_angles: string[];          // e.g., ["eye-level", "slight high angle"]
  depth_of_field: "shallow" | "medium" | "deep";
  mood: string;                     // e.g., "clean and premium", "raw and energetic"

  // ─── COMPOSITION ───────────────────────────────────────
  layout_patterns: string[];        // e.g., ["center hero", "left product right copy"]
  negative_space_usage: "minimal" | "moderate" | "generous";
  product_to_lifestyle_ratio: number; // 0.0 (all lifestyle) to 1.0 (all product)
  text_placement_patterns: string[];  // e.g., ["top overlay", "bottom bar"]

  // ─── TYPOGRAPHY (observed) ─────────────────────────────
  font_weight_dominant: "light" | "regular" | "bold" | "black";
  text_case_dominant: "uppercase" | "lowercase" | "mixed" | "sentence";
  text_color_strategy: string;      // e.g., "white on dark", "brand color on light"

  // ─── TEXTURE & MATERIALS ───────────────────────────────
  recurring_textures: string[];     // e.g., ["matte surfaces", "natural wood", "water drops"]
  background_treatments: string[];  // e.g., ["solid color", "blurred lifestyle", "gradient"]

  // ─── BRAND PERSONALITY (visual) ────────────────────────
  visual_personality: string;       // 3-5 word summary, e.g., "clean premium masculine minimalist"
  closest_visual_styles: VisualStyle[]; // Top 2-3 matching taxonomy styles

  // ─── CONFIDENCE ────────────────────────────────────────
  image_count_analyzed: number;
  confidence: number;               // 0.0-1.0
}

/**
 * Analyze brand style images with Claude Vision to extract
 * the real visual direction fingerprint.
 *
 * @param images Buffer array of brand style images (3-5 recommended)
 * @param brandName Brand name for context
 * @returns BrandDAFingerprint
 */
export async function analyzeBrandDA(
  images: Buffer[],
  brandName: string,
): Promise<BrandDAFingerprint> {
  if (images.length === 0) {
    throw new Error("analyzeBrandDA: no images provided");
  }

  const client = getClient();

  // Limit to 5 images max to control costs
  const imagesToAnalyze = images.slice(0, 5);

  const imageContents: Anthropic.Messages.ContentBlockParam[] = [];

  imageContents.push({
    type: "text",
    text: `Analyse ces ${imagesToAnalyze.length} visuels existants de la marque "${brandName}". Extrais la VRAIE direction artistique observee — pas ce que le brief dit, mais ce que les images montrent reellement.`,
  });

  for (let i = 0; i < imagesToAnalyze.length; i++) {
    const base64 = imagesToAnalyze[i].toString("base64");
    // Try to detect if PNG or JPEG from magic bytes
    const isPng = imagesToAnalyze[i][0] === 0x89 && imagesToAnalyze[i][1] === 0x50;
    const mediaType = isPng ? "image/png" as const : "image/jpeg" as const;

    imageContents.push({
      type: "text",
      text: `--- Image ${i + 1} ---`,
    });
    imageContents.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64,
      },
    });
  }

  imageContents.push({
    type: "text",
    text: `=== ANALYSE STRUCTUREE ===
Observe TOUS les visuels et extrais les patterns recurrents. Si un element n'apparait que dans 1 image sur 5, c'est une exception, pas un pattern.

Reponds en JSON:
{
  "dominant_colors": ["#hex1", "#hex2", "#hex3"],
  "color_temperature": "warm|cool|neutral|mixed",
  "color_saturation": "low|medium|high",
  "uses_gradients": true/false,
  "gradient_style": "description ou null",

  "photo_style": "description du style photo dominant",
  "lighting_style": "description eclairage recurrent",
  "camera_angles": ["angle1", "angle2"],
  "depth_of_field": "shallow|medium|deep",
  "mood": "atmosphere en 3-5 mots",

  "layout_patterns": ["pattern1", "pattern2"],
  "negative_space_usage": "minimal|moderate|generous",
  "product_to_lifestyle_ratio": 0.0-1.0,
  "text_placement_patterns": ["placement1", "placement2"],

  "font_weight_dominant": "light|regular|bold|black",
  "text_case_dominant": "uppercase|lowercase|mixed|sentence",
  "text_color_strategy": "description",

  "recurring_textures": ["texture1", "texture2"],
  "background_treatments": ["treatment1", "treatment2"],

  "visual_personality": "3-5 mots definissant la personnalite visuelle",
  "closest_visual_styles": ["style1", "style2"],
  "confidence": 0.0-1.0
}

Pour closest_visual_styles, choisis parmi: quiet_luxury, hyper_clean_tech, editorial_fashion, organic_earthy, vibrant_street, gritty_industrial, dreamcore, pop_high_saturation`,
  });

  const response = await callClaudeWithRetry(() =>
    client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: "Tu es un directeur artistique senior. Tu analyses des visuels de marque pour extraire la direction artistique reelle. Sois precis et factuel — decris ce que tu VOIS, pas ce que tu supposes. Reponds UNIQUEMENT en JSON valide.",
      messages: [{ role: "user", content: imageContents }],
    })
  );

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("analyzeBrandDA: no text response from Claude");
  }

  const jsonStr = extractJsonFromResponse(textContent.text);

  try {
    const raw = JSON.parse(jsonStr.trim());

    const fingerprint: BrandDAFingerprint = {
      dominant_colors: raw.dominant_colors || [],
      color_temperature: raw.color_temperature || "neutral",
      color_saturation: raw.color_saturation || "medium",
      uses_gradients: raw.uses_gradients ?? false,
      gradient_style: raw.gradient_style || undefined,

      photo_style: raw.photo_style || "standard product photography",
      lighting_style: raw.lighting_style || "studio lighting",
      camera_angles: raw.camera_angles || ["eye-level"],
      depth_of_field: raw.depth_of_field || "medium",
      mood: raw.mood || "professional",

      layout_patterns: raw.layout_patterns || [],
      negative_space_usage: raw.negative_space_usage || "moderate",
      product_to_lifestyle_ratio: typeof raw.product_to_lifestyle_ratio === "number"
        ? Math.max(0, Math.min(1, raw.product_to_lifestyle_ratio)) : 0.5,
      text_placement_patterns: raw.text_placement_patterns || [],

      font_weight_dominant: raw.font_weight_dominant || "bold",
      text_case_dominant: raw.text_case_dominant || "mixed",
      text_color_strategy: raw.text_color_strategy || "white on dark",

      recurring_textures: raw.recurring_textures || [],
      background_treatments: raw.background_treatments || [],

      visual_personality: raw.visual_personality || "professional clean",
      closest_visual_styles: (raw.closest_visual_styles || []) as VisualStyle[],

      image_count_analyzed: imagesToAnalyze.length,
      confidence: typeof raw.confidence === "number"
        ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
    };

    console.log(`[BrandDA] Analyzed ${fingerprint.image_count_analyzed} images for "${brandName}":`, {
      personality: fingerprint.visual_personality,
      styles: fingerprint.closest_visual_styles,
      mood: fingerprint.mood,
      photoStyle: fingerprint.photo_style,
      confidence: fingerprint.confidence,
    });

    return fingerprint;
  } catch (e) {
    console.error("[BrandDA] JSON parse error:", jsonStr.slice(0, 300));
    throw new Error(`analyzeBrandDA: JSON invalide — ${(e as Error).message}`);
  }
}

/**
 * Enrich a BrandStylePolicy with insights from the DA fingerprint.
 * Adjusts style permissions, render preferences, and constraints
 * based on what the brand ACTUALLY does visually.
 */
export function enrichPolicyWithDA(
  policy: BrandStylePolicy,
  fingerprint: BrandDAFingerprint,
): BrandStylePolicy {
  const enriched = structuredClone(policy);

  // Only apply if confidence is sufficient
  if (fingerprint.confidence < 0.4) {
    console.log("[BrandDA] Low confidence — skipping policy enrichment");
    return enriched;
  }

  // ─── Adjust style permissions based on closest styles ─────
  const observedStyles = fingerprint.closest_visual_styles;

  if (observedStyles.length > 0) {
    // Promote observed styles to "allowed" in brand_native
    for (const style of observedStyles) {
      if (enriched.style_permissions.brand_native[style]) {
        enriched.style_permissions.brand_native[style] = "allowed";
      }
      if (enriched.style_permissions.brand_adjacent[style]) {
        enriched.style_permissions.brand_adjacent[style] = "allowed";
      }
    }
  }

  // ─── Adjust render family preferences ─────────────────────
  if (fingerprint.product_to_lifestyle_ratio > 0.7) {
    // Heavy product focus → prefer design_led
    if (!enriched.preferred_render_families.includes("design_led")) {
      enriched.preferred_render_families.unshift("design_led");
    }
  } else if (fingerprint.product_to_lifestyle_ratio < 0.3) {
    // Heavy lifestyle → prefer photo_led
    enriched.preferred_render_families = ["photo_led", "hybrid", "design_led"];
  }

  // ─── Color constraints from observed palette ──────────────
  if (fingerprint.color_saturation === "low") {
    enriched.color_constraints.allow_neon = false;
  }

  // ─── Product constraints from observed patterns ────────────
  if (fingerprint.negative_space_usage === "generous") {
    enriched.product_constraints.min_product_scale = Math.max(
      enriched.product_constraints.min_product_scale,
      0.15,
    );
  }

  // ─── Copy constraints from observed typography ─────────────
  if (fingerprint.font_weight_dominant === "light") {
    enriched.copy_constraints.tone_rules.push("Typographie legere — eviter les headlines trop agressives");
  }

  return enriched;
}

/**
 * Format the DA fingerprint as a compact directive for prompts.
 * Injected into art director and prompt builder for style consistency.
 */
export function formatDAFingerprintForPrompt(fingerprint: BrandDAFingerprint): string {
  const parts: string[] = [
    `=== DIRECTION ARTISTIQUE OBSERVEE (analyse de ${fingerprint.image_count_analyzed} visuels marque) ===`,
    `Personnalite visuelle: ${fingerprint.visual_personality}`,
    `Style photo: ${fingerprint.photo_style}`,
    `Eclairage: ${fingerprint.lighting_style}`,
    `Mood: ${fingerprint.mood}`,
    `Couleurs dominantes: ${fingerprint.dominant_colors.join(", ")} (${fingerprint.color_temperature}, saturation ${fingerprint.color_saturation})`,
  ];

  if (fingerprint.uses_gradients && fingerprint.gradient_style) {
    parts.push(`Degrades: ${fingerprint.gradient_style}`);
  }

  parts.push(`Ratio produit/lifestyle: ${Math.round(fingerprint.product_to_lifestyle_ratio * 100)}% produit`);
  parts.push(`Espace negatif: ${fingerprint.negative_space_usage}`);

  if (fingerprint.recurring_textures.length > 0) {
    parts.push(`Textures recurrentes: ${fingerprint.recurring_textures.join(", ")}`);
  }

  if (fingerprint.background_treatments.length > 0) {
    parts.push(`Fonds: ${fingerprint.background_treatments.join(", ")}`);
  }

  parts.push(`Typo: ${fingerprint.font_weight_dominant}, ${fingerprint.text_case_dominant}, ${fingerprint.text_color_strategy}`);

  if (fingerprint.layout_patterns.length > 0) {
    parts.push(`Layouts recurrents: ${fingerprint.layout_patterns.join(", ")}`);
  }

  // ─── Framing: socle vs exploration ─────────────────────
  parts.push("");
  parts.push("→ SOCLE A CONSERVER (non negociable):");
  parts.push("  - Palette de couleurs et temperature (chaud/froid) coherentes avec l'existant");
  parts.push("  - Niveau de qualite et de finition equivalent");
  parts.push("  - Personnalite de marque reconnaissable (un client fidele doit reconnaitre la marque)");
  parts.push("");
  parts.push("→ TERRITOIRE D'EXPLORATION (encourage):");
  parts.push("  - Angles camera, cadrages et compositions DIFFERENTS de l'existant");
  parts.push("  - Ambiances et contextes nouveaux (pas toujours le meme decor)");
  parts.push("  - Mecanismes visuels surprenants (rupture, metaphore, macro, etc.)");
  parts.push("  - Layouts et structures jamais testes par la marque");
  parts.push("  - Registres emotionnels varies (pas toujours le meme mood)");
  parts.push("");
  parts.push("L'objectif est de FAIRE EVOLUER la DA, pas de la reproduire. La marque doit etre reconnaissable mais jamais monotone.");

  return parts.join("\n");
}
