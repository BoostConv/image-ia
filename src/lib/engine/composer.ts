import sharp from "sharp";
import type {
  CreativeBrief,
  ArtDirection,
  FilteredContext,
  RenderMode,
  OverlayIntent,
  TextDensity,
  CopyAssets,
  LayoutZone,
  LayoutTemplate,
  CollisionReport,
  ComposedAd,
  ComposerInput,
} from "./types";
import { selectLayout, getFallbackTemplate } from "./layout-templates";

// ============================================================
// COMPONENT G: COMPOSER
// Takes a rendered image + copy assets and produces a final
// composed ad with text overlays, badges, CTAs.
// Deterministic — uses Sharp + SVG, no AI calls.
// ============================================================

// ─── HELPERS ─────────────────────────────────────────────────

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

/**
 * Derive copy assets from a brief + context.
 */
export function deriveCopyAssets(
  brief: CreativeBrief,
  context: FilteredContext
): CopyAssets {
  return {
    headline: brief.headline_suggestion || context.promise,
    subtitle: brief.why_this_should_stop_scroll,
    proof: brief.proof_to_show,
    badge: undefined, // Could add "N°1 en France" etc.
    cta: brief.cta_suggestion || "Découvrir",
    brandName: context.brand_name,
  };
}

// ─── COLLISION DETECTION (AABB) ──────────────────────────────

interface PlacedZone extends LayoutZone {
  absX: number;
  absY: number;
  absW: number;
  absH: number;
}

function toAbsolute(zone: LayoutZone, canvasW: number, canvasH: number): PlacedZone {
  return {
    ...zone,
    absX: Math.round((zone.x / 100) * canvasW),
    absY: Math.round((zone.y / 100) * canvasH),
    absW: Math.round((zone.width / 100) * canvasW),
    absH: Math.round((zone.height / 100) * canvasH),
  };
}

function detectCollisions(zones: PlacedZone[], canvasW: number, canvasH: number): CollisionReport[] {
  const collisions: CollisionReport[] = [];
  const canvasArea = canvasW * canvasH;

  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      const a = zones[i];
      const b = zones[j];

      // Skip forbidden zones (they're exclusion markers, not real elements)
      if (a.id === "forbidden" || b.id === "forbidden") continue;

      // AABB intersection
      const overlapX = Math.max(
        0,
        Math.min(a.absX + a.absW, b.absX + b.absW) - Math.max(a.absX, b.absX)
      );
      const overlapY = Math.max(
        0,
        Math.min(a.absY + a.absH, b.absY + b.absH) - Math.max(a.absY, b.absY)
      );
      const overlapArea = overlapX * overlapY;

      if (overlapArea > 0) {
        const overlapPct = (overlapArea / canvasArea) * 100;
        collisions.push({
          zone1: a.id,
          zone2: b.id,
          overlapArea: Math.round(overlapPct * 100) / 100,
          resolved: false,
          resolution: "",
        });
      }
    }
  }

  return collisions;
}

// ─── FALLBACK CHAIN ──────────────────────────────────────────

/**
 * Apply fallback chain to resolve collisions.
 * Order: remove badge → remove proof → remove subtitle → change template
 */
function applyFallbackChain(
  zones: PlacedZone[],
  collisions: CollisionReport[],
  fallbacksApplied: string[]
): PlacedZone[] {
  if (collisions.length === 0) return zones;

  let resolved = [...zones];
  const unresolved = collisions.filter((c) => !c.resolved);

  // Step 1: Remove badge if it causes collisions
  const badgeCollisions = unresolved.filter(
    (c) => c.zone1 === "badge" || c.zone2 === "badge"
  );
  if (badgeCollisions.length > 0) {
    resolved = resolved.filter((z) => z.id !== "badge");
    badgeCollisions.forEach((c) => {
      c.resolved = true;
      c.resolution = "badge removed";
    });
    fallbacksApplied.push("badge_removed");
  }

  // Step 2: Remove proof if it still collides
  const proofCollisions = unresolved.filter(
    (c) => !c.resolved && (c.zone1 === "proof" || c.zone2 === "proof")
  );
  if (proofCollisions.length > 0) {
    resolved = resolved.filter((z) => z.id !== "proof");
    proofCollisions.forEach((c) => {
      c.resolved = true;
      c.resolution = "proof removed";
    });
    fallbacksApplied.push("proof_removed");
  }

  // Step 3: Remove subtitle if it still collides
  const subtitleCollisions = unresolved.filter(
    (c) => !c.resolved && (c.zone1 === "subtitle" || c.zone2 === "subtitle")
  );
  if (subtitleCollisions.length > 0) {
    resolved = resolved.filter((z) => z.id !== "subtitle");
    subtitleCollisions.forEach((c) => {
      c.resolved = true;
      c.resolution = "subtitle removed";
    });
    fallbacksApplied.push("subtitle_removed");
  }

  return resolved;
}

// ─── SVG OVERLAY GENERATION ──────────────────────────────────

function buildSvgOverlay(
  zones: PlacedZone[],
  copyAssets: CopyAssets,
  canvasW: number,
  canvasH: number,
  context: FilteredContext
): string {
  const primaryColor = context.brand_visual_code.primary_color || "#FFFFFF";
  const accentColor = context.brand_visual_code.accent_color || "#FF6B00";
  const fontStyle = context.brand_visual_code.font_style || "sans-serif";
  const fontFamily = mapFontFamily(fontStyle);

  // Determine text color based on visual tone
  const textColor = isLightBackground(context.brand_visual_code.visual_tone)
    ? "#1A1A1A"
    : "#FFFFFF";
  const shadowColor = textColor === "#FFFFFF" ? "#00000088" : "#FFFFFF44";

  let svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">`;

  // Add gradient overlays for text readability
  svg += buildReadabilityGradient(zones, canvasW, canvasH, textColor);

  for (const zone of zones) {
    if (zone.id === "forbidden" || zone.id === "quiet" || zone.id === "product") continue;

    const text = getTextForZone(zone.id, copyAssets);
    if (!text) continue;

    const scaleFactor = canvasW / 1080;
    const fontSize = Math.round(
      Math.min(zone.maxFontSize, Math.max(zone.minFontSize, zone.maxFontSize * 0.85)) * scaleFactor
    );

    switch (zone.id) {
      case "headline":
        svg += renderHeadline(zone, text, fontSize, textColor, shadowColor, fontFamily);
        break;
      case "subtitle":
        svg += renderSubtitle(zone, text, fontSize, textColor, fontFamily);
        break;
      case "proof":
        svg += renderProof(zone, text, fontSize, textColor, fontFamily);
        break;
      case "badge":
        svg += renderBadge(zone, text, fontSize, accentColor, fontFamily);
        break;
      case "cta":
        svg += renderCta(zone, text, fontSize, accentColor, primaryColor, fontFamily);
        break;
    }
  }

  svg += `</svg>`;
  return svg;
}

function buildReadabilityGradient(
  zones: PlacedZone[],
  canvasW: number,
  canvasH: number,
  textColor: string
): string {
  // Determine where text zones are concentrated
  const textZones = zones.filter(
    (z) => z.id !== "forbidden" && z.id !== "quiet" && z.id !== "product"
  );
  if (textZones.length === 0) return "";

  const avgY = textZones.reduce((s, z) => s + z.absY + z.absH / 2, 0) / textZones.length;
  const isTop = avgY < canvasH * 0.4;
  const gradientColor = textColor === "#FFFFFF" ? "#000000" : "#FFFFFF";

  let svg = "";
  if (isTop) {
    svg += `<defs><linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradientColor}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${gradientColor}" stop-opacity="0"/>
    </linearGradient></defs>`;
    svg += `<rect width="${canvasW}" height="${Math.round(canvasH * 0.5)}" fill="url(#readGrad)"/>`;
  } else {
    svg += `<defs><linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradientColor}" stop-opacity="0"/>
      <stop offset="40%" stop-color="${gradientColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${gradientColor}" stop-opacity="0.6"/>
    </linearGradient></defs>`;
    svg += `<rect width="${canvasW}" height="${canvasH}" fill="url(#readGrad)"/>`;
  }

  return svg;
}

function renderHeadline(
  zone: PlacedZone,
  text: string,
  fontSize: number,
  textColor: string,
  shadowColor: string,
  fontFamily: string
): string {
  const lines = wrapText(text, fontSize, zone.absW);
  const lineHeight = fontSize * 1.2;
  let svg = "";

  const textAnchor = zone.alignment === "center" ? "middle" : zone.alignment === "right" ? "end" : "start";
  const textX =
    zone.alignment === "center"
      ? zone.absX + zone.absW / 2
      : zone.alignment === "right"
        ? zone.absX + zone.absW
        : zone.absX;

  for (let i = 0; i < lines.length; i++) {
    const y = zone.absY + fontSize + i * lineHeight;
    // Shadow
    svg += `<text x="${textX + 2}" y="${y + 2}" fill="${shadowColor}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="900" text-anchor="${textAnchor}">${escapeXml(lines[i])}</text>`;
    // Main
    svg += `<text x="${textX}" y="${y}" fill="${escapeXml(textColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="900" text-anchor="${textAnchor}">${escapeXml(lines[i])}</text>`;
  }

  return svg;
}

function renderSubtitle(
  zone: PlacedZone,
  text: string,
  fontSize: number,
  textColor: string,
  fontFamily: string
): string {
  const lines = wrapText(text, fontSize, zone.absW);
  const lineHeight = fontSize * 1.2;
  let svg = "";

  const textAnchor = zone.alignment === "center" ? "middle" : zone.alignment === "right" ? "end" : "start";
  const textX =
    zone.alignment === "center"
      ? zone.absX + zone.absW / 2
      : zone.alignment === "right"
        ? zone.absX + zone.absW
        : zone.absX;

  for (let i = 0; i < lines.length; i++) {
    const y = zone.absY + fontSize + i * lineHeight;
    svg += `<text x="${textX}" y="${y}" fill="${escapeXml(textColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="500" text-anchor="${textAnchor}" opacity="0.85">${escapeXml(lines[i])}</text>`;
  }

  return svg;
}

function renderProof(
  zone: PlacedZone,
  text: string,
  fontSize: number,
  textColor: string,
  fontFamily: string
): string {
  const lines = wrapText(text, fontSize, zone.absW);
  const lineHeight = fontSize * 1.2;
  let svg = "";

  const textAnchor = zone.alignment === "center" ? "middle" : zone.alignment === "right" ? "end" : "start";
  const textX =
    zone.alignment === "center"
      ? zone.absX + zone.absW / 2
      : zone.alignment === "right"
        ? zone.absX + zone.absW
        : zone.absX;

  for (let i = 0; i < lines.length; i++) {
    const y = zone.absY + fontSize + i * lineHeight;
    svg += `<text x="${textX}" y="${y}" fill="${escapeXml(textColor)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="600" text-anchor="${textAnchor}" opacity="0.9">${escapeXml(lines[i])}</text>`;
  }

  return svg;
}

function renderBadge(
  zone: PlacedZone,
  text: string,
  fontSize: number,
  accentColor: string,
  fontFamily: string
): string {
  const padding = fontSize * 0.5;
  const badgeW = Math.min(zone.absW, text.length * fontSize * 0.55 + padding * 2);
  const badgeH = fontSize + padding * 2;

  const badgeX =
    zone.alignment === "center"
      ? zone.absX + (zone.absW - badgeW) / 2
      : zone.alignment === "right"
        ? zone.absX + zone.absW - badgeW
        : zone.absX;
  const badgeY = zone.absY;

  let svg = "";
  svg += `<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 4}" fill="${escapeXml(accentColor)}"/>`;
  svg += `<text x="${badgeX + badgeW / 2}" y="${badgeY + badgeH / 2 + fontSize * 0.35}" fill="#FFFFFF" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="700" text-anchor="middle">${escapeXml(text)}</text>`;

  return svg;
}

function renderCta(
  zone: PlacedZone,
  text: string,
  fontSize: number,
  accentColor: string,
  _primaryColor: string,
  fontFamily: string
): string {
  const padding = fontSize * 0.7;
  const ctaW = Math.min(zone.absW, text.length * fontSize * 0.55 + padding * 2);
  const ctaH = fontSize + padding * 2;

  const ctaX =
    zone.alignment === "center"
      ? zone.absX + (zone.absW - ctaW) / 2
      : zone.alignment === "right"
        ? zone.absX + zone.absW - ctaW
        : zone.absX;
  const ctaY = zone.absY + (zone.absH - ctaH) / 2;

  let svg = "";
  svg += `<rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="${escapeXml(accentColor)}"/>`;
  svg += `<text x="${ctaX + ctaW / 2}" y="${ctaY + ctaH / 2 + fontSize * 0.35}" fill="#FFFFFF" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="700" text-anchor="middle">${escapeXml(text)}</text>`;

  return svg;
}

// ─── UTILITY ─────────────────────────────────────────────────

function getTextForZone(
  zoneId: string,
  copyAssets: CopyAssets
): string | null {
  switch (zoneId) {
    case "headline":
      return copyAssets.headline;
    case "subtitle":
      return copyAssets.subtitle || null;
    case "proof":
      return copyAssets.proof || null;
    case "badge":
      return copyAssets.badge || copyAssets.brandName;
    case "cta":
      return copyAssets.cta || null;
    default:
      return null;
  }
}

function mapFontFamily(fontStyle: string): string {
  const mapping: Record<string, string> = {
    serif: "Georgia, 'Times New Roman', serif",
    "sans-serif": "Arial, Helvetica, sans-serif",
    modern: "Helvetica Neue, Arial, sans-serif",
    elegant: "Georgia, 'Palatino Linotype', serif",
    bold: "Impact, Arial Black, sans-serif",
    playful: "'Trebuchet MS', 'Comic Sans MS', sans-serif",
  };
  return mapping[fontStyle] || mapping["sans-serif"];
}

function isLightBackground(visualTone: string): boolean {
  const lightTones = ["light", "bright", "pastel", "white", "clean", "minimal", "airy"];
  return lightTones.some((t) => visualTone.toLowerCase().includes(t));
}

// ─── MAIN COMPOSE FUNCTION ──────────────────────────────────

/**
 * Compose a final ad from a rendered image + copy assets.
 * Steps:
 * 1. Select layout template
 * 2. Place zones in absolute coordinates
 * 3. Detect collisions (AABB)
 * 4. Apply fallback chain
 * 5. Generate SVG overlay
 * 6. Composite with Sharp
 */
export async function composeAd(input: ComposerInput): Promise<ComposedAd> {
  const {
    image,
    brief,
    artDirection,
    context,
    overlayIntent,
    textDensity,
    copyAssets,
    aspectRatio,
  } = input;

  // If text density is "none", return the image as-is
  if (textDensity === "none") {
    return {
      buffer: image,
      mimeType: input.mimeType,
      layoutUsed: "none",
      zonesUsed: [],
      collisions: [],
      fallbacksApplied: [],
      copyAssets,
    };
  }

  // Get canvas dimensions from image
  const meta = await sharp(image).metadata();
  const canvasW = meta.width || 1080;
  const canvasH = meta.height || 1080;

  // Step 1: Select layout template
  let template = selectLayout(
    brief.creative_archetype,
    overlayIntent,
    aspectRatio
  );

  // Step 2: Filter zones based on text density
  let activeZones = filterZonesByDensity(template.zones, textDensity, copyAssets);

  // Step 3: Convert to absolute coordinates
  let placedZones = activeZones.map((z) => toAbsolute(z, canvasW, canvasH));

  // Step 4: Detect collisions
  let collisions = detectCollisions(placedZones, canvasW, canvasH);
  const fallbacksApplied: string[] = [];

  // Step 5: Apply fallback chain
  if (collisions.some((c) => !c.resolved)) {
    placedZones = applyFallbackChain(placedZones, collisions, fallbacksApplied);

    // Re-detect after fallbacks
    const stillUnresolved = collisions.filter((c) => !c.resolved);
    if (stillUnresolved.length > 0) {
      // Try a simpler template
      const fallbackTemplate = getFallbackTemplate(template.id);
      if (fallbackTemplate) {
        template = fallbackTemplate;
        activeZones = filterZonesByDensity(template.zones, textDensity, copyAssets);
        placedZones = activeZones.map((z) => toAbsolute(z, canvasW, canvasH));
        collisions = detectCollisions(placedZones, canvasW, canvasH);
        fallbacksApplied.push(`template_fallback:${fallbackTemplate.id}`);

        // Apply chain again on new template
        if (collisions.some((c) => !c.resolved)) {
          placedZones = applyFallbackChain(placedZones, collisions, fallbacksApplied);
        }
      }
    }
  }

  // Step 6: Generate SVG overlay
  const svgOverlay = buildSvgOverlay(placedZones, copyAssets, canvasW, canvasH, context);

  // Step 7: Composite with Sharp
  const composedBuffer = await sharp(image)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const zonesUsed = placedZones
    .filter((z) => z.id !== "forbidden" && z.id !== "quiet" && z.id !== "product")
    .filter((z) => getTextForZone(z.id, copyAssets) !== null)
    .map((z) => z.id);

  console.log(`[Composer] Layout: ${template.id}, zones: [${zonesUsed.join(", ")}], collisions: ${collisions.length}, fallbacks: ${fallbacksApplied.length}`);

  return {
    buffer: composedBuffer,
    mimeType: "image/png",
    layoutUsed: template.id,
    zonesUsed,
    collisions,
    fallbacksApplied,
    copyAssets,
  };
}

/**
 * Filter zones based on text density.
 * - low: headline + cta only
 * - medium: headline + cta + proof or badge
 * - high: all zones
 */
function filterZonesByDensity(
  zones: LayoutZone[],
  density: TextDensity,
  copyAssets: CopyAssets
): LayoutZone[] {
  // Always keep structural zones (forbidden, quiet, product)
  const structural = zones.filter((z) =>
    ["forbidden", "quiet", "product"].includes(z.id)
  );

  switch (density) {
    case "none":
      return structural;

    case "low":
      return [
        ...structural,
        ...zones.filter((z) => z.id === "headline" || z.id === "cta"),
      ];

    case "medium":
      return [
        ...structural,
        ...zones.filter(
          (z) =>
            z.id === "headline" ||
            z.id === "cta" ||
            (z.id === "proof" && copyAssets.proof) ||
            (z.id === "badge" && copyAssets.badge)
        ),
      ];

    case "high":
    default:
      return zones;
  }
}

/**
 * Compose a batch of ads.
 */
export async function composeBatch(inputs: ComposerInput[]): Promise<ComposedAd[]> {
  const results: ComposedAd[] = [];
  for (const input of inputs) {
    const composed = await composeAd(input);
    results.push(composed);
  }
  return results;
}
