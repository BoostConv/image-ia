/**
 * Script: Analyze existing layout inspirations with Claude Vision.
 * Runs analysis on all layouts that don't have an analysis yet.
 *
 * Usage: npx tsx scripts/analyze-existing-layouts.ts
 */

import { db } from "../src/lib/db";
import { layoutInspirations } from "../src/lib/db/schema";
import { isNull, eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { analyzeLayoutScreenshot } from "../src/lib/engine/layout-analyzer";

const MAX_IMAGE_BYTES = 4_500_000; // 4.5MB to stay under Claude's 5MB limit

async function resizeIfNeeded(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_IMAGE_BYTES) return buffer;

  // Resize down progressively until under limit
  let quality = 80;
  let width = 1200;
  let result = buffer;

  while (result.length > MAX_IMAGE_BYTES && width >= 400) {
    result = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    width -= 200;
    quality -= 10;
  }

  console.log(`    Resized: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${(result.length / 1024 / 1024).toFixed(1)}MB`);
  return result;
}

async function main() {
  const forceAll = process.argv.includes("--force");
  console.log(`[Backfill] Fetching layouts${forceAll ? " (FORCE ALL)" : " without analysis"}...`);

  const all = await db.select().from(layoutInspirations);
  const toAnalyze = forceAll ? all : all.filter((r) => !r.analysis);

  console.log(`[Backfill] Found ${toAnalyze.length} layouts to analyze (${all.length} total)`);

  if (toAnalyze.length === 0) {
    console.log("[Backfill] Nothing to do.");
    process.exit(0);
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toAnalyze.length; i++) {
    const layout = toAnalyze[i];
    const fullPath = path.join(process.cwd(), layout.imagePath);

    console.log(`\n[${i + 1}/${toAnalyze.length}] ${layout.layoutFamily} — "${layout.name}"`);

    if (!existsSync(fullPath)) {
      console.log(`  ⚠ Image not found: ${fullPath} — skipping`);
      failed++;
      continue;
    }

    try {
      const rawBuffer = await readFile(fullPath);
      const imageBuffer = await resizeIfNeeded(rawBuffer);
      const analysis = await analyzeLayoutScreenshot(
        imageBuffer,
        layout.layoutFamily,
        layout.name
      );

      await db
        .update(layoutInspirations)
        .set({
          analysis,
          gridSystem: analysis.grid_structure,
          readingOrder: analysis.reading_order,
        })
        .where(eq(layoutInspirations.id, layout.id));

      console.log(`  ✓ Analysis saved — grid: "${analysis.grid_structure.slice(0, 60)}..."`);
      success++;

      // Rate limit: 1.5s between calls
      if (i < toAnalyze.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`  ✗ Failed:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n[Backfill] Done. ${success} analyzed, ${failed} failed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Backfill] Fatal error:", err);
  process.exit(1);
});
