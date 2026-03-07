import sharp from "sharp";
import type { AdTextOverlay } from "../ai/claude-creative";

// ============================================================
// TEXT OVERLAY — Superpose headline + CTA sur une image generee
// Utilise sharp avec SVG overlay pour un rendu net et pro
// ============================================================

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const charWidth = fontSize * 0.52;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function getPosition(
  pos: string,
  w: number,
  h: number,
  blockH: number
): { x: number; y: number; anchor: string } {
  const margin = Math.round(w * 0.06);

  switch (pos) {
    case "top-left":
      return { x: margin, y: margin + blockH * 0.3, anchor: "start" };
    case "top-center":
      return { x: w / 2, y: margin + blockH * 0.3, anchor: "middle" };
    case "top-right":
      return { x: w - margin, y: margin + blockH * 0.3, anchor: "end" };
    case "center":
      return { x: w / 2, y: h / 2 - blockH / 2, anchor: "middle" };
    case "bottom-left":
      return { x: margin, y: h - margin - blockH, anchor: "start" };
    case "bottom-center":
      return { x: w / 2, y: h - margin - blockH, anchor: "middle" };
    case "bottom-right":
      return { x: w - margin, y: h - margin - blockH, anchor: "end" };
    default:
      return { x: margin, y: margin + blockH * 0.3, anchor: "start" };
  }
}

export async function applyTextOverlay(
  imageBuffer: Buffer,
  overlay: AdTextOverlay,
  brandTypography?: { headingFont?: string; bodyFont?: string }
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 1080;
  const h = meta.height || 1080;

  const headlineFont = brandTypography?.headingFont || "Arial, Helvetica, sans-serif";
  const bodyFont = brandTypography?.bodyFont || "Arial, Helvetica, sans-serif";

  // Calculate sizes based on image dimensions
  const headlineSize = Math.round(w * 0.065);
  const subtitleSize = Math.round(w * 0.035);
  const ctaFontSize = Math.round(w * 0.03);
  const lineHeight = 1.25;
  const maxTextWidth = w * 0.75;

  // Wrap headline text
  const headlineLines = wrapText(overlay.headline, headlineSize, maxTextWidth);
  const headlineBlockH = headlineLines.length * headlineSize * lineHeight;

  // Calculate total block height (headline + subtitle + spacing)
  let totalBlockH = headlineBlockH;
  let subtitleLines: string[] = [];
  if (overlay.subtitle) {
    subtitleLines = wrapText(overlay.subtitle, subtitleSize, maxTextWidth);
    totalBlockH += subtitleLines.length * subtitleSize * lineHeight + headlineSize * 0.5;
  }

  const headPos = getPosition(overlay.headlinePosition, w, h, totalBlockH);
  const tc = escapeXml(overlay.textColor);

  // Build SVG
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;

  // Optional: add a subtle shadow/backdrop behind text for readability
  const isLightText = isLight(overlay.textColor);
  if (isLightText) {
    // Dark gradient behind light text
    const gradientId = overlay.headlinePosition.startsWith("top") ? "topGrad" : "bottomGrad";
    if (overlay.headlinePosition.startsWith("top")) {
      svg += `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      </linearGradient></defs>`;
      svg += `<rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#${gradientId})"/>`;
    } else if (overlay.headlinePosition.startsWith("bottom") || overlay.headlinePosition === "center") {
      svg += `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
      </linearGradient></defs>`;
      svg += `<rect width="${w}" height="${h}" fill="url(#${gradientId})"/>`;
    }
  } else {
    // Light gradient behind dark text
    const gradientId = overlay.headlinePosition.startsWith("top") ? "topGrad" : "bottomGrad";
    if (overlay.headlinePosition.startsWith("top")) {
      svg += `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5"/>
        <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient></defs>`;
      svg += `<rect width="${w}" height="${Math.round(h * 0.45)}" fill="url(#${gradientId})"/>`;
    } else {
      svg += `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
        <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.5"/>
      </linearGradient></defs>`;
      svg += `<rect width="${w}" height="${h}" fill="url(#${gradientId})"/>`;
    }
  }

  // Render headline lines
  let currentY = headPos.y;
  for (const line of headlineLines) {
    // Text shadow for readability
    svg += `<text x="${headPos.x + 2}" y="${currentY + 2}" fill="#00000066" font-family="${escapeXml(headlineFont)}" font-size="${headlineSize}" font-weight="900" text-anchor="${headPos.anchor}">${escapeXml(line)}</text>`;
    // Main text
    svg += `<text x="${headPos.x}" y="${currentY}" fill="${tc}" font-family="${escapeXml(headlineFont)}" font-size="${headlineSize}" font-weight="900" text-anchor="${headPos.anchor}">${escapeXml(line)}</text>`;
    currentY += headlineSize * lineHeight;
  }

  // Render subtitle
  if (overlay.subtitle && subtitleLines.length > 0) {
    currentY += headlineSize * 0.3; // spacing
    for (const line of subtitleLines) {
      svg += `<text x="${headPos.x + 1}" y="${currentY + 1}" fill="#00000044" font-family="${escapeXml(bodyFont)}" font-size="${subtitleSize}" font-weight="500" text-anchor="${headPos.anchor}">${escapeXml(line)}</text>`;
      svg += `<text x="${headPos.x}" y="${currentY}" fill="${tc}" font-family="${escapeXml(bodyFont)}" font-size="${subtitleSize}" font-weight="500" text-anchor="${headPos.anchor}" opacity="0.9">${escapeXml(line)}</text>`;
      currentY += subtitleSize * lineHeight;
    }
  }

  // Render CTA button
  if (overlay.cta) {
    const ctaPos = getPosition(
      overlay.ctaPosition || "bottom-center",
      w,
      h,
      0
    );
    const ctaText = escapeXml(overlay.cta);
    const ctaPadX = ctaFontSize * 1.5;
    const ctaPadY = ctaFontSize * 0.8;
    const ctaW = overlay.cta.length * ctaFontSize * 0.58 + ctaPadX * 2;
    const ctaH = ctaFontSize + ctaPadY * 2;
    const ctaBg = escapeXml(overlay.ctaColor || overlay.textColor);
    const ctaTc = escapeXml(overlay.ctaTextColor || invertColor(overlay.textColor));
    const ctaY = Math.min(ctaPos.y, h - Math.round(h * 0.06));

    let ctaX = ctaPos.x;
    if (ctaPos.anchor === "middle") ctaX -= ctaW / 2;
    else if (ctaPos.anchor === "end") ctaX -= ctaW;

    svg += `<rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="${ctaBg}"/>`;
    svg += `<text x="${ctaX + ctaW / 2}" y="${ctaY + ctaH / 2 + ctaFontSize * 0.35}" fill="${ctaTc}" font-family="${escapeXml(bodyFont)}" font-size="${ctaFontSize}" font-weight="700" text-anchor="middle">${ctaText}</text>`;
  }

  svg += `</svg>`;

  // Composite SVG onto image
  const result = await sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return result;
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

function invertColor(hex: string): string {
  return isLight(hex) ? "#000000" : "#FFFFFF";
}
