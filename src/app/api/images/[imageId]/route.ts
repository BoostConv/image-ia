import { NextRequest, NextResponse } from "next/server";
import { readImage, deleteImage } from "@/lib/images/storage";
import { db } from "@/lib/db";
import { generatedImages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;
  const relativePath = decodeURIComponent(imageId);

  const imageData = await readImage(relativePath);

  if (!imageData) {
    return NextResponse.json(
      { error: "Image non trouvee" },
      { status: 404 }
    );
  }

  const ext = relativePath.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

  return new NextResponse(new Uint8Array(imageData), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    // Fetch the image record to get the file path
    const result = await db
      .select({ filePath: generatedImages.filePath })
      .from(generatedImages)
      .where(eq(generatedImages.id, imageId))
      .limit(1);

    if (!result[0]) {
      return NextResponse.json({ error: "Image non trouvee" }, { status: 404 });
    }

    // Delete file from disk
    await deleteImage(result[0].filePath);

    // Delete DB record (cascades to reviews)
    await db.delete(generatedImages).where(eq(generatedImages.id, imageId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
