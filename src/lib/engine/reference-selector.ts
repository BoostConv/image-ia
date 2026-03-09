import fs from "fs";
import path from "path";
import type { ArtDirection, SelectedReference } from "./types";

// ============================================================
// REFERENCE SELECTOR
// Selects and loads reference images based on art direction.
// Supports multiple reference roles: product fidelity, texture,
// packaging, usage, style/mood, inspiration.
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Select reference images for a single concept based on its art direction.
 * Returns loaded buffers ready to send to the image generation API.
 */
export function selectReferences(
  direction: ArtDirection,
  productImagePaths?: string[],
  inspirationPaths?: string[]
): SelectedReference[] {
  const refs: SelectedReference[] = [];

  // Product reference images (highest priority)
  if (direction.reference_strategy.use_product_ref && productImagePaths?.length) {
    const role = direction.reference_strategy.product_ref_role;

    // Select indices if art direction specifies preferences
    const preferredIndices = direction.reference_strategy.preferred_ref_indices;
    const pathsToUse = preferredIndices
      ? preferredIndices.map((i) => productImagePaths[i]).filter(Boolean)
      : productImagePaths;

    // Load up to 3 product references
    for (const imgPath of pathsToUse.slice(0, 3)) {
      const buffer = loadImage(imgPath);
      if (buffer) {
        refs.push({
          path: imgPath,
          role: role === "exact_reproduction" ? "product_fidelity" : "texture_material",
          buffer,
        });
      }
    }
  }

  // Style/mood references from inspirations
  if (direction.reference_strategy.use_style_ref && inspirationPaths?.length) {
    for (const imgPath of inspirationPaths.slice(0, 2)) {
      const buffer = loadImage(imgPath);
      if (buffer) {
        refs.push({
          path: imgPath,
          role: "style_mood",
          buffer,
        });
      }
    }
  }

  return refs;
}

/**
 * Select references for an entire batch.
 */
export function selectReferencesBatch(
  directions: ArtDirection[],
  productImagePaths?: string[],
  inspirationPaths?: string[]
): SelectedReference[][] {
  return directions.map((dir) =>
    selectReferences(dir, productImagePaths, inspirationPaths)
  );
}

/**
 * Load an image file from disk. Returns null if file doesn't exist.
 */
function loadImage(imagePath: string): Buffer | null {
  try {
    // Handle both absolute paths and relative paths (from data/)
    const fullPath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(DATA_DIR, imagePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`[RefSelector] Image not found: ${fullPath}`);
      return null;
    }

    return fs.readFileSync(fullPath);
  } catch (err) {
    console.warn(`[RefSelector] Failed to load image: ${imagePath}`, err);
    return null;
  }
}

/**
 * Get the primary product reference image (first one available).
 * Used when the API only supports a single reference.
 */
export function getPrimaryReference(
  references: SelectedReference[]
): SelectedReference | null {
  // Priority: product_fidelity > texture_material > packaging > usage > style_mood > inspiration
  const priority: SelectedReference["role"][] = [
    "product_fidelity",
    "texture_material",
    "packaging",
    "usage",
    "style_mood",
    "inspiration",
  ];

  for (const role of priority) {
    const ref = references.find((r) => r.role === role);
    if (ref) return ref;
  }

  return references[0] || null;
}
