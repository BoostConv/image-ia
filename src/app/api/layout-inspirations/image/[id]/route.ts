import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layoutInspirations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/layout-inspirations/image/[id]
 * Serves a layout inspiration image by its DB id.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const records = await db
    .select()
    .from(layoutInspirations)
    .where(eq(layoutInspirations.id, id));

  if (!records.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = records[0];
  const fullPath = path.join(process.cwd(), record.imagePath);

  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(fullPath);
  const ext = record.imagePath.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
