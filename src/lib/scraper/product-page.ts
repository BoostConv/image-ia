import * as cheerio from "cheerio";

export interface RawProductData {
  title?: string;
  description?: string;
  price?: string;
  bulletPoints?: string[];
  images?: string[];
  fullText?: string;
}

export async function scrapeProductPage(url: string): Promise<RawProductData> {
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

  // Remove scripts and styles
  $("script, style, noscript, iframe").remove();

  // Extract title
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    undefined;

  // Extract description
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('[class*="description"], [class*="Description"]')
      .first()
      .text()
      .trim()
      .slice(0, 2000) ||
    undefined;

  // Extract price
  const price =
    $('[class*="price"], [class*="Price"], [data-price], [itemprop="price"]')
      .first()
      .text()
      .trim() || undefined;

  // Extract bullet points / benefits
  const bulletPoints: string[] = [];
  $(
    '[class*="benefit"], [class*="feature"], [class*="detail"] li, [class*="description"] li, [class*="highlight"] li'
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 300) {
      bulletPoints.push(text);
    }
  });
  // If no specific bullet points found, get all list items near the product
  if (bulletPoints.length === 0) {
    $("main li, [role='main'] li, article li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 300 && bulletPoints.length < 15) {
        bulletPoints.push(text);
      }
    });
  }

  // Extract images
  const images: string[] = [];
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) images.push(resolveUrl(ogImage, url));

  $(
    '[class*="product"] img, [class*="gallery"] img, [class*="media"] img, main img'
  ).each((_, el) => {
    const src =
      $(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-lazy-src");
    if (src && !src.includes("icon") && !src.includes("logo") && images.length < 10) {
      const resolved = resolveUrl(src, url);
      if (!images.includes(resolved)) images.push(resolved);
    }
  });

  // Extract full text (limited)
  const fullText =
    $("main, [role='main'], article, [class*='product']")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000) || undefined;

  return {
    title,
    description,
    price,
    bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
    images: images.length > 0 ? images : undefined,
    fullText,
  };
}

function resolveUrl(src: string, baseUrl: string): string {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}
