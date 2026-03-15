import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import type { AutoAnalysisStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeBrandSite } from "@/lib/scraper/brand-site";
import { extractImageUrls, downloadImage } from "@/lib/scraper/website-image-extractor";
import { fetchInstagramImages } from "@/lib/scraper/instagram-scraper";
import { extractPageIdFromUrl, fetchMetaAds, scrapeMetaAdLibraryPage } from "@/lib/scraper/meta-ad-library";
import { analyzeBrandSite } from "@/lib/ai/claude-creative";
import { analyzeBrandDA } from "@/lib/engine/brand-da-analyzer";
import { saveImage } from "@/lib/images/storage";
import sharp from "sharp";
import { nanoid } from "nanoid";

const MAX_IMAGE_BYTES = 4_500_000;

async function resizeIfNeeded(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_IMAGE_BYTES) return buffer;
  let quality = 80;
  let width = 1200;
  let result = buffer;
  while (result.length > MAX_IMAGE_BYTES && width >= 400) {
    result = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    width -= 200;
    quality -= 10;
  }
  return result;
}

async function toJpegBuffer(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).jpeg({ quality: 85 }).toBuffer();
}

// ─── WEBSITE ANALYSIS ──────────────────────────────────────
async function analyzeWebsite(brandId: string, websiteUrl: string) {
  console.log(`[AutoAnalyze] Website: scraping ${websiteUrl}...`);

  // Scrape raw data
  const rawData = await scrapeBrandSite(websiteUrl);

  // Claude analyzes brand identity
  const analysis = await analyzeBrandSite({
    siteName: rawData.siteName,
    description: rawData.description,
    tagline: rawData.tagline,
    colors: rawData.colors,
    fonts: rawData.fonts,
    headings: rawData.headings,
    fullText: rawData.fullText,
  });

  // Build structured palette from analysis
  const colorPalette = analysis.colorPalette || null;
  const typography = analysis.typography || null;

  // Fetch HTML directly to extract images
  let imageUrls: string[] = [];
  try {
    const res = await fetch(websiteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      imageUrls = extractImageUrls(html, websiteUrl);
    }
  } catch {
    console.warn("[AutoAnalyze] Failed to fetch HTML for image extraction");
  }

  // Download images
  const downloadedPaths: string[] = [];
  for (const imgUrl of imageUrls.slice(0, 6)) {
    try {
      const buf = await downloadImage(imgUrl);
      if (buf) {
        const jpegBuf = await toJpegBuffer(buf);
        const fileName = `site_${nanoid(8)}.jpg`;
        const relativePath = await saveImage(jpegBuf, `brands/${brandId}/style`, fileName);
        downloadedPaths.push(relativePath);
      }
    } catch {
      // Skip failed downloads
    }
  }

  // Update brand in DB
  const updateData: Record<string, any> = { updatedAt: new Date().toISOString() };

  if (colorPalette) updateData.colorPalette = colorPalette;
  if (typography) updateData.typography = typography;
  if (analysis.description) updateData.description = analysis.description;
  if (analysis.positioning) updateData.positioning = analysis.positioning;
  if (analysis.tone) updateData.tone = analysis.tone;
  if (analysis.mission) updateData.mission = analysis.mission;
  if (analysis.vision) updateData.vision = analysis.vision;

  await db.update(brands).set(updateData).where(eq(brands.id, brandId));

  console.log(`[AutoAnalyze] Website: palette=${!!colorPalette}, typo=${!!typography}, images=${downloadedPaths.length}`);

  return {
    colorsFound: rawData.colors.length,
    fontsFound: rawData.fonts.length,
    imagePaths: downloadedPaths,
    colorPalette,
    typography,
  };
}

// ─── INSTAGRAM ANALYSIS ────────────────────────────────────
async function analyzeInstagram(brandId: string, handle: string) {
  console.log(`[AutoAnalyze] Instagram: fetching @${handle}...`);

  const imageUrls = await fetchInstagramImages(handle, 8);
  if (imageUrls.length === 0) {
    console.warn(`[AutoAnalyze] Instagram: no images found for @${handle}`);
    return { imagesDownloaded: 0, imagePaths: [] };
  }

  const downloadedPaths: string[] = [];
  for (const imgUrl of imageUrls.slice(0, 8)) {
    try {
      const buf = await downloadImage(imgUrl);
      if (buf) {
        const jpegBuf = await toJpegBuffer(buf);
        const fileName = `ig_${nanoid(8)}.jpg`;
        const relativePath = await saveImage(jpegBuf, `brands/${brandId}/style`, fileName);
        downloadedPaths.push(relativePath);
      }
    } catch {
      // Skip
    }
  }

  console.log(`[AutoAnalyze] Instagram: downloaded ${downloadedPaths.length} images`);
  return { imagesDownloaded: downloadedPaths.length, imagePaths: downloadedPaths };
}

// ─── META AD LIBRARY ANALYSIS ──────────────────────────────
async function analyzeMetaAds(brandId: string, facebookPageUrl: string) {
  console.log(`[AutoAnalyze] Meta Ads: analyzing ${facebookPageUrl}...`);

  const pageIdOrSlug = extractPageIdFromUrl(facebookPageUrl);
  if (!pageIdOrSlug) {
    throw new Error(`Impossible d'extraire l'ID de la page depuis: ${facebookPageUrl}`);
  }

  // Try API first, then scrape fallback
  let imageUrls: string[] = [];

  const apiAds = await fetchMetaAds(pageIdOrSlug, 10);
  if (apiAds.length > 0) {
    imageUrls = apiAds
      .map(ad => ad.imageUrl)
      .filter(Boolean) as string[];
  }

  if (imageUrls.length === 0) {
    // Fallback: scrape the public page
    imageUrls = await scrapeMetaAdLibraryPage(pageIdOrSlug);
  }

  if (imageUrls.length === 0) {
    console.warn(`[AutoAnalyze] Meta Ads: no ads found for ${pageIdOrSlug}`);
    return { adsFound: 0, imagePaths: [] };
  }

  // Download ad images as brand style images
  const downloadedPaths: string[] = [];
  for (const imgUrl of imageUrls.slice(0, 8)) {
    try {
      const buf = await downloadImage(imgUrl);
      if (buf) {
        const jpegBuf = await toJpegBuffer(buf);
        const fileName = `ad_${nanoid(8)}.jpg`;
        const relativePath = await saveImage(jpegBuf, `brands/${brandId}/style`, fileName);
        downloadedPaths.push(relativePath);
      }
    } catch {
      // Skip
    }
  }

  console.log(`[AutoAnalyze] Meta Ads: downloaded ${downloadedPaths.length} ad images`);
  return { adsFound: imageUrls.length, imagePaths: downloadedPaths };
}

// ─── ORCHESTRATOR ──────────────────────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  try {
  const { brandId } = await params;

  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
  if (!brand) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }

  const hasWebsite = !!brand.websiteUrl?.trim();
  const hasInstagram = !!brand.instagramHandle?.trim();
  const hasFacebook = !!brand.facebookPageUrl?.trim();

  if (!hasWebsite && !hasInstagram && !hasFacebook) {
    return NextResponse.json(
      { error: "Renseignez au moins une source (site web, Instagram ou page Facebook)" },
      { status: 400 },
    );
  }

  // Initialize status
  const status: AutoAnalysisStatus = {
    website: hasWebsite ? "running" : "skipped",
    instagram: hasInstagram ? "running" : "skipped",
    metaAds: hasFacebook ? "running" : "skipped",
    startedAt: new Date().toISOString(),
    results: {},
  };

  await db.update(brands).set({ autoAnalysisStatus: status }).where(eq(brands.id, brandId));

  // Run all sources in parallel
  const allImagePaths: string[] = [...(brand.brandStyleImages || [])];

  const [websiteResult, instagramResult, metaAdsResult] = await Promise.allSettled([
    hasWebsite
      ? analyzeWebsite(brandId, brand.websiteUrl!)
      : Promise.resolve(null),
    hasInstagram
      ? analyzeInstagram(brandId, brand.instagramHandle!)
      : Promise.resolve(null),
    hasFacebook
      ? analyzeMetaAds(brandId, brand.facebookPageUrl!)
      : Promise.resolve(null),
  ]);

  // Process results
  const errors: Record<string, string> = {};

  if (websiteResult.status === "fulfilled" && websiteResult.value) {
    status.website = "done";
    status.results!.colorsFound = websiteResult.value.colorsFound;
    status.results!.fontsFound = websiteResult.value.fontsFound;
    allImagePaths.push(...websiteResult.value.imagePaths);
  } else if (websiteResult.status === "rejected") {
    status.website = "error";
    errors.website = websiteResult.reason?.message || "Erreur inconnue";
    console.error("[AutoAnalyze] Website error:", websiteResult.reason);
  }

  if (instagramResult.status === "fulfilled" && instagramResult.value) {
    status.instagram = "done";
    allImagePaths.push(...instagramResult.value.imagePaths);
    status.results!.imagesDownloaded = (status.results!.imagesDownloaded || 0) + instagramResult.value.imagesDownloaded;
  } else if (instagramResult.status === "rejected") {
    status.instagram = "error";
    errors.instagram = instagramResult.reason?.message || "Erreur inconnue";
    console.error("[AutoAnalyze] Instagram error:", instagramResult.reason);
  }

  if (metaAdsResult.status === "fulfilled" && metaAdsResult.value) {
    status.metaAds = "done";
    status.results!.adsFound = metaAdsResult.value.adsFound;
    allImagePaths.push(...metaAdsResult.value.imagePaths);
    status.results!.imagesDownloaded = (status.results!.imagesDownloaded || 0) + metaAdsResult.value.imagePaths.length;
  } else if (metaAdsResult.status === "rejected") {
    status.metaAds = "error";
    errors.metaAds = metaAdsResult.reason?.message || "Erreur inconnue";
    console.error("[AutoAnalyze] Meta Ads error:", metaAdsResult.reason);
  }

  // Update brandStyleImages with all collected images
  const uniquePaths = [...new Set(allImagePaths)];

  // Run DA fingerprint if we have images
  let daFingerprint: Record<string, unknown> | null = null;
  if (uniquePaths.length > 0) {
    try {
      const { readImage } = await import("@/lib/images/storage");
      const imageBuffers: Buffer[] = [];
      for (const p of uniquePaths.slice(0, 8)) {
        const buf = await readImage(p);
        if (buf) {
          const resized = await resizeIfNeeded(buf);
          imageBuffers.push(resized);
        }
      }
      if (imageBuffers.length > 0) {
        daFingerprint = await analyzeBrandDA(imageBuffers, brand.name) as unknown as Record<string, unknown>;
        console.log(`[AutoAnalyze] DA fingerprint generated from ${imageBuffers.length} images`);
      }
    } catch (e) {
      console.error("[AutoAnalyze] DA fingerprint error:", e);
      errors.daFingerprint = (e as Error).message;
    }
  }

  // Final DB update
  status.completedAt = new Date().toISOString();
  if (Object.keys(errors).length > 0) status.errors = errors;
  status.results!.imagesDownloaded = uniquePaths.length - (brand.brandStyleImages?.length || 0);

  const finalUpdate: Record<string, any> = {
    autoAnalysisStatus: status,
    brandStyleImages: uniquePaths,
    updatedAt: new Date().toISOString(),
  };
  if (daFingerprint) finalUpdate.daFingerprint = daFingerprint;

  await db.update(brands).set(finalUpdate).where(eq(brands.id, brandId));

  return NextResponse.json({
    status,
    totalImages: uniquePaths.length,
    newImages: uniquePaths.length - (brand.brandStyleImages?.length || 0),
    hasDaFingerprint: !!daFingerprint,
  });
  } catch (error) {
    console.error("[AutoAnalyze] Fatal error:", error);
    return NextResponse.json(
      { error: `Erreur auto-analyse: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}

/**
 * GET: Returns the current auto-analysis status for polling.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));
  if (!brand) {
    return NextResponse.json({ error: "Marque introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    status: brand.autoAnalysisStatus || null,
    hasImages: (brand.brandStyleImages?.length || 0) > 0,
    hasDaFingerprint: !!brand.daFingerprint,
  });
}
