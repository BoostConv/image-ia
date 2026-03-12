import { NextRequest, NextResponse } from "next/server";
import { scrapeBrandSite, type RawBrandData } from "@/lib/scraper/brand-site";
import { generateComprehensiveBrief, type ScrapedBrandData } from "@/lib/ai/brand-brief-generator";

// ============================================================
// POST /api/brands/generate-brief
// Generates a comprehensive brand brief from website URL
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { name, websiteUrl } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Le nom de la marque est requis" },
        { status: 400 }
      );
    }

    if (!websiteUrl?.trim()) {
      return NextResponse.json(
        { error: "L'URL du site web est requise" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "URL invalide. Format attendu: https://example.com" },
        { status: 400 }
      );
    }

    console.log(`[GenerateBrief] Starting for ${name} at ${websiteUrl}`);

    // Step 1: Scrape the main page
    let mainPageData: RawBrandData;
    try {
      mainPageData = await scrapeBrandSite(websiteUrl);
    } catch (e) {
      console.error("[GenerateBrief] Main page scrape failed:", e);
      return NextResponse.json(
        { error: `Impossible de scraper le site: ${(e as Error).message}` },
        { status: 400 }
      );
    }

    // Step 2: Scrape additional pages in parallel
    const additionalPages = [
      "/about",
      "/a-propos",
      "/notre-histoire",
      "/qui-sommes-nous",
      "/about-us",
      "/our-story",
    ];

    const scrapedData: ScrapedBrandData = {
      siteName: mainPageData.siteName,
      description: mainPageData.description,
      tagline: mainPageData.tagline,
      colors: mainPageData.colors,
      fonts: mainPageData.fonts,
      headings: mainPageData.headings,
      fullText: mainPageData.fullText,
    };

    // Try to scrape additional pages (non-blocking)
    const additionalResults = await Promise.allSettled(
      additionalPages.map(async (path) => {
        const pageUrl = new URL(path, parsedUrl.origin).href;
        try {
          const data = await scrapeBrandSite(pageUrl);
          return { path, data };
        } catch {
          return null;
        }
      })
    );

    // Extract text from successful additional page scrapes
    for (const result of additionalResults) {
      if (result.status === "fulfilled" && result.value?.data) {
        const { path, data } = result.value;
        if (path.includes("about") || path.includes("propos") || path.includes("qui-sommes")) {
          scrapedData.aboutPageText = data.fullText;
        }
        if (path.includes("histoire") || path.includes("story")) {
          scrapedData.historyPageText = data.fullText;
        }
      }
    }

    console.log("[GenerateBrief] Scraped data summary:", {
      siteName: scrapedData.siteName,
      hasDescription: !!scrapedData.description,
      colorsCount: scrapedData.colors.length,
      headingsCount: scrapedData.headings.length,
      hasAboutPage: !!scrapedData.aboutPageText,
      hasHistoryPage: !!scrapedData.historyPageText,
    });

    // Step 3: Generate brief using Claude
    const brief = await generateComprehensiveBrief(name, scrapedData);

    console.log("[GenerateBrief] Brief generated successfully:", {
      status: brief.status,
      confidence: brief.metadata.confidence,
      gapsCount: brief.metadata.gaps.length,
    });

    return NextResponse.json({
      brief,
      scrapedPreview: {
        siteName: scrapedData.siteName,
        description: scrapedData.description,
        tagline: scrapedData.tagline,
        colorsExtracted: scrapedData.colors.slice(0, 5),
        fontsExtracted: scrapedData.fonts.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("[GenerateBrief] Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de la generation du brief: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
