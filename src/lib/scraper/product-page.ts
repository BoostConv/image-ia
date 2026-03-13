import * as cheerio from "cheerio";

export interface RawVariant {
  name: string;       // e.g., "Chocolat", "Rouge", "250ml"
  type: string;       // e.g., "Goût", "Couleur", "Taille"
  images: string[];   // image URLs specific to this variant
}

export interface RawProductData {
  title?: string;
  description?: string;
  price?: string;
  bulletPoints?: string[];
  images?: string[];
  variants?: RawVariant[];
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
  if (bulletPoints.length === 0) {
    $("main li, [role='main'] li, article li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 300 && bulletPoints.length < 15) {
        bulletPoints.push(text);
      }
    });
  }

  // Extract all product images
  const images: string[] = [];
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) images.push(resolveUrl(ogImage, url));

  $(
    '[class*="product"] img, [class*="gallery"] img, [class*="media"] img, main img'
  ).each((_, el) => {
    const src =
      $(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-lazy-src");
    if (src && !src.includes("icon") && !src.includes("logo") && images.length < 20) {
      const resolved = resolveUrl(src, url);
      if (!images.includes(resolved)) images.push(resolved);
    }
  });

  // Extract variants (flavors, colors, sizes)
  // Try Shopify JSON API first (most reliable), then embedded JSON, then DOM parsing
  const variants =
    (await extractShopifyJsonApi(url)) ||
    extractShopifyVariants($, url) ||
    extractVariants($, url);

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
    variants: variants.length > 0 ? variants : undefined,
    fullText,
  };
}

/**
 * Try to fetch variants from the Shopify Product JSON API ({url}.json).
 * This is the most reliable method for Shopify stores.
 */
async function extractShopifyJsonApi(url: string): Promise<RawVariant[] | null> {
  try {
    // Shopify product pages expose a .json endpoint
    const jsonUrl = url.replace(/\/?(\?.*)?$/, ".json$1");
    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const product = data?.product;
    if (!product?.variants || !Array.isArray(product.variants)) return null;

    const optionName = product.options?.[0]?.name || product.options?.[0] || "Variante";

    // Build variant_id → variant_name map
    const variantIdToName = new Map<number, string>();
    for (const v of product.variants) {
      const name = v.title || v.option1;
      if (name) variantIdToName.set(v.id, name);
    }

    // Build variant_name → images from product.images[].variant_ids
    const variantImages = new Map<string, string[]>();
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (!img.src || !Array.isArray(img.variant_ids)) continue;
        const imgUrl = img.src.startsWith("//") ? `https:${img.src}` : img.src;
        for (const vid of img.variant_ids) {
          const vName = variantIdToName.get(vid);
          if (vName) {
            if (!variantImages.has(vName)) variantImages.set(vName, []);
            variantImages.get(vName)!.push(imgUrl);
          }
        }
      }
    }

    const variants: RawVariant[] = [];
    const seenNames = new Set<string>();

    for (const v of product.variants) {
      const name = v.title || v.option1;
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);

      // Priority: featured_image > product.images with variant_ids
      const images: string[] = [];
      const imgSrc = v.featured_image?.src;
      if (imgSrc) {
        images.push(imgSrc.startsWith("//") ? `https:${imgSrc}` : imgSrc);
      }
      // Add images from product.images that reference this variant
      const mappedImages = variantImages.get(name) || [];
      for (const mi of mappedImages) {
        if (!images.includes(mi)) images.push(mi);
      }

      variants.push({
        name,
        type: normalizeVariantType(typeof optionName === "string" ? optionName : "Variante"),
        images,
      });
    }

    return variants.length > 0 ? variants : null;
  } catch {
    return null;
  }
}

/**
 * Extract variants from Shopify product JSON embedded in the page.
 * Shopify stores variant data in script tags or structured data.
 * Returns null if not a Shopify page.
 */
function extractShopifyVariants($: cheerio.CheerioAPI, baseUrl: string): RawVariant[] | null {
  // Look for Shopify product JSON in script tags
  let productJson: any = null;

  $("script:not([src])").each((_, el) => {
    const text = $(el).html() || "";

    // Pattern 1: var meta = { product: { variants: [...] } }
    const metaMatch = text.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/);
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1]);
        if (meta?.product?.variants) {
          productJson = meta.product;
        }
      } catch { /* ignore */ }
    }

    // Pattern 2: "variants": [...] in product JSON
    if (!productJson) {
      const variantsMatch = text.match(/"variants"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
      if (variantsMatch) {
        try {
          const variants = JSON.parse(variantsMatch[1]);
          if (Array.isArray(variants) && variants.length > 0 && variants[0].title) {
            productJson = { variants, options: [] };
          }
        } catch { /* ignore */ }
      }
    }

    // Pattern 3: ShopifyAnalytics or product JSON object
    if (!productJson) {
      const productMatch = text.match(/product\s*(?::|=)\s*(\{[\s\S]*?"variants"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/);
      if (productMatch) {
        try {
          productJson = JSON.parse(productMatch[1]);
        } catch { /* ignore */ }
      }
    }
  });

  // Also check for JSON-LD structured data
  if (!productJson) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const ld = JSON.parse($(el).html() || "");
        if (ld["@type"] === "Product" && ld.offers) {
          // JSON-LD doesn't have great variant info, skip
        }
      } catch { /* ignore */ }
    });
  }

  if (!productJson?.variants || !Array.isArray(productJson.variants)) {
    return null;
  }

  // Determine option names (e.g., "Goût", "Taille")
  const optionNames: string[] = productJson.options || [];

  // Group by option values
  const variants: RawVariant[] = [];
  const seenNames = new Set<string>();

  for (const v of productJson.variants) {
    const name = v.title || v.option1 || v.name;
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);

    // Determine variant type from option names
    const type = optionNames.length > 0
      ? normalizeVariantType(optionNames[0])
      : (v.option2 ? "Variante" : guessVariantType(name));

    // Get variant image
    const images: string[] = [];
    const featuredImage = v.featured_image?.src || v.image?.src || v.featured_image;
    if (featuredImage && typeof featuredImage === "string") {
      images.push(resolveUrl(featuredImage.replace(/^\/\//, "https://"), baseUrl));
    }

    variants.push({ name, type, images });
  }

  return variants.length > 0 ? variants : null;
}

/**
 * Guess variant type from the variant name itself.
 */
function guessVariantType(name: string): string {
  const lower = name.toLowerCase();
  // Size patterns
  if (/^\d+\s*(ml|g|kg|l|oz|cl)\b/.test(lower) || /^(xs|s|m|l|xl|xxl)$/i.test(lower)) return "Taille";
  // Color patterns (hex or common colors)
  if (/^#[0-9a-f]{6}$/i.test(lower) || /^(noir|blanc|rouge|bleu|vert|rose|gris|beige|black|white|red|blue|green|pink)$/i.test(lower)) return "Couleur";
  return "Goût";
}

/**
 * Extract product variants (flavors, colors, sizes) from the page.
 * Looks for common e-commerce variant patterns:
 * - Select/option dropdowns
 * - Swatch buttons with data attributes
 * - Variant labels with associated images
 */
function extractVariants($: cheerio.CheerioAPI, baseUrl: string): RawVariant[] {
  const variants: RawVariant[] = [];
  const seenNames = new Set<string>();

  // ─── Pattern 1: Select dropdowns (Shopify, WooCommerce, etc.) ───
  $('select[name*="option"], select[id*="variant"], select[id*="option"], select[name*="variant"], select[data-option]').each((_, select) => {
    const label = inferVariantType($, select);
    $(select).find("option").each((_, opt) => {
      const name = $(opt).text().trim();
      if (name && name.length > 0 && name.length < 80 && !isPlaceholder(name) && !seenNames.has(name)) {
        seenNames.add(name);
        const variantImage = $(opt).attr("data-image") || $(opt).attr("data-img") || undefined;
        variants.push({
          name,
          type: label,
          images: variantImage ? [resolveUrl(variantImage, baseUrl)] : [],
        });
      }
    });
  });

  // ─── Pattern 2: Swatch buttons (Shopify, custom) ──────────────
  $('[class*="swatch"] button, [class*="swatch"] a, [class*="variant"] button, [class*="option"] button, [data-variant-id], [data-option-value]').each((_, el) => {
    const name =
      $(el).attr("data-value") ||
      $(el).attr("data-option-value") ||
      $(el).attr("title") ||
      $(el).attr("aria-label") ||
      $(el).text().trim();

    if (!name || name.length === 0 || name.length > 80 || seenNames.has(name)) return;
    seenNames.add(name);

    const type = inferVariantTypeFromEl($, el);

    // Try to find associated image
    const variantImages: string[] = [];
    const imgAttr = $(el).attr("data-image") || $(el).attr("data-img") || $(el).attr("data-variant-image");
    if (imgAttr) variantImages.push(resolveUrl(imgAttr, baseUrl));

    // Check for background-image in style (color swatches often use this)
    const style = $(el).attr("style") || "";
    const bgMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
    if (bgMatch) variantImages.push(resolveUrl(bgMatch[1], baseUrl));

    // Check for img inside the swatch
    const innerImg = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");
    if (innerImg) variantImages.push(resolveUrl(innerImg, baseUrl));

    variants.push({ name, type, images: variantImages });
  });

  // ─── Pattern 3: Radio inputs for variants ─────────────────────
  $('input[type="radio"][name*="option"], input[type="radio"][name*="variant"]').each((_, el) => {
    const name =
      $(el).attr("value") ||
      $(el).next("label").text().trim() ||
      $(`label[for="${$(el).attr("id")}"]`).text().trim();

    if (!name || name.length === 0 || name.length > 80 || seenNames.has(name)) return;
    seenNames.add(name);

    const type = inferVariantTypeFromEl($, el);
    const imgAttr = $(el).attr("data-image") || $(el).attr("data-variant-image");

    variants.push({
      name,
      type,
      images: imgAttr ? [resolveUrl(imgAttr, baseUrl)] : [],
    });
  });

  return variants;
}

/**
 * Infer variant type from the label of a select element.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferVariantType($: cheerio.CheerioAPI, select: any): string {
  // Check for label
  const id = $(select).attr("id");
  if (id) {
    const label = $(`label[for="${id}"]`).text().trim();
    if (label) return normalizeVariantType(label);
  }

  // Check parent for label text
  const parentLabel = $(select).parent().find("label").first().text().trim();
  if (parentLabel) return normalizeVariantType(parentLabel);

  // Check name attribute
  const name = $(select).attr("name") || "";
  if (name.toLowerCase().includes("color") || name.toLowerCase().includes("couleur")) return "Couleur";
  if (name.toLowerCase().includes("size") || name.toLowerCase().includes("taille")) return "Taille";
  if (name.toLowerCase().includes("flavor") || name.toLowerCase().includes("gout") || name.toLowerCase().includes("parfum")) return "Goût";

  return "Variante";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferVariantTypeFromEl($: cheerio.CheerioAPI, el: any): string {
  // Look for closest fieldset legend or label
  const fieldset = $(el).closest("fieldset");
  if (fieldset.length) {
    const legend = fieldset.find("legend").text().trim();
    if (legend) return normalizeVariantType(legend);
  }

  // Look for sibling/parent label
  const parentLabel = $(el).closest("[class*='option'], [class*='variant'], [class*='swatch']")
    .find("label, [class*='label'], [class*='title'], legend, h3, h4")
    .first().text().trim();
  if (parentLabel) return normalizeVariantType(parentLabel);

  return "Variante";
}

function normalizeVariantType(raw: string): string {
  const lower = raw.toLowerCase().replace(/[:\s]+$/, "").trim();
  if (lower.includes("couleur") || lower.includes("color") || lower.includes("colour")) return "Couleur";
  if (lower.includes("taille") || lower.includes("size")) return "Taille";
  if (lower.includes("gout") || lower.includes("goût") || lower.includes("flavor") || lower.includes("flavour") || lower.includes("parfum") || lower.includes("saveur")) return "Goût";
  if (lower.includes("poids") || lower.includes("weight") || lower.includes("contenance") || lower.includes("format")) return "Format";
  if (lower.includes("quantit") || lower.includes("quantity") || lower.includes("pack")) return "Quantité";
  // Return cleaned up version
  return raw.replace(/[:\s]+$/, "").trim().slice(0, 30) || "Variante";
}

function isPlaceholder(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("choisir") ||
    lower.includes("select") ||
    lower.includes("choose") ||
    lower.includes("---") ||
    lower === "-" ||
    lower === ""
  );
}

function resolveUrl(src: string, baseUrl: string): string {
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}
