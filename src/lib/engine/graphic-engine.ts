import sharp from "sharp";
import { AD_DIMENSIONS } from "../ai/ad-types";

// ============================================================
// GRAPHIC ENGINE — Programmatic ad composition (NO AI)
//
// For product-centric ads (Goli, Harry's, Dermalogica style),
// this produces MUCH better results than AI-generated scenes:
//
// 1. Background: gradient from brand colors (SVG → Sharp)
// 2. Product: REAL photo composited with drop shadow
// 3. Text: added later by the Composer (SVG overlay)
//
// Why this is better than Gemini for product ads:
// - 100% consistent, professional backgrounds
// - Product is the REAL packaging (not AI-hallucinated)
// - Text is pixel-perfect (Sharp SVG, not AI-rendered)
// - Instant (no API call, no rate limiting)
// ============================================================

export type GradientStyle = "vertical" | "diagonal" | "radial" | "solid" | "split_horizontal";
export type ProductPosition = "center" | "left" | "right" | "center_bottom";

export interface GraphicAdConfig {
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradientStyle: GradientStyle;
  productPosition: ProductPosition;
  productScale: number; // 0.3 to 0.75
}

// ─── COLOR UTILITIES ─────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}

function darkenHex(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.round(r * (1 - factor));
  const dg = Math.round(g * (1 - factor));
  const db = Math.round(b * (1 - factor));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── BACKGROUND CREATION ─────────────────────────────────────

/**
 * Create a professional gradient background using SVG → Sharp.
 * No AI, instant, always high quality.
 */
export async function createBackground(config: GraphicAdConfig): Promise<Buffer> {
  const { width, height, primaryColor, secondaryColor, gradientStyle } = config;
  const darkPrimary = darkenHex(primaryColor, 0.4);

  let gradientDef: string;

  switch (gradientStyle) {
    case "vertical":
      gradientDef = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="100%" stop-color="${escapeXml(darkPrimary)}"/>
      </linearGradient>`;
      break;

    case "diagonal":
      gradientDef = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="100%" stop-color="${escapeXml(secondaryColor)}"/>
      </linearGradient>`;
      break;

    case "radial":
      gradientDef = `<radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="100%" stop-color="${escapeXml(darkPrimary)}"/>
      </radialGradient>`;
      break;

    case "split_horizontal":
      gradientDef = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="48%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="52%" stop-color="${escapeXml(secondaryColor)}"/>
        <stop offset="100%" stop-color="${escapeXml(secondaryColor)}"/>
      </linearGradient>`;
      break;

    case "solid":
    default:
      gradientDef = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="0">
        <stop offset="0%" stop-color="${escapeXml(primaryColor)}"/>
        <stop offset="100%" stop-color="${escapeXml(primaryColor)}"/>
      </linearGradient>`;
      break;
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>${gradientDef}</defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── PRODUCT BACKGROUND REMOVAL ──────────────────────────────

/**
 * Remove white/light background from a product photo.
 * Uses threshold + feathering for soft edges.
 * Works well for product photos on white/light backgrounds.
 */
export async function removeWhiteBackground(
  productBuffer: Buffer,
  threshold = 235,
  feather = 20
): Promise<Buffer> {
  const image = sharp(productBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;

    if (brightness > threshold) {
      // Clearly background → fully transparent
      data[i + 3] = 0;
    } else if (brightness > threshold - feather) {
      // Feathered edge → gradual transparency
      const alpha = Math.round(((threshold - brightness) / feather) * 255);
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
    // else: keep original alpha (product pixels)
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

// ─── PRODUCT COMPOSITING ─────────────────────────────────────

/**
 * Composite a product photo onto a background.
 * Handles: background removal, resize, positioning, drop shadow.
 */
export async function compositeProduct(
  background: Buffer,
  productImage: Buffer,
  position: ProductPosition,
  scale: number,
  canvasWidth: number,
  canvasHeight: number
): Promise<Buffer> {
  // Step 1: Remove white background
  const cleanProduct = await removeWhiteBackground(productImage);

  // Step 2: Resize product to target scale
  const targetHeight = Math.round(canvasHeight * Math.min(scale, 0.75));
  const resizedProduct = await sharp(cleanProduct)
    .resize({ height: targetHeight, fit: "inside" })
    .png()
    .toBuffer();

  const productMeta = await sharp(resizedProduct).metadata();
  const pw = productMeta.width || 300;
  const ph = productMeta.height || 300;

  // Step 3: Calculate position
  let left: number;
  let top: number;

  switch (position) {
    case "left":
      left = Math.round(canvasWidth * 0.05);
      top = Math.round((canvasHeight - ph) / 2);
      break;
    case "right":
      left = Math.round(canvasWidth - pw - canvasWidth * 0.05);
      top = Math.round((canvasHeight - ph) / 2);
      break;
    case "center_bottom":
      left = Math.round((canvasWidth - pw) / 2);
      top = Math.round(canvasHeight - ph - canvasHeight * 0.08);
      break;
    case "center":
    default:
      left = Math.round((canvasWidth - pw) / 2);
      top = Math.round((canvasHeight - ph) / 2);
      break;
  }

  // Step 4: Create drop shadow (blurred, darkened copy offset slightly)
  const shadowBlur = Math.max(8, Math.round(canvasWidth * 0.015));
  const shadowOffset = Math.max(4, Math.round(canvasWidth * 0.005));

  let shadowBuffer: Buffer;
  try {
    shadowBuffer = await sharp(resizedProduct)
      .ensureAlpha()
      // Make all non-transparent pixels black
      .tint({ r: 0, g: 0, b: 0 })
      .blur(shadowBlur)
      .png()
      .toBuffer();
  } catch {
    // If tint fails, skip shadow
    shadowBuffer = Buffer.alloc(0);
  }

  // Step 5: Composite everything
  const layers: sharp.OverlayOptions[] = [];

  // Shadow layer (if created)
  if (shadowBuffer.length > 0) {
    layers.push({
      input: shadowBuffer,
      top: top + shadowOffset,
      left: left + shadowOffset,
      blend: "over" as const,
    });
  }

  // Product layer
  layers.push({
    input: resizedProduct,
    top,
    left,
    blend: "over" as const,
  });

  return sharp(background).composite(layers).png().toBuffer();
}

// ─── MAIN: BUILD GRAPHIC AD ─────────────────────────────────

/**
 * Build a complete graphic ad (background + product).
 * Text will be added by the Composer in the next pipeline step.
 */
export async function buildGraphicAd(
  productImage: Buffer,
  config: GraphicAdConfig
): Promise<Buffer> {
  console.log(
    `[GraphicEngine] Building ad: ${config.gradientStyle} gradient, product ${config.productPosition}, scale ${config.productScale}`
  );

  const bg = await createBackground(config);
  return compositeProduct(
    bg,
    productImage,
    config.productPosition,
    config.productScale,
    config.width,
    config.height
  );
}

// ─── BATCH VARIETY ───────────────────────────────────────────

/**
 * Generate diverse configs for a batch of graphic ads.
 * Rotates through gradient styles, positions, and color combos
 * to ensure visual variety across the batch.
 */
export function generateBatchConfigs(
  count: number,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  aspectRatio: string
): GraphicAdConfig[] {
  const dims = AD_DIMENSIONS[aspectRatio] || AD_DIMENSIONS["1:1"];

  const gradients: GradientStyle[] = ["vertical", "diagonal", "radial", "solid", "split_horizontal"];
  const positions: ProductPosition[] = ["center", "center_bottom", "right", "left", "center"];
  const scales = [0.55, 0.50, 0.60, 0.45, 0.65];

  // Color combos for variety: rotate primary/secondary/accent
  const colorCombos: Array<{ primary: string; secondary: string }> = [
    { primary: primaryColor, secondary: secondaryColor },
    { primary: secondaryColor, secondary: primaryColor },
    { primary: accentColor, secondary: primaryColor },
    { primary: primaryColor, secondary: accentColor },
    { primary: darkenHex(primaryColor, 0.2), secondary: primaryColor },
  ];

  const configs: GraphicAdConfig[] = [];
  for (let i = 0; i < count; i++) {
    configs.push({
      width: dims.width,
      height: dims.height,
      primaryColor: colorCombos[i % colorCombos.length].primary,
      secondaryColor: colorCombos[i % colorCombos.length].secondary,
      accentColor,
      gradientStyle: gradients[i % gradients.length],
      productPosition: positions[i % positions.length],
      productScale: scales[i % scales.length],
    });
  }

  return configs;
}
