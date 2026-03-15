import { createClient } from "@supabase/supabase-js";

const BUCKET = "images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function saveImage(
  imageData: Buffer,
  subDir: string,
  fileName: string
): Promise<string> {
  const storagePath = `${subDir}/${fileName}`;
  const ext = fileName.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, imageData, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

export async function readImage(
  relativePath: string
): Promise<Buffer | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(relativePath);

    if (error || !data) return null;

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function deleteImage(relativePath: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([relativePath]);
  } catch {
    // Ignore if file doesn't exist
  }
}

export function getImageUrl(relativePath: string): string {
  // Public URL from Supabase Storage
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(relativePath);
  return data.publicUrl;
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
