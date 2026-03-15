/**
 * Import layout inspiration images from Notion page into the database.
 *
 * Usage:
 *   source .env.local && export DATABASE_URL && npx tsx scripts/import-layout-inspirations.ts
 *
 * This script:
 * 1. Reads the cached Notion page content
 * 2. Extracts all layout names and their associated images
 * 3. Uses Notion layout names directly as layout_family (snake_case)
 * 4. Downloads each image and saves to uploads/layouts/{family}/
 * 5. Inserts records into the layoutInspirations table
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { db } from "../src/lib/db";
import { layoutInspirations } from "../src/lib/db/schema";
import type { LayoutFamily } from "../src/lib/db/schema";

// ─── VALID LAYOUT FAMILIES (must match taxonomy.ts) ──────────

const VALID_LAYOUTS: Set<string> = new Set([
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
]);

// ─── NOTION NAME → SNAKE_CASE MAPPING ───────────────────────
// Maps the exact Notion heading names to our snake_case layout_family values.

const NOTION_TO_SNAKE: Record<string, string> = {
  "Story-Sequence": "story_sequence",
  "Story Sequence": "story_sequence",
  "Listicle": "listicle",
  "Annotation / Callout": "annotation_callout",
  "Annotation/Callout": "annotation_callout",
  "Flowchart": "flowchart",
  "Hero Image": "hero_image",
  "Product Focus": "product_focus",
  "Product-in-Context": "product_in_context",
  "Product in Context": "product_in_context",
  "Problème Zoomé": "probleme_zoome",
  "Probleme Zoome": "probleme_zoome",
  "Golden Hour": "golden_hour",
  "Macro Detail": "macro_detail",
  "Action Shot": "action_shot",
  "Ingredient Showcase": "ingredient_showcase",
  "Scale Shot": "scale_shot",
  "Destruction Shot": "destruction_shot",
  "Texture Fill": "texture_fill",
  "Negative Space": "negative_space",
  "Testimonial Card": "testimonial_card",
  "UGC-Style": "ugc_style",
  "UGC Style": "ugc_style",
  "Press / As Seen In": "press_as_seen_in",
  "Press/As Seen In": "press_as_seen_in",
  "Wall of Love": "wall_of_love",
  "Statistique / Data Point": "statistique_data_point",
  "Statistique/Data Point": "statistique_data_point",
  "Tweet/Post Screenshot": "tweet_post_screenshot",
  "Tweet / Post Screenshot": "tweet_post_screenshot",
  "Split-Screen": "split_screen",
  "Split Screen": "split_screen",
  "Timeline Compare": "timeline_compare",
  "AVANT APRES": "avant_apres",
  "Avant Apres": "avant_apres",
  "Avant/Après": "avant_apres",
  "Text-Heavy": "text_heavy",
  "Text Heavy": "text_heavy",
  "Single Word": "single_word",
  "Fill the Blank": "fill_the_blank",
  "Fill-the-Blank": "fill_the_blank",
  "Two Truths": "two_truths",
  "Manifesto": "manifesto",
  "Quote Card": "quote_card",
};

// ─── PARSE NOTION CONTENT ────────────────────────────────────

interface LayoutImage {
  notionName: string;
  layoutFamily: LayoutFamily;
  imageUrl: string;
  variant: string;
  category: string;
}

function toSnakeCase(name: string): string {
  // Try exact mapping first
  if (NOTION_TO_SNAKE[name]) return NOTION_TO_SNAKE[name];

  // Try case-insensitive mapping
  for (const [key, value] of Object.entries(NOTION_TO_SNAKE)) {
    if (key.toLowerCase() === name.toLowerCase()) return value;
  }

  // Auto-convert: lowercase, replace spaces/hyphens/slashes with underscores, remove accents
  const snake = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return snake;
}

function parseNotionContent(text: string): LayoutImage[] {
  const results: LayoutImage[] = [];
  let currentCategory = "";
  let currentLayout = "";
  let v2Counter = 0;
  let inV2 = false;

  const lines = text.split("\n");

  for (const line of lines) {
    // Detect category
    const catMatch = line.match(/CATÉGORIE \d+\s*(.+?)(?:<\/summary>|$)/);
    if (catMatch) {
      currentCategory = catMatch[0].replace(/<\/summary>/, "").trim();
      continue;
    }

    // Detect V2 toggle
    if (line.includes("<summary>V2</summary>") || line.includes("<summary>V2")) {
      inV2 = true;
      v2Counter = 0;
      continue;
    }
    if (line.includes("</details>")) {
      inV2 = false;
      continue;
    }

    // Detect layout name (text line, not an image, not V2)
    const layoutMatch = line.match(/^\t+\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\-/&() ]+)\s*$/);
    if (layoutMatch && !inV2) {
      const name = layoutMatch[1].trim();
      if (name !== "V2" && name !== "V3" && name.length > 2) {
        currentLayout = name;
        v2Counter = 0;
      }
      continue;
    }

    // Detect image URL
    const imgMatch = line.match(/!\[\]\((https:\/\/prod-files-secure[^)]+)\)/);
    if (imgMatch && currentLayout) {
      const snake = toSnakeCase(currentLayout);
      if (VALID_LAYOUTS.has(snake)) {
        const variant = inV2 ? `v2_${++v2Counter}` : "main";
        results.push({
          notionName: currentLayout,
          layoutFamily: snake as LayoutFamily,
          imageUrl: imgMatch[1],
          variant,
          category: currentCategory,
        });
      } else {
        console.warn(`  ⚠ Unknown layout "${currentLayout}" → "${snake}" — skipping image`);
      }
    }
  }

  return results;
}

// ─── DOWNLOAD & IMPORT ──────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function importAll() {
  console.log("Reading Notion content from cached file...\n");

  // Read from cached Notion fetch
  const cacheDir = path.join(
    process.env.HOME || "",
    ".claude/projects/-Users-sebastientortu-Image-IA/01e5d64b-0c9f-4d18-af8e-a136136abf0d/tool-results"
  );

  const fs = await import("fs/promises");
  const files = await fs.readdir(cacheDir);
  const notionFile = files.find(f => f.includes("notion-fetch"));

  if (!notionFile) {
    console.error("No cached Notion file found. Re-fetch the Notion page first.");
    process.exit(1);
  }

  const raw = await fs.readFile(path.join(cacheDir, notionFile), "utf-8");
  const data = JSON.parse(raw);
  const parsed = JSON.parse(data[0].text);
  const text = parsed.text;

  // Parse
  const images = parseNotionContent(text);
  console.log(`Found ${images.length} images across ${new Set(images.map(i => i.notionName)).size} layouts\n`);

  // Show mapping summary
  const byFamily: Record<string, string[]> = {};
  for (const img of images) {
    if (!byFamily[img.layoutFamily]) byFamily[img.layoutFamily] = [];
    if (!byFamily[img.layoutFamily].includes(img.notionName)) {
      byFamily[img.layoutFamily].push(img.notionName);
    }
  }

  console.log("Layout mapping:");
  for (const [family, names] of Object.entries(byFamily).sort()) {
    console.log(`  ${family}: ${names.join(", ")}`);
  }
  console.log();

  // Download and import each image
  let success = 0;
  let failed = 0;

  for (const img of images) {
    const familyDir = path.join("uploads", "layouts", img.layoutFamily);
    const fullDir = path.join(process.cwd(), familyDir);

    if (!existsSync(fullDir)) {
      await mkdir(fullDir, { recursive: true });
    }

    const id = nanoid();
    const filename = `${id}.png`;
    const relativePath = path.join(familyDir, filename);
    const fullPath = path.join(process.cwd(), relativePath);

    const displayName = `${img.notionName}${img.variant !== "main" ? ` (${img.variant})` : ""}`;

    try {
      process.stdout.write(`  ${displayName} → ${img.layoutFamily}...`);
      const buffer = await downloadImage(img.imageUrl);
      await writeFile(fullPath, buffer);

      await db.insert(layoutInspirations).values({
        id,
        layoutFamily: img.layoutFamily,
        name: displayName,
        imagePath: relativePath,
        description: `${img.category} — ${img.notionName}`,
        brandId: null,
        createdAt: new Date().toISOString(),
      });

      console.log(` OK (${(buffer.length / 1024).toFixed(0)}KB)`);
      success++;

      // Small delay to avoid rate limiting on S3
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.log(` FAILED: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nImport done: ${success} success, ${failed} failed`);
  process.exit(0);
}

importAll().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
