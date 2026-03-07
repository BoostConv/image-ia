import { NextRequest, NextResponse } from "next/server";
import { scrapeBrandSite } from "@/lib/scraper/brand-site";
import { analyzeBrandSite } from "@/lib/ai/claude-creative";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Step 1: Scrape the website
    const rawData = await scrapeBrandSite(url);

    // Step 2: Claude analyzes and structures the brand identity
    const analysis = await analyzeBrandSite({
      siteName: rawData.siteName,
      description: rawData.description,
      tagline: rawData.tagline,
      colors: rawData.colors,
      fonts: rawData.fonts,
      headings: rawData.headings,
      fullText: rawData.fullText,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Brand scrape error:", error);
    return NextResponse.json(
      { error: `Erreur lors du scraping: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
