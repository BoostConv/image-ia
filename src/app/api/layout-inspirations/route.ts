import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { layoutInspirations, brands } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { LayoutFamily } from "@/lib/db/schema";
import { analyzeLayoutScreenshot } from "@/lib/engine/layout-analyzer";

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
      // Éducatifs
      "story_sequence", "listicle", "annotation_callout", "flowchart",
      // Centrés Image
      "hero_image", "product_focus", "product_in_context", "probleme_zoome",
      "golden_hour", "macro_detail", "action_shot", "ingredient_showcase",
      "scale_shot", "destruction_shot", "texture_fill", "negative_space",
      // Social Proof
      "testimonial_card", "ugc_style", "press_as_seen_in", "wall_of_love",
      "statistique_data_point", "tweet_post_screenshot",
      // Comparatifs
      "split_screen", "timeline_compare", "avant_apres",
      // Centrés Texte
      "text_heavy", "single_word", "fill_the_blank", "two_truths", "manifesto", "quote_card",
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
    const imageBuffer = Buffer.from(bytes);
    await writeFile(fullPath, imageBuffer);

    // Analyze layout with Claude Vision
    let analysis = null;
    try {
      analysis = await analyzeLayoutScreenshot(imageBuffer, layoutFamily, name);
      console.log(`[LayoutInspirations] Vision analysis complete for "${name}" (${layoutFamily})`);
    } catch (err) {
      console.warn(`[LayoutInspirations] Vision analysis failed for "${name}", continuing without:`, err);
    }

    // Insert into database
    await db.insert(layoutInspirations).values({
      id,
      layoutFamily,
      name,
      imagePath: relativePath,
      description,
      gridSystem: gridSystem || analysis?.grid_structure || null,
      readingOrder: readingOrder || analysis?.reading_order || null,
      bestFor,
      brandId,
      analysis,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id,
      layoutFamily,
      name,
      imagePath: relativePath,
      description,
      gridSystem: gridSystem || analysis?.grid_structure || null,
      readingOrder: readingOrder || analysis?.reading_order || null,
      bestFor,
      brandId,
      analysis,
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
