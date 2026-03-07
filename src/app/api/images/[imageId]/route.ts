import { NextRequest, NextResponse } from "next/server";
import { readImage } from "@/lib/images/storage";

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
