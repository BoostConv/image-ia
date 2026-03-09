import sharp from "sharp";
import { AD_DIMENSIONS } from "../ai/ad-types";

// ============================================================
// POST-PROCESSING — Sharp-based image enhancement
// Applied after each render pass, BEFORE composition.
// Resize to target ad dimensions + sharpen + saturate.
// ============================================================

export interface PostProcessOptions {
  aspectRatio: string;
  sharpen?: boolean;
  saturate?: boolean;
  resizeToTarget?: boolean;
}

const DEFAULT_OPTIONS: Required<PostProcessOptions> = {
  aspectRatio: "1:1",
  sharpen: true,
  saturate: true,
  resizeToTarget: true,
};

/**
 * Post-process an image buffer from the API.
 * 1. Resize to target ad dimensions (if size differs)
 * 2. Sharpen lightly (sigma 0.8)
 * 3. Boost saturation +8%
 * 4. Output high-quality PNG
 */
export async function postProcess(
  imageBuffer: Buffer,
  opts: PostProcessOptions
): Promise<Buffer> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const target = AD_DIMENSIONS[options.aspectRatio] || AD_DIMENSIONS["1:1"];

  let pipeline = sharp(imageBuffer);

  // 1. Resize to target dimensions if needed
  if (options.resizeToTarget) {
    const metadata = await sharp(imageBuffer).metadata();
    const needsResize =
      metadata.width !== target.width || metadata.height !== target.height;

    if (needsResize) {
      pipeline = pipeline.resize(target.width, target.height, {
        fit: "cover",
        position: "center",
      });
    }
  }

  // 2. Light sharpen — enhances detail without artifacts
  if (options.sharpen) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.3 });
  }

  // 3. Subtle saturation boost — makes colors pop
  if (options.saturate) {
    pipeline = pipeline.modulate({ saturation: 1.08 });
  }

  // 4. Output as high-quality PNG
  return pipeline.png({ quality: 100, compressionLevel: 6 }).toBuffer();
}
