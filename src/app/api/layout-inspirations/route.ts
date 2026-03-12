import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { layoutInspirations, brands } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { LayoutFamily } from "@/lib/db/schema";

const UPLOAD_DIR = "uploads/layouts";

/**
 * GET /api/layout-inspirations
 *
 * Query params:
 * - layoutFamily?: LayoutFamily - Filter by layout family
 * - brandId?: string - Filter by brand (null = global only)
 * - includeGlobal?: "true" - Include global layouts when filtering by brandId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutFamily = searchParams.get("layoutFamily") as LayoutFamily | null;
    const brandId = searchParams.get("brandId");
    const includeGlobal = searchParams.get("includeGlobal") === "true";

    let results;

    if (layoutFamily && brandId) {
      // Get brand-specific + optionally global for this layout family
      if (includeGlobal) {
        results = await db
          .select()
          .from(layoutInspirations)
          .where(
            and(
              eq(layoutInspirations.layoutFamily, layoutFamily),
              // brandId matches OR is null (global)
            )
          );
        // Filter in JS for the OR condition
        results = results.filter(
          (r) => r.brandId === brandId || r.brandId === null
        );
      } else {
        results = await db
          .select()
          .from(layoutInspirations)
          .where(
            and(
              eq(layoutInspirations.layoutFamily, layoutFamily),
              eq(layoutInspirations.brandId, brandId)
            )
          );
      }
    } else if (layoutFamily) {
      // Get all (brand + global) for this layout family
      results = await db
        .select()
        .from(layoutInspirations)
        .where(eq(layoutInspirations.layoutFamily, layoutFamily));
    } else if (brandId) {
      // Get all layouts for this brand
      if (includeGlobal) {
        results = await db.select().from(layoutInspirations);
        results = results.filter(
          (r) => r.brandId === brandId || r.brandId === null
        );
      } else {
        results = await db
          .select()
          .from(layoutInspirations)
          .where(eq(layoutInspirations.brandId, brandId));
      }
    } else {
      // Get all layouts (global only by default)
      results = await db
        .select()
        .from(layoutInspirations)
        .where(isNull(layoutInspirations.brandId));
    }

    return NextResponse.json({ inspirations: results });
  } catch (error) {
    console.error("[LayoutInspirations] GET Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/layout-inspirations
 *
 * Multipart form data:
 * - file: File (image)
 * - layoutFamily: LayoutFamily (required)
 * - name: string (required)
 * - description?: string
 * - gridSystem?: string
 * - readingOrder?: string
 * - bestFor?: string (JSON array)
 * - brandId?: string (null = global)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const layoutFamily = formData.get("layoutFamily") as LayoutFamily;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const gridSystem = formData.get("gridSystem") as string | null;
    const readingOrder = formData.get("readingOrder") as string | null;
    const bestForRaw = formData.get("bestFor") as string | null;
    const brandId = formData.get("brandId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Image requise" },
        { status: 400 }
      );
    }

    if (!layoutFamily || !name) {
      return NextResponse.json(
        { error: "layoutFamily et name requis" },
        { status: 400 }
      );
    }

    // Validate layoutFamily
    const validFamilies: LayoutFamily[] = [
      "left_copy_right_product",
      "center_hero_top_claim",
      "split_screen",
      "card_stack",
      "quote_frame",
      "badge_cluster",
      "vertical_story_stack",
      "diagonal_split",
      "hero_with_bottom_offer",
      "macro_with_side_copy",
    ];

    if (!validFamilies.includes(layoutFamily)) {
      return NextResponse.json(
        { error: `Layout family invalide: ${layoutFamily}` },
        { status: 400 }
      );
    }

    // If brandId provided, verify it exists
    if (brandId) {
      const brand = await db.select().from(brands).where(eq(brands.id, brandId));
      if (!brand.length) {
        return NextResponse.json(
          { error: "Marque introuvable" },
          { status: 404 }
        );
      }
    }

    // Parse bestFor if provided
    let bestFor: string[] | null = null;
    if (bestForRaw) {
      try {
        bestFor = JSON.parse(bestForRaw);
      } catch {
        bestFor = bestForRaw.split(",").map((s) => s.trim());
      }
    }

    // Create directory structure
    const familyDir = path.join(UPLOAD_DIR, layoutFamily);
    const fullDir = path.join(process.cwd(), familyDir);

    if (!existsSync(fullDir)) {
      await mkdir(fullDir, { recursive: true });
    }

    // Generate unique filename
    const id = nanoid();
    const ext = path.extname(file.name) || ".png";
    const filename = `${id}${ext}`;
    const relativePath = path.join(familyDir, filename);
    const fullPath = path.join(process.cwd(), relativePath);

    // Save file
    const bytes = await file.arrayBuffer();
    await writeFile(fullPath, Buffer.from(bytes));

    // Insert into database
    await db.insert(layoutInspirations).values({
      id,
      layoutFamily,
      name,
      imagePath: relativePath,
      description,
      gridSystem,
      readingOrder,
      bestFor,
      brandId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id,
      layoutFamily,
      name,
      imagePath: relativePath,
      description,
      gridSystem,
      readingOrder,
      bestFor,
      brandId,
    }, { status: 201 });
  } catch (error) {
    console.error("[LayoutInspirations] POST Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de l'upload: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/layout-inspirations
 *
 * Body:
 * - id: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID requis" },
        { status: 400 }
      );
    }

    // Get the record to delete file
    const records = await db
      .select()
      .from(layoutInspirations)
      .where(eq(layoutInspirations.id, id));

    if (!records.length) {
      return NextResponse.json(
        { error: "Inspiration introuvable" },
        { status: 404 }
      );
    }

    const record = records[0];

    // Delete file
    const fullPath = path.join(process.cwd(), record.imagePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }

    // Delete from database
    await db.delete(layoutInspirations).where(eq(layoutInspirations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LayoutInspirations] DELETE Error:", error);
    return NextResponse.json(
      { error: `Erreur lors de la suppression: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
