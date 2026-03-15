const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = "images";

/**
 * Returns the public URL for an image stored in Supabase Storage.
 * Works on both server and client (uses NEXT_PUBLIC_ env var).
 */
export function getPublicImageUrl(relativePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${relativePath}`;
}
