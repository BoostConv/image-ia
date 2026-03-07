import { NextRequest } from "next/server";
import archiver from "archiver";
import { PassThrough } from "stream";
import { db } from "@/lib/db";
import { generatedImages, brands, personas } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { readImage } from "@/lib/images/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageIds, brandId } = body;

    if (!imageIds?.length) {
      return new Response(
        JSON.stringify({ error: "imageIds requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch images metadata
    const images = await db
      .select()
      .from(generatedImages)
      .where(inArray(generatedImages.id, imageIds));

    if (!images.length) {
      return new Response(
        JSON.stringify({ error: "Aucune image trouvee" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get brand name for filename
    let brandName = "export";
    if (brandId) {
      const brand = await db
        .select()
        .from(brands)
        .where(eq(brands.id, brandId))
        .limit(1);
      if (brand[0]) brandName = brand[0].name.replace(/[^a-zA-Z0-9]/g, "_");
    }

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 6 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

    // Build metadata CSV
    let csv = "filename,format,status,tags,created_at\n";
    let index = 0;

    for (const img of images) {
      const imageBuffer = await readImage(img.filePath);
      if (!imageBuffer) continue;

      // Generate clean filename
      const ext = img.mimeType?.includes("png") ? "png" : img.mimeType?.includes("webp") ? "webp" : "jpg";
      const status = img.status || "pending";
      const format = img.format || "unknown";

      // Organize by status folder
      const folder = status;
      const fileName = `${brandName}_${format}_${String(index + 1).padStart(3, "0")}.${ext}`;
      const fullPath = `${folder}/${fileName}`;

      archive.append(imageBuffer, { name: fullPath });

      // Add to CSV
      const tags = (img.tags as string[])?.join("; ") || "";
      csv += `"${fullPath}","${format}","${status}","${tags}","${img.createdAt}"\n`;

      index++;
    }

    // Add metadata CSV
    archive.append(csv, { name: "metadata.csv" });

    archive.finalize();

    // Convert PassThrough stream to ReadableStream for Response
    const readable = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passthrough.on("end", () => {
          controller.close();
        });
        passthrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    const zipName = `${brandName}_${dateStr}_${images.length}images.zip`;

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de l'export" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
