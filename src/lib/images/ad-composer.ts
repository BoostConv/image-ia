import sharp from "sharp";
import type { AdConcept, AdCompositionInput } from "../ai/ad-types";

// ============================================================
// AD COMPOSER — Composites background + product + text + logo
// Uses Sharp with SVG overlay for text rendering
// ============================================================

const FONT_FAMILIES: Record<string, string> = {
  bold_sans: "Arial, Helvetica, sans-serif",
  elegant_serif: "Georgia, 'Times New Roman', serif",
  modern_minimal: "Helvetica, Arial, sans-serif",
  playful: "'Comic Sans MS', 'Trebuchet MS', sans-serif",
  luxury: "Georgia, 'Palatino Linotype', serif",
};

const HEADLINE_SIZES: Record<string, number> = {
  small: 48,
  medium: 64,
  large: 80,
  xl: 96,
};

export async function composeAd(input: AdCompositionInput): Promise<Buffer> {
  const { concept, backgroundImage, productImage, logoImage, width, height } = input;

  // Step 1: Resize background to target dimensions
  let composite = sharp(backgroundImage).resize(width, height, { fit: "cover" });

  // Step 2: Apply overlay for text readability if needed
  const overlayLayers: sharp.OverlayOptions[] = [];

  if (concept.styling.overlayOpacity && concept.styling.overlayOpacity > 0) {
    const overlayAlpha = Math.round(concept.styling.overlayOpacity * 255);
    const overlayColor = concept.styling.backgroundColor || "#000000";
    const overlaySvg = `<svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="${overlayColor}" opacity="${concept.styling.overlayOpacity}"/>
    </svg>`;
    overlayLayers.push({
      input: Buffer.from(overlaySvg),
      top: 0,
      left: 0,
    });
  }

  // Step 3: Composite product image if available
  if (productImage) {
    const productLayer = await composeProductLayer(productImage, concept, width, height);
    if (productLayer) {
      overlayLayers.push(productLayer);
    }
  }

  // Step 4: Generate text overlay SVG
  const textSvg = generateTextOverlay(concept, width, height, input.brandName);
  overlayLayers.push({
    input: Buffer.from(textSvg),
    top: 0,
    left: 0,
  });

  // Step 5: Add logo if available
  if (logoImage) {
    const logoLayer = await composeLogoLayer(logoImage, concept, width, height);
    if (logoLayer) {
      overlayLayers.push(logoLayer);
    }
  }

  // Step 6: Composite all layers
  const result = await composite.composite(overlayLayers).png().toBuffer();
  return result;
}

async function composeProductLayer(
  productImage: Buffer,
  concept: AdConcept,
  canvasW: number,
  canvasH: number
): Promise<sharp.OverlayOptions | null> {
  const scale = concept.styling.productScale || 0.5;
  const placement = concept.styling.productPlacement || "center";

  // Calculate product dimensions
  const metadata = await sharp(productImage).metadata();
  if (!metadata.width || !metadata.height) return null;

  const maxW = Math.round(canvasW * scale);
  const maxH = Math.round(canvasH * scale);

  const resized = await sharp(productImage)
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();
  const pw = resizedMeta.width || maxW;
  const ph = resizedMeta.height || maxH;

  // Calculate position based on placement
  let top: number, left: number;
  switch (placement) {
    case "left":
      left = Math.round(canvasW * 0.05);
      top = Math.round((canvasH - ph) / 2);
      break;
    case "right":
      left = Math.round(canvasW - pw - canvasW * 0.05);
      top = Math.round((canvasH - ph) / 2);
      break;
    case "bottom":
      left = Math.round((canvasW - pw) / 2);
      top = Math.round(canvasH - ph - canvasH * 0.08);
      break;
    case "top_right":
      left = Math.round(canvasW - pw - canvasW * 0.05);
      top = Math.round(canvasH * 0.1);
      break;
    case "top_left":
      left = Math.round(canvasW * 0.05);
      top = Math.round(canvasH * 0.1);
      break;
    case "center":
    default:
      left = Math.round((canvasW - pw) / 2);
      top = Math.round((canvasH - ph) / 2);
      break;
  }

  return { input: resized, top, left };
}

async function composeLogoLayer(
  logoImage: Buffer,
  concept: AdConcept,
  canvasW: number,
  canvasH: number
): Promise<sharp.OverlayOptions | null> {
  const logoMaxW = Math.round(canvasW * 0.2);
  const logoMaxH = Math.round(canvasH * 0.06);

  const resized = await sharp(logoImage)
    .resize(logoMaxW, logoMaxH, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const lw = meta.width || logoMaxW;

  // Logo bottom center
  return {
    input: resized,
    top: Math.round(canvasH - (meta.height || logoMaxH) - canvasH * 0.04),
    left: Math.round((canvasW - lw) / 2),
  };
}

// ============================================================
// SVG TEXT OVERLAY GENERATION — Layout-specific rendering
// ============================================================

function generateTextOverlay(
  concept: AdConcept,
  w: number,
  h: number,
  brandName: string
): string {
  const { layout } = concept;

  switch (layout) {
    case "us_vs_them":
      return generateUsVsThemSvg(concept, w, h, brandName);
    case "before_after":
      return generateBeforeAfterSvg(concept, w, h);
    case "benefit_callout":
      return generateBenefitCalloutSvg(concept, w, h);
    case "hero_product":
      return generateHeroProductSvg(concept, w, h);
    case "product_showcase":
      return generateProductShowcaseSvg(concept, w, h);
    case "social_proof":
      return generateSocialProofSvg(concept, w, h);
    case "minimal_impact":
      return generateMinimalImpactSvg(concept, w, h);
    case "lifestyle_overlay":
    default:
      return generateLifestyleOverlaySvg(concept, w, h);
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getFontFamily(style: string): string {
  return FONT_FAMILIES[style] || FONT_FAMILIES.bold_sans;
}

function getHeadlineSize(size: string, w: number): number {
  const base = HEADLINE_SIZES[size] || HEADLINE_SIZES.large;
  return Math.round(base * (w / 1080));
}

// ---- HERO PRODUCT ----
function generateHeroProductSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const headSize = getHeadlineSize(styling.headlineSize, w);
  const subSize = Math.round(headSize * 0.45);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const isProductRight = styling.productPlacement === "right" || styling.productPlacement === "top_right";
  const textX = isProductRight ? w * 0.08 : w * 0.55;
  const textMaxW = w * 0.45;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Headline
  const headY = h * 0.2;
  svg += `<text x="${textX}" y="${headY}" fill="${tc}" font-family="${font}" font-size="${headSize}" font-weight="900" textLength="${textMaxW}" lengthAdjust="spacing">`;
  svg += wrapTextSvg(copy.headline, headSize, textMaxW, textX, headY, tc, font, "900");
  svg += `</text>`;

  // Subheadline
  if (copy.subheadline) {
    const subY = headY + headSize * 2.5;
    svg += `<text x="${textX}" y="${subY}" fill="${tc}" font-family="${font}" font-size="${subSize}" opacity="0.8">${escapeXml(copy.subheadline)}</text>`;
  }

  // Benefits
  if (copy.benefits?.length) {
    let benefitY = h * 0.55;
    const benefitSize = Math.round(headSize * 0.35);
    for (const b of copy.benefits) {
      svg += `<circle cx="${textX + 8}" cy="${benefitY - 5}" r="6" fill="${ac}"/>`;
      svg += `<text x="${textX + 22}" y="${benefitY}" fill="${tc}" font-family="${font}" font-size="${benefitSize}">${escapeXml(b)}</text>`;
      benefitY += benefitSize * 1.8;
    }
  }

  // CTA button
  if (copy.cta) {
    const ctaY = h * 0.85;
    const ctaW = Math.min(textMaxW, 300 * (w / 1080));
    const ctaH = 56 * (w / 1080);
    const ctaSize = Math.round(headSize * 0.3);
    svg += `<rect x="${textX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="${ac}"/>`;
    svg += `<text x="${textX + ctaW / 2}" y="${ctaY + ctaH / 2 + ctaSize * 0.35}" fill="#ffffff" font-family="${font}" font-size="${ctaSize}" font-weight="700" text-anchor="middle">${escapeXml(copy.cta)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- US VS THEM ----
function generateUsVsThemSvg(concept: AdConcept, w: number, h: number, brandName: string): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize("medium", w);
  const textSize = Math.round(headSize * 0.35);
  const halfW = w / 2;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Split background panels
  svg += `<rect x="0" y="0" width="${halfW}" height="${h}" fill="${styling.backgroundColor}" opacity="0.85"/>`;
  svg += `<rect x="${halfW}" y="0" width="${halfW}" height="${h}" fill="${ac}" opacity="0.15"/>`;
  // Divider line
  svg += `<line x1="${halfW}" y1="0" x2="${halfW}" y2="${h}" stroke="${tc}" stroke-width="2" opacity="0.2"/>`;

  // Left title
  const leftTitle = copy.comparisonLeft?.title || brandName;
  svg += `<text x="${halfW * 0.5}" y="${h * 0.1}" fill="${ac}" font-family="${font}" font-size="${headSize * 0.7}" font-weight="900" text-anchor="middle">${escapeXml(leftTitle)}</text>`;

  // Right title
  const rightTitle = copy.comparisonRight?.title || "Eux";
  svg += `<text x="${halfW + halfW * 0.5}" y="${h * 0.1}" fill="${tc}" font-family="${font}" font-size="${headSize * 0.7}" font-weight="900" text-anchor="middle" opacity="0.6">${escapeXml(rightTitle)}</text>`;

  // Left points (with checkmarks)
  if (copy.comparisonLeft?.points) {
    let y = h * 0.4;
    for (const p of copy.comparisonLeft.points) {
      svg += `<text x="${halfW * 0.08}" y="${y}" fill="#22c55e" font-size="${textSize * 1.2}" font-weight="bold">&#x2713;</text>`;
      svg += `<text x="${halfW * 0.16}" y="${y}" fill="${tc}" font-family="${font}" font-size="${textSize}">${escapeXml(p)}</text>`;
      y += textSize * 2.2;
    }
  }

  // Right points (with X marks)
  if (copy.comparisonRight?.points) {
    let y = h * 0.4;
    for (const p of copy.comparisonRight.points) {
      svg += `<text x="${halfW + halfW * 0.08}" y="${y}" fill="#ef4444" font-size="${textSize * 1.2}" font-weight="bold">&#x2717;</text>`;
      svg += `<text x="${halfW + halfW * 0.16}" y="${y}" fill="${tc}" font-family="${font}" font-size="${textSize}" opacity="0.7">${escapeXml(p)}</text>`;
      y += textSize * 2.2;
    }
  }

  svg += `</svg>`;
  return svg;
}

// ---- BEFORE / AFTER ----
function generateBeforeAfterSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize("large", w);
  const halfW = w / 2;

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Before side (dark)
  svg += `<rect x="0" y="0" width="${halfW}" height="${h}" fill="#000000" opacity="0.6"/>`;
  const beforeLabel = copy.beforeLabel || "AVANT";
  svg += `<text x="${halfW * 0.5}" y="${h * 0.12}" fill="${tc}" font-family="${font}" font-size="${headSize}" font-weight="900" text-anchor="middle" opacity="0.7">${escapeXml(beforeLabel)}</text>`;

  // After side (accent)
  svg += `<rect x="${halfW}" y="0" width="${halfW}" height="${h}" fill="${ac}" opacity="0.2"/>`;
  const afterLabel = copy.afterLabel || "APRES";
  svg += `<text x="${halfW + halfW * 0.5}" y="${h * 0.12}" fill="${tc}" font-family="${font}" font-size="${headSize}" font-weight="900" text-anchor="middle">${escapeXml(afterLabel)}</text>`;

  // Benefits on the "after" side
  if (copy.benefits?.length) {
    const textSize = Math.round(headSize * 0.35);
    let y = h * 0.7;
    for (const b of copy.benefits) {
      svg += `<text x="${halfW + halfW * 0.12}" y="${y}" fill="#22c55e" font-size="${textSize * 1.2}">&#x2713;</text>`;
      svg += `<text x="${halfW + halfW * 0.22}" y="${y}" fill="${tc}" font-family="${font}" font-size="${textSize}" font-weight="600">${escapeXml(b)}</text>`;
      y += textSize * 2;
    }
  }

  // Headline at bottom
  if (copy.headline) {
    svg += `<text x="${w * 0.5}" y="${h * 0.92}" fill="${tc}" font-family="${font}" font-size="${headSize * 0.5}" font-weight="700" text-anchor="middle">${escapeXml(copy.headline)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- BENEFIT CALLOUT ----
function generateBenefitCalloutSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize(styling.headlineSize, w);

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Headline at top
  if (copy.headline) {
    svg += wrapTextSvg(copy.headline, headSize * 0.7, w * 0.8, w * 0.1, h * 0.08, tc, font, "900");
  }

  // Stat circles on the left side
  if (copy.stats?.length) {
    const circleR = Math.round(w * 0.08);
    let cy = h * 0.35;
    const cx = w * 0.13;

    for (const stat of copy.stats) {
      // Circle outline
      svg += `<circle cx="${cx}" cy="${cy}" r="${circleR}" fill="none" stroke="${tc}" stroke-width="2" opacity="0.8"/>`;
      // Value
      svg += `<text x="${cx}" y="${cy - 2}" fill="${tc}" font-family="${font}" font-size="${circleR * 0.7}" font-weight="900" text-anchor="middle" dominant-baseline="auto">${escapeXml(stat.value)}</text>`;
      // Label
      svg += `<text x="${cx}" y="${cy + circleR * 0.45}" fill="${tc}" font-family="${font}" font-size="${circleR * 0.35}" text-anchor="middle" opacity="0.7">${escapeXml(stat.label)}</text>`;
      cy += circleR * 3;
    }
  }

  // Tagline at bottom
  if (copy.tagline) {
    svg += `<text x="${w * 0.5}" y="${h * 0.93}" fill="${tc}" font-family="${font}" font-size="${headSize * 0.3}" text-anchor="middle" opacity="0.8">${escapeXml(copy.tagline)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- PRODUCT SHOWCASE ----
function generateProductShowcaseSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize(styling.headlineSize, w);

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Headline
  if (copy.headline) {
    svg += wrapTextSvg(copy.headline, headSize * 0.65, w * 0.85, w * 0.075, h * 0.06, tc, font, "900");
  }

  // Stats row at bottom
  if (copy.stats?.length) {
    const statW = w / copy.stats.length;
    const statY = h * 0.82;
    const statValSize = Math.round(headSize * 0.5);
    const statLabelSize = Math.round(headSize * 0.22);

    copy.stats.forEach((stat, i) => {
      const sx = statW * i + statW / 2;
      svg += `<text x="${sx}" y="${statY}" fill="${ac}" font-family="${font}" font-size="${statValSize}" font-weight="900" text-anchor="middle">${escapeXml(stat.value)}</text>`;
      svg += `<text x="${sx}" y="${statY + statValSize * 0.7}" fill="${tc}" font-family="${font}" font-size="${statLabelSize}" text-anchor="middle" opacity="0.7">${escapeXml(stat.label)}</text>`;
    });
  }

  // CTA
  if (copy.cta) {
    const ctaY = h * 0.92;
    const ctaSize = Math.round(headSize * 0.28);
    svg += `<text x="${w * 0.5}" y="${ctaY}" fill="${ac}" font-family="${font}" font-size="${ctaSize}" font-weight="700" text-anchor="middle" text-decoration="underline">${escapeXml(copy.cta)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- SOCIAL PROOF ----
function generateSocialProofSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize(styling.headlineSize, w);

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Headline (big quote)
  if (copy.headline) {
    svg += `<text x="${w * 0.08}" y="${h * 0.12}" fill="${ac}" font-family="${font}" font-size="${headSize * 1.5}" opacity="0.3">"</text>`;
    svg += wrapTextSvg(copy.headline, headSize * 0.55, w * 0.8, w * 0.1, h * 0.18, tc, font, "700");
  }

  // Guarantee badge
  if (copy.guarantee) {
    const badgeSize = Math.round(w * 0.18);
    const badgeCx = w * 0.82;
    const badgeCy = h * 0.2;
    svg += `<circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeSize}" fill="${ac}"/>`;
    svg += `<text x="${badgeCx}" y="${badgeCy}" fill="#ffffff" font-family="${font}" font-size="${badgeSize * 0.25}" font-weight="900" text-anchor="middle" dominant-baseline="middle">${escapeXml(copy.guarantee)}</text>`;
  }

  // CTA
  if (copy.cta) {
    const ctaY = h * 0.88;
    const ctaW = w * 0.6;
    const ctaH = 56 * (w / 1080);
    const ctaSize = Math.round(headSize * 0.28);
    svg += `<rect x="${(w - ctaW) / 2}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="${ac}"/>`;
    svg += `<text x="${w * 0.5}" y="${ctaY + ctaH / 2 + ctaSize * 0.35}" fill="#ffffff" font-family="${font}" font-size="${ctaSize}" font-weight="700" text-anchor="middle">${escapeXml(copy.cta)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- MINIMAL IMPACT ----
function generateMinimalImpactSvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize("xl", w);

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Semi-transparent overlay for readability
  svg += `<rect width="${w}" height="${h}" fill="${styling.backgroundColor}" opacity="0.4"/>`;

  // Giant headline centered
  if (copy.headline) {
    svg += wrapTextSvg(copy.headline, headSize, w * 0.85, w * 0.075, h * 0.2, tc, font, "900");
  }

  // Subheadline
  if (copy.subheadline) {
    const subSize = Math.round(headSize * 0.35);
    svg += `<text x="${w * 0.5}" y="${h * 0.7}" fill="${tc}" font-family="${font}" font-size="${subSize}" text-anchor="middle" opacity="0.8">${escapeXml(copy.subheadline)}</text>`;
  }

  // Tagline at bottom
  if (copy.tagline) {
    const tagSize = Math.round(headSize * 0.25);
    svg += `<text x="${w * 0.5}" y="${h * 0.92}" fill="${tc}" font-family="${font}" font-size="${tagSize}" font-weight="600" text-anchor="middle">${escapeXml(copy.tagline)}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ---- LIFESTYLE OVERLAY ----
function generateLifestyleOverlaySvg(concept: AdConcept, w: number, h: number): string {
  const { copy, styling } = concept;
  const font = getFontFamily(styling.fontStyle);
  const tc = escapeXml(styling.textColor);
  const ac = escapeXml(styling.accentColor);
  const headSize = getHeadlineSize(styling.headlineSize, w);

  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Bottom gradient overlay for text readability
  svg += `<defs><linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${styling.backgroundColor}" stop-opacity="0"/>
    <stop offset="60%" stop-color="${styling.backgroundColor}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${styling.backgroundColor}" stop-opacity="0.85"/>
  </linearGradient></defs>`;
  svg += `<rect width="${w}" height="${h}" fill="url(#bottomFade)"/>`;

  // Headline at bottom
  if (copy.headline) {
    svg += wrapTextSvg(copy.headline, headSize * 0.6, w * 0.85, w * 0.075, h * 0.7, tc, font, "800");
  }

  // Benefits below headline
  if (copy.benefits?.length) {
    const bSize = Math.round(headSize * 0.28);
    let by = h * 0.85;
    for (const b of copy.benefits.slice(0, 3)) {
      svg += `<text x="${w * 0.08}" y="${by}" fill="${tc}" font-family="${font}" font-size="${bSize}" opacity="0.9">&#x2022; ${escapeXml(b)}</text>`;
      by += bSize * 1.8;
    }
  }

  // CTA
  if (copy.cta) {
    const ctaY = h * 0.92;
    const ctaSize = Math.round(headSize * 0.25);
    svg += `<text x="${w * 0.5}" y="${ctaY}" fill="${ac}" font-family="${font}" font-size="${ctaSize}" font-weight="700" text-anchor="middle">${escapeXml(copy.cta)} &#x2192;</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ============================================================
// HELPER: Multi-line text wrapping in SVG
// ============================================================

function wrapTextSvg(
  text: string,
  fontSize: number,
  maxWidth: number,
  x: number,
  y: number,
  fill: string,
  fontFamily: string,
  fontWeight: string
): string {
  // Rough character width estimation (0.6 * fontSize for sans-serif)
  const charWidth = fontSize * 0.55;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  let svg = "";
  lines.forEach((line, i) => {
    const ly = y + fontSize * 1.2 * (i + 1);
    svg += `<text x="${x}" y="${ly}" fill="${escapeXml(fill)}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}">${escapeXml(line)}</text>`;
  });

  return svg;
}
