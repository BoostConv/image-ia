import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { layoutInspirations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/layout-inspirations/grouped
 * Returns all layout families with their first image for thumbnail display.
 */
export async function GET() {
  try {
    const all = await db.select().from(layoutInspirations);

    // Group by layout_family, keep first image as thumbnail
    const grouped: Record<string, { id: string; imagePath: string; name: string }[]> = {};
    for (const row of all) {
      if (!grouped[row.layoutFamily]) {
        grouped[row.layoutFamily] = [];
      }
      grouped[row.layoutFamily].push({
        id: row.id,
        imagePath: row.imagePath,
        name: row.name,
      });
    }

    // Build response with thumbnail for each family
    const families = Object.entries(grouped).map(([family, images]) => ({
      family,
      thumbnailId: images[0]?.id,
      count: images.length,
    }));

    return NextResponse.json(families);
  } catch (error) {
    console.error("Layout inspirations grouped error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
