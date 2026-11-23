import { IMAGE_BUCKET } from "./upload";

/** Pure helpers for rendering and reordering product imagery. */

export function imageUrl(
  image: { storage_path: string | null; external_url: string | null },
  supabaseUrl: string,
): string | null {
  if (image.external_url) return image.external_url;
  if (!image.storage_path) return null;
  const path = image.storage_path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}
