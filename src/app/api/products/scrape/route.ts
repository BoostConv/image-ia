import { NextRequest, NextResponse } from "next/server";
import { scrapeProductPage } from "@/lib/scraper/product-page";
import { structureScrapedProduct } from "@/lib/ai/claude-creative";
import { saveImage } from "@/lib/images/storage";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const { url, brandId } = await request.json();

    if (!url || !brandId) {
      return NextResponse.json(
        { error: "URL et brandId requis" },
        { status: 400 }
      );
    }

    // Step 1: Scrape the page
    const rawData = await scrapeProductPage(url);

    // Step 2: Structure with Claude
    const structured = await structureScrapedProduct({
      title: rawData.title,
      description: rawData.description,
      price: rawData.price,
      bulletPoints: rawData.bulletPoints,
      fullText: rawData.fullText,
    });

    // Step 3: Download and save images
    const savedImages: string[] = [];
    if (rawData.images && rawData.images.length > 0) {
      const imagesToDownload = rawData.images.slice(0, 5);
      for (const imgUrl of imagesToDownload) {
        try {
          const imgRes = await fetch(imgUrl, {
            signal: AbortSignal.timeout(10000),
          });
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            const ext = contentType.includes("png")
              ? "png"
              : contentType.includes("webp")
                ? "webp"
                : "jpg";
            const fileName = `scraped_${nanoid(8)}.${ext}`;
            const subDir = `brands/${brandId}/products`;
            const relativePath = await saveImage(buffer, subDir, fileName);
            savedImages.push(relativePath);
          }
        } catch {
          // Skip failed image downloads
        }
      }
    }

    return NextResponse.json({
      ...structured,
      imagePaths: savedImages,
      rawTitle: rawData.title,
      rawDescription: rawData.description,
      rawPrice: rawData.price,
    });
  } catch (error) {
    console.error("Product scrape error:", error);
    return NextResponse.json(
      { error: `Erreur lors du scraping: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
