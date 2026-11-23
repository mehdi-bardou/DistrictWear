import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("../../lib/admin/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("../../lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { uploadProductImage } from "../../app/admin/upload/actions";
import { imageExtension, isAllowedImage, sanitizeImagePath } from "../../lib/admin/upload";

describe("imageExtension", () => {
  it("maps allowed MIME types to file extensions", () => {
    expect(imageExtension("image/webp")).toBe("webp");
    expect(imageExtension("image/jpeg")).toBe("jpg");
    expect(imageExtension("image/png")).toBe("png");
    expect(imageExtension("image/avif")).toBe("avif");
  });

  it("rejects an unsupported type", () => {
    expect(imageExtension("image/gif")).toBeNull();
  });
});

describe("sanitizeImagePath", () => {
  it("builds a product-scoped path from a cleaned filename", () => {
    expect(sanitizeImagePath("prod-1", "Photo Dos (1).PNG", "abc123", "png")).toBe(
      "prod-1/photo-dos-1-abc123.png",
    );
  });

  it("strips directory traversal segments", () => {
    expect(sanitizeImagePath("prod-1", "../../secret.webp", "abc123", "webp")).toBe(
      "prod-1/secret-abc123.webp",
    );
  });

  it("falls back when the filename has no usable characters", () => {
    expect(sanitizeImagePath("prod-1", "....webp", "abc123", "webp")).toBe(
      "prod-1/image-abc123.webp",
    );
  });
});

describe("isAllowedImage", () => {
  it("accepts an allowed type under the bucket size limit", () => {
    expect(isAllowedImage({ type: "image/webp", size: 1024 })).toBe(true);
  });

  it("rejects an oversized file", () => {
    expect(isAllowedImage({ type: "image/webp", size: 6 * 1024 * 1024 })).toBe(false);
  });

  it("rejects an unsupported type", () => {
    expect(isAllowedImage({ type: "application/pdf", size: 1024 })).toBe(false);
  });
});

describe("uploadProductImage", () => {
  const upload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1", email: "owner@example.com" });
    upload.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ storage: { from: vi.fn(() => ({ upload })) } });
  });

  it("uploads a sanitized path with the original content type", async () => {
    const file = new File(["fake"], "Photo Principal.webp", { type: "image/webp" });
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadProductImage("prod-1", formData);

    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^prod-1\/photo-principal-[a-z0-9-]+\.webp$/),
      file,
      { contentType: "image/webp", upsert: false },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products/prod-1");
  });

  it("rejects a file with an unsupported MIME type before uploading", async () => {
    const formData = new FormData();
    formData.set("file", new File(["fake"], "evil.gif", { type: "image/gif" }));

    const result = await uploadProductImage("prod-1", formData);

    expect(result.ok).toBe(false);
    expect(upload).not.toHaveBeenCalled();
  });
});
