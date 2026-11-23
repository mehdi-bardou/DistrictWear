/** Image upload safety rules mirroring the `product-images` Storage bucket. */

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

export function imageExtension(mimeType: string): string | null {
  return EXTENSIONS[mimeType] ?? null;
}

export function isAllowedImage(file: { type: string; size: number }): boolean {
  return imageExtension(file.type) !== null && file.size > 0 && file.size <= MAX_IMAGE_BYTES;
}

/** Product-scoped path with no user-controlled directories or special characters. */
export function sanitizeImagePath(
  productId: string,
  filename: string,
  unique: string,
  extension: string,
): string {
  const basename = filename.split(/[/\\]/).pop() ?? "";
  const stem = basename
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${productId}/${stem || "image"}-${unique}.${extension}`;
}
