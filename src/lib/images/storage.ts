import fs from "fs/promises";
import path from "path";

const IMAGES_DIR = path.resolve("./data/images");

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveImage(
  imageData: Buffer,
  subDir: string,
  fileName: string
): Promise<string> {
  const dir = path.join(IMAGES_DIR, subDir);
  await ensureDir(dir);
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, imageData);
  return path.join(subDir, fileName);
}

export async function readImage(
  relativePath: string
): Promise<Buffer | null> {
  try {
    const fullPath = path.join(IMAGES_DIR, relativePath);
    return await fs.readFile(fullPath);
  } catch {
    return null;
  }
}

export async function deleteImage(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(IMAGES_DIR, relativePath);
    await fs.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}

export function getImageUrl(relativePath: string): string {
  return `/api/images/${encodeURIComponent(relativePath)}`;
}

export function generateFileName(
  generationId: string,
  index: number,
  mimeType: string
): string {
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  return `${generationId}_${index}.${ext}`;
}

export function getSubDir(generationId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `generated/${year}/${month}/${generationId}`;
}
