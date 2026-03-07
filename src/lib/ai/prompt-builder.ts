import type { PromptLayers } from "./types";
import { FORMAT_TEMPLATES } from "./prompt-templates";

interface Brand {
  name: string;
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  } | null;
  styleGuideText?: string | null;
  scrapedData?: {
    angles: string[];
    promises: string[];
    socialProof: string[];
    tone: string;
  } | null;
}

interface Product {
  name: string;
  category?: string | null;
  usp?: string | null;
  benefits?: string[] | null;
  positioning?: string | null;
}

interface Persona {
  name: string;
  description?: string | null;
  visualStyle?: {
    colorTone: string;
    photographyStyle: string;
    lightingPreference: string;
    compositionNotes: string;
    modelType?: string;
    decorStyle?: string;
  } | null;
  promptModifiers?: string | null;
}

export interface PromptBuildContext {
  brand?: Brand | null;
  product?: Product | null;
  persona?: Persona | null;
  brief?: string;
  formatId: string;
  customInstructions?: string;
  creativeDistance?: number;
}

export function buildPromptLayers(ctx: PromptBuildContext): PromptLayers {
  const layers: PromptLayers = {
    brand: "",
    persona: "",
    brief: "",
    format: "",
    custom: "",
  };

  // Brand Layer
  if (ctx.brand) {
    const parts: string[] = [`Marque : ${ctx.brand.name}.`];
    if (ctx.brand.colorPalette) {
      const p = ctx.brand.colorPalette;
      parts.push(
        `Palette : primaire ${p.primary}, secondaire ${p.secondary}, accent ${p.accent}.`
      );
    }
    if (ctx.brand.scrapedData?.tone) {
      parts.push(`Ton de la marque : ${ctx.brand.scrapedData.tone}.`);
    }
    if (ctx.brand.styleGuideText) {
      parts.push(
        `Guidelines : ${ctx.brand.styleGuideText.slice(0, 300)}`
      );
    }
    if (ctx.product) {
      parts.push(`Produit : ${ctx.product.name}.`);
      if (ctx.product.usp) parts.push(`USP : ${ctx.product.usp}.`);
      if (ctx.product.benefits?.length) {
        parts.push(`Benefices : ${ctx.product.benefits.join(", ")}.`);
      }
      if (ctx.product.positioning) {
        parts.push(`Positionnement : ${ctx.product.positioning}.`);
      }
    }
    layers.brand = parts.filter(Boolean).join(" ");
  }

  // Persona Layer
  if (ctx.persona) {
    const parts: string[] = [];
    parts.push(`Audience cible : ${ctx.persona.name}.`);
    if (ctx.persona.description) parts.push(ctx.persona.description);
    if (ctx.persona.visualStyle) {
      const vs = ctx.persona.visualStyle;
      parts.push(
        `Style visuel : photographie ${vs.photographyStyle}, tons ${vs.colorTone}, eclairage ${vs.lightingPreference}.`
      );
      if (vs.compositionNotes)
        parts.push(`Composition : ${vs.compositionNotes}.`);
      if (vs.modelType) parts.push(`Type de modele : ${vs.modelType}.`);
      if (vs.decorStyle) parts.push(`Style de decor : ${vs.decorStyle}.`);
    }
    if (ctx.persona.promptModifiers) parts.push(ctx.persona.promptModifiers);
    layers.persona = parts.filter(Boolean).join(" ");
  }

  // Brief Layer
  if (ctx.brief) {
    layers.brief = ctx.brief;
  }

  // Format Layer
  layers.format = FORMAT_TEMPLATES[ctx.formatId] || "";

  // Custom Layer
  if (ctx.customInstructions) {
    layers.custom = ctx.customInstructions;
  }

  return layers;
}

export function compilePrompt(
  layers: PromptLayers,
  enabledLayers?: Partial<Record<keyof PromptLayers, boolean>>
): string {
  const order: (keyof PromptLayers)[] = [
    "brand",
    "persona",
    "brief",
    "format",
    "custom",
  ];

  return order
    .filter((key) => {
      if (enabledLayers && enabledLayers[key] === false) return false;
      return layers[key]?.trim();
    })
    .map((key) => layers[key].trim())
    .join("\n\n");
}

const VARIATION_AXES = {
  lighting: [
    "eclairage naturel doux",
    "eclairage studio dramatique",
    "lumiere golden hour chaude",
    "eclairage froid bleu",
    "eclairage neon colore",
    "contre-jour silhouette",
  ],
  composition: [
    "composition centree",
    "regle des tiers",
    "composition diagonale",
    "cadrage symetrique",
    "plongee legere",
    "contre-plongee dynamique",
  ],
  depth: [
    "faible profondeur de champ",
    "focus profond sur tout le cadre",
    "bokeh en arriere-plan",
    "effet tilt-shift",
  ],
  grading: [
    "couleurs chaudes et saturees",
    "couleurs froides et desaturees",
    "haut contraste",
    "tons mats et doux",
    "look film analogique",
    "couleurs vives et pop",
  ],
};

export function generateVariations(
  basePrompt: string,
  count: number
): string[] {
  const axes = Object.values(VARIATION_AXES);

  return Array.from({ length: count }, (_, i) => {
    const mods = axes.map((axis, j) => axis[(i + j) % axis.length]);
    return `${basePrompt}\n\nVariation visuelle : ${mods.join(". ")}.`;
  });
}
