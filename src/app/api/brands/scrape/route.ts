import { NextRequest, NextResponse } from "next/server";
import { scrapeBrandSite } from "@/lib/scraper/brand-site";
import { analyzeBrandSite } from "@/lib/ai/claude-creative";
import fs from "fs/promises";
import path from "path";

async function downloadImage(
  imageUrl: string,
  brandId: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("svg")) ext = "svg";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("ico")) ext = "ico";

    const dir = path.join(process.cwd(), "data", "images", "brands", brandId);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `logo.${ext}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return `data/images/brands/${brandId}/logo.${ext}`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, brandId } = await request.json();

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

    // Step 3: Auto-download logo if brandId provided
    let logoPath: string | null = null;
    if (brandId) {
      const logoUrl = rawData.ogImage || rawData.favicon;
      if (logoUrl) {
        logoPath = await downloadImage(logoUrl, brandId);
        if (logoPath) {
          // Update brand in DB
          const { db } = await import("@/lib/db");
          const { brands } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");
          await db
            .update(brands)
            .set({ logoPath, updatedAt: new Date().toISOString() })
            .where(eq(brands.id, brandId));
        }
      }
    }

    return NextResponse.json({ ...analysis, logoPath });
  } catch (error) {
    console.error("Brand scrape error:", error);
    return NextResponse.json(
      { error: `Erreur lors du scraping: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
