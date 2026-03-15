import * as cheerio from "cheerio";

/**
 * Extracts key visual images from a website HTML page.
 * Targets hero banners, product shots, lifestyle photos.
 */
export function extractImageUrls(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  function addUrl(raw: string | undefined) {
    if (!raw || raw.startsWith("data:")) return;
    try {
      const absolute = new URL(raw, baseUrl).href;
      // Skip tiny icons, tracking pixels, svgs
      if (
        seen.has(absolute) ||
        absolute.includes("favicon") ||
        absolute.includes("icon") ||
        absolute.endsWith(".svg") ||
        absolute.includes("pixel") ||
        absolute.includes("tracking") ||
        absolute.includes("1x1")
      ) return;
      seen.add(absolute);
      urls.push(absolute);
    } catch {
      // invalid URL
    }
  }

  // OG image (usually best representative)
  addUrl($('meta[property="og:image"]').attr("content"));
  addUrl($('meta[property="og:image:url"]').attr("content"));
  addUrl($('meta[name="twitter:image"]').attr("content"));

  // Hero / banner / featured section images
  const heroSelectors = [
    '[class*="hero"] img',
    '[class*="banner"] img',
    '[class*="featured"] img',
    '[class*="slider"] img',
    '[class*="carousel"] img',
    '[class*="showcase"] img',
    'section:first-of-type img',
    'main img',
  ];

  for (const sel of heroSelectors) {
    $(sel).each((_, el) => {
      addUrl($(el).attr("src"));
      // srcset — pick largest
      const srcset = $(el).attr("srcset");
      if (srcset) {
        const largest = srcset
          .split(",")
          .map(s => s.trim().split(/\s+/))
          .sort((a, b) => {
            const wa = parseInt(a[1] || "0");
            const wb = parseInt(b[1] || "0");
            return wb - wa;
          })[0];
        if (largest?.[0]) addUrl(largest[0]);
      }
      // Lazy load attributes
      addUrl($(el).attr("data-src"));
      addUrl($(el).attr("data-lazy-src"));
    });
  }

  // All other images (fallback)
  $("img").each((_, el) => {
    if (urls.length >= 15) return;
    addUrl($(el).attr("src"));
    addUrl($(el).attr("data-src"));
  });

  // Background images in inline styles
  $("[style]").each((_, el) => {
    if (urls.length >= 15) return;
    const style = $(el).attr("style") || "";
    const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (bgMatch) addUrl(bgMatch[1]);
  });

  // Filter to likely meaningful images (not icons, not tiny)
  return urls.filter(u => {
    const lower = u.toLowerCase();
    return (
      (lower.includes(".jpg") || lower.includes(".jpeg") || lower.includes(".png") || lower.includes(".webp")) &&
      !lower.includes("logo") &&
      !lower.includes("payment") &&
      !lower.includes("badge")
    );
  }).slice(0, 10);
}

/**
 * Downloads an image from a URL and returns the buffer.
 */
export async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Skip tiny images (likely icons/pixels)
    if (buffer.length < 5000) return null;
    return buffer;
  } catch {
    return null;
  }
}
