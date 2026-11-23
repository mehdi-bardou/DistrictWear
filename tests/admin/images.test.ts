import { describe, expect, it } from "vitest";
import { imageUrl, moveItem } from "../../lib/admin/images";

const baseUrl = "https://example.supabase.co";

describe("imageUrl", () => {
  it("returns a storage object's public URL and encodes each path segment", () => {
    expect(imageUrl({ storage_path: "prod-1/photo dos.webp", external_url: null }, baseUrl)).toBe(
      `${baseUrl}/storage/v1/object/public/product-images/prod-1/photo%20dos.webp`,
    );
  });

  it("prefers an external URL when present", () => {
    expect(
      imageUrl(
        {
          storage_path: "prod-1/old.webp",
          external_url: "https://images.example.com/new.webp",
        },
        baseUrl,
      ),
    ).toBe("https://images.example.com/new.webp");
  });

  it("returns null when the image has no source", () => {
    expect(imageUrl({ storage_path: null, external_url: null }, baseUrl)).toBeNull();
  });
});

describe("moveItem", () => {
  const items = ["a", "b", "c", "d"];

  it("moves an item toward the end without mutating the input", () => {
    expect(moveItem(items, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });

  it("moves an item toward the start", () => {
    expect(moveItem(items, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns the same order for an out-of-range move", () => {
    expect(moveItem(items, 0, 9)).toEqual(items);
  });
});
