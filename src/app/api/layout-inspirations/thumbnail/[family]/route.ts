import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layoutInspirations } from "@/lib/db/schema";
import type { LayoutFamily } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * GET /api/layout-inspirations/thumbnail/[family]
 * Serves the first layout inspiration image for a given layout family.
 * Used as a quick thumbnail preview in the generation UI.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ family: string }> }
) {
  const { family } = await params;

  const records = await db
    .select()
    .from(layoutInspirations)
    .where(eq(layoutInspirations.layoutFamily, family as LayoutFamily))
    .limit(1);

  if (!records.length) {
    return new NextResponse(null, { status: 404 });
  }

  const record = records[0];
  const fullPath = path.join(process.cwd(), record.imagePath);

  if (!existsSync(fullPath)) {
    return new NextResponse(null, { status: 404 });
  }

  const buffer = await readFile(fullPath);
  const ext = record.imagePath.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800", // 1 week cache
    },
  });
}
