import fs from "fs";
import path from "path";
import type { ArtDirection, SelectedReference } from "./types";
import type { LayoutFamily } from "../db/schema";
import { getLayoutInspirationImage } from "../db/queries/layouts";

// ============================================================
// REFERENCE SELECTOR
// Selects and loads reference images based on art direction.
// Supports multiple reference roles: product fidelity, texture,
// packaging, usage, style/mood, inspiration, layout_structure.
//
// v3.2: Accepts additional user-uploaded reference images (Buffer[])
// that are injected as product_fidelity refs alongside disk images.
//
// v4 (Phase 5+): Adds layout inspiration and brand style loading.
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Select reference images for a single concept based on its art direction.
 * Returns loaded buffers ready to send to the image generation API.
 *
 * @param additionalImages - User-uploaded reference images (already decoded Buffers).
 *   These are added as product_fidelity refs and count toward the max limit.
 */
export function selectReferences(
  direction: ArtDirection,
  productImagePaths?: string[],
  inspirationPaths?: string[],
  additionalImages?: Buffer[],
): SelectedReference[] {
  const refs: SelectedReference[] = [];

  // Additional user-uploaded images (highest priority — user chose these)
  if (additionalImages?.length) {
    for (let i = 0; i < additionalImages.length && refs.length < 3; i++) {
      refs.push({
        path: `[user_upload_${i}]`,
        role: "product_fidelity",
        buffer: additionalImages[i],
      });
    }
  }

  // Product reference images from disk (fill remaining slots up to 3)
  if (direction.reference_strategy.use_product_ref && productImagePaths?.length && refs.length < 3) {
    const role = direction.reference_strategy.product_ref_role;

    // Select indices if art direction specifies preferences
    const preferredIndices = direction.reference_strategy.preferred_ref_indices;
    const pathsToUse = preferredIndices
      ? preferredIndices.map((i) => productImagePaths[i]).filter(Boolean)
      : productImagePaths;

    const remaining = 3 - refs.length;
    for (const imgPath of pathsToUse.slice(0, remaining)) {
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
 * Additional images are shared across all concepts in the batch.
 */
export function selectReferencesBatch(
  directions: ArtDirection[],
  productImagePaths?: string[],
  inspirationPaths?: string[],
  additionalImages?: Buffer[],
): SelectedReference[][] {
  return directions.map((dir) =>
    selectReferences(dir, productImagePaths, inspirationPaths, additionalImages)
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
  // Priority: product_fidelity > texture_material > packaging > usage > layout_structure > brand_style > style_mood > inspiration
  const priority: SelectedReference["role"][] = [
    "product_fidelity",
    "texture_material",
    "packaging",
    "usage",
    "layout_structure",
    "brand_style",
    "style_mood",
    "inspiration",
  ];

  for (const role of priority) {
    const ref = references.find((r) => r.role === role);
    if (ref) return ref;
  }

  return references[0] || null;
}

// ============================================================
// V4 REFERENCE SELECTOR (Phase 5+)
// Enhanced selection with layout inspiration and brand style.
// ============================================================

export interface ReferenceSelectionInputV4 {
  direction: ArtDirection;
  productImagePaths?: string[];
  inspirationPaths?: string[];
  additionalImages?: Buffer[];
  layoutFamily: LayoutFamily;
  brandId: string;
  brandStyleImagePaths?: string[];
}

/**
 * Select reference images (v4 — Phase 5+).
 * Adds layout inspiration and brand style images.
 *
 * Priority order:
 * 1. Layout inspiration (if available for this layout family)
 * 2. User uploads (product_fidelity)
 * 3. Product images from disk
 * 4. Brand style images
 * 5. Style/mood inspirations
 */
export async function selectReferencesV4(
  input: ReferenceSelectionInputV4
): Promise<SelectedReference[]> {
  const refs: SelectedReference[] = [];
  const {
    direction,
    productImagePaths,
    inspirationPaths,
    additionalImages,
    layoutFamily,
    brandId,
    brandStyleImagePaths,
  } = input;

  // Priority 1: Layout inspiration image
  const layoutRef = await getLayoutInspirationImage(layoutFamily, brandId);
  if (layoutRef) {
    refs.push({
      path: "[layout_inspiration]",
      role: "layout_structure",
      buffer: layoutRef,
    });
  }

  // Priority 2: User-uploaded images (highest priority for product)
  if (additionalImages?.length) {
    for (let i = 0; i < additionalImages.length && refs.length < 4; i++) {
      refs.push({
        path: `[user_upload_${i}]`,
        role: "product_fidelity",
        buffer: additionalImages[i],
      });
    }
  }

  // Priority 3: Product reference images from disk
  if (direction.reference_strategy.use_product_ref && productImagePaths?.length && refs.length < 5) {
    const role = direction.reference_strategy.product_ref_role;
    const preferredIndices = direction.reference_strategy.preferred_ref_indices;
    const pathsToUse = preferredIndices
      ? preferredIndices.map((i) => productImagePaths[i]).filter(Boolean)
      : productImagePaths;

    const remaining = 5 - refs.length;
    for (const imgPath of pathsToUse.slice(0, remaining)) {
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

  // Priority 4: Brand style images
  if (brandStyleImagePaths?.length) {
    for (const imgPath of brandStyleImagePaths.slice(0, 2)) {
      const buffer = loadImage(imgPath);
      if (buffer) {
        refs.push({
          path: imgPath,
          role: "brand_style",
          buffer,
        });
      }
    }
  }

  // Priority 5: Style/mood references from inspirations
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
 * Select references for an entire batch (v4 — Phase 5+).
 * Each concept may have its own layout family.
 */
export async function selectReferencesBatchV4(
  inputs: ReferenceSelectionInputV4[]
): Promise<SelectedReference[][]> {
  const results: SelectedReference[][] = [];
  for (const input of inputs) {
    const refs = await selectReferencesV4(input);
    results.push(refs);
  }
  return results;
}

/**
 * Load brand style images as buffers.
 */
export function loadBrandStyleImages(paths: string[]): Buffer[] {
  const buffers: Buffer[] = [];
  for (const imgPath of paths) {
    const buffer = loadImage(imgPath);
    if (buffer) {
      buffers.push(buffer);
    }
  }
  return buffers;
}
