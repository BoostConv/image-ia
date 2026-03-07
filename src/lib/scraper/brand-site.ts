import * as cheerio from "cheerio";

export interface RawBrandData {
  siteName?: string;
  description?: string;
  favicon?: string;
  ogImage?: string;
  colors: string[];
  fonts: string[];
  headings: string[];
  tagline?: string;
  fullText?: string;
}

export async function scrapeBrandSite(url: string): Promise<RawBrandData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status} lors du scraping de ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Site name
  const siteName =
    $('meta[property="og:site_name"]').attr("content") ||
    $('meta[name="application-name"]').attr("content") ||
    $("title").text().trim().split(/[|\-–—]/).pop()?.trim() ||
    undefined;

  // Description
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    undefined;

  // Favicon
  const favicon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    undefined;

  // OG Image
  const ogImage = $('meta[property="og:image"]').attr("content") || undefined;

  // Extract colors from inline styles + style tags
  const colors = extractColors($, html);

  // Extract fonts from CSS
  const fonts = extractFonts($, html);

  // Extract headings for tone analysis
  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 3 && text.length < 200 && headings.length < 15) {
      headings.push(text);
    }
  });

  // Tagline (often in hero section or meta)
  const tagline =
    $('meta[name="twitter:title"]').attr("content") ||
    $('[class*="hero"] h1, [class*="hero"] h2, [class*="banner"] h1').first().text().trim() ||
    $("h1").first().text().trim() ||
    undefined;

  // Full text for Claude analysis (limited)
  $("script, style, noscript, iframe, nav, footer, header").remove();
  const fullText =
    $("main, [role='main'], body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000) || undefined;

  return {
    siteName,
    description,
    favicon: favicon ? resolveUrl(favicon, url) : undefined,
    ogImage: ogImage ? resolveUrl(ogImage, url) : undefined,
    colors: [...new Set(colors)].slice(0, 20),
    fonts: [...new Set(fonts)].slice(0, 10),
    headings,
    tagline,
    fullText,
  };
}

function extractColors($: cheerio.CheerioAPI, html: string): string[] {
  const colors: string[] = [];
  const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;
  const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

  // From style tags
  $("style").each((_, el) => {
    const css = $(el).text();
    const hexMatches = css.match(hexPattern) || [];
    const rgbMatches = css.match(rgbPattern) || [];
    colors.push(...hexMatches, ...rgbMatches.map(normalizeRgb));
  });

  // From inline styles
  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const hexMatches = style.match(hexPattern) || [];
    const rgbMatches = style.match(rgbPattern) || [];
    colors.push(...hexMatches, ...rgbMatches.map(normalizeRgb));
  });

  // From CSS custom properties (common in modern sites)
  const cssVarPattern = /--[\w-]*color[\w-]*:\s*([^;]+)/gi;
  const styleContent = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)?.join(" ") || "";
  let match;
  while ((match = cssVarPattern.exec(styleContent)) !== null) {
    const val = match[1].trim();
    const hex = val.match(hexPattern);
    if (hex) colors.push(...hex);
  }

  // From theme-color meta
  const themeColor = $('meta[name="theme-color"]').attr("content");
  if (themeColor) colors.push(themeColor);

  // Filter out common generic colors
  const generic = new Set(["#fff", "#ffffff", "#000", "#000000", "#333", "#333333", "#666", "#999", "#ccc", "#eee", "#f5f5f5", "#fafafa"]);
  return colors.filter((c) => {
    const normalized = c.toLowerCase();
    return !generic.has(normalized) && normalized.length >= 4;
  });
}

function extractFonts($: cheerio.CheerioAPI, html: string): string[] {
  const fonts: string[] = [];
  const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi;

  // From style tags
  $("style").each((_, el) => {
    const css = $(el).text();
    let match;
    while ((match = fontPattern.exec(css)) !== null) {
      const font = match[1].trim().replace(/['"]/g, "");
      if (!isGenericFont(font)) fonts.push(font);
    }
  });

  // From Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    const familyMatch = href.match(/family=([^&:]+)/);
    if (familyMatch) {
      const families = familyMatch[1].split("|").map((f) => f.replace(/\+/g, " "));
      fonts.push(...families);
    }
  });

  // From @font-face
  const fontFacePattern = /@font-face\s*\{[^}]*font-family:\s*['"]?([^'";,}]+)/gi;
  const allStyles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)?.join(" ") || "";
  let match;
  while ((match = fontFacePattern.exec(allStyles)) !== null) {
    const font = match[1].trim().replace(/['"]/g, "");
    if (!isGenericFont(font)) fonts.push(font);
  }

  return fonts;
}

function isGenericFont(font: string): boolean {
  const generic = ["sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "inherit", "initial"];
  return generic.includes(font.toLowerCase()) || font.startsWith("-");
}

function normalizeRgb(rgb: string): string {
  const nums = rgb.match(/\d+/g);
  if (!nums || nums.length < 3) return rgb;
  const hex = nums.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
  return `#${hex}`;
}

function resolveUrl(src: string, baseUrl: string): string {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}
