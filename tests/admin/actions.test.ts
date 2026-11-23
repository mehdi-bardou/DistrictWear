import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("../../lib/admin/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("../../lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  deleteCategory,
  deleteCollection,
  deleteImage,
  deleteProduct,
  deleteVariant,
  reorderImages,
  saveCategory,
  saveCollection,
  saveImage,
  saveProduct,
  saveSettings,
  saveVariant,
  setProductFlag,
  setVariantStock,
} from "../../app/admin/actions";
import { uploadProductImage } from "../../app/admin/upload/actions";

interface QueryResult {
  error: { message: string } | null;
}

function queryBuilder(result: QueryResult = { error: null }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["eq", "select", "order", "single"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function fakeSupabase() {
  const calls = {
    insert: vi.fn(() => queryBuilder()),
    update: vi.fn(() => queryBuilder()),
    delete: vi.fn(() => queryBuilder()),
  };
  const from = vi.fn((table: string) => ({ ...calls, table }));
  return { from, calls };
}

const category = {
  slug: "sweats",
  name_fr: "Sweats",
  name_ar: "الكنزات",
  name_en: "Hoodies",
  sort_order: 0,
  is_active: true,
};

const product = {
  slug: "sweat-creme",
  name_fr: "Sweat Crème",
  name_ar: "كنزة كريمية",
  name_en: "Cream Hoodie",
  description_fr: null,
  description_ar: null,
  description_en: null,
  category_id: null,
  collection_id: null,
  is_published: false,
  is_featured: false,
  sort_order: 2,
};

const collection = {
  slug: "hiver-2026",
  name_fr: "Hiver 2026",
  name_ar: "شتاء 2026",
  name_en: "Winter 2026",
  description_fr: null,
  description_ar: null,
  description_en: null,
  cover_image: null,
  is_published: false,
  sort_order: 1,
};

const variant = {
  sku: "DW-SC-CRM-M",
  color: "Crème",
  color_en: null,
  color_ar: null,
  size: "M" as const,
  price: 890,
  stock: 12,
  is_active: true,
  sort_order: 0,
};

const image = {
  storage_path: "prod-1/1.webp",
  external_url: null,
  alt_fr: null,
  alt_ar: null,
  alt_en: null,
  sort_order: 0,
};

const settings = {
  whatsapp_number: "212721919977",
  contact_email: null,
  instagram_url: null,
  inquiry_logging_enabled: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1", email: "owner@example.com" });
  const db = fakeSupabase();
  mocks.createClient.mockResolvedValue(db);
  return db;
});

describe("admin action authorization", () => {
  const uploadData = () => {
    const formData = new FormData();
    formData.set("file", new File(["fake"], "photo.webp", { type: "image/webp" }));
    return formData;
  };

  const guardedActions = [
    ["saveCategory", () => saveCategory(category)],
    ["saveCollection", () => saveCollection(collection)],
    ["saveProduct", () => saveProduct(product)],
    ["saveVariant", () => saveVariant("prod-1", variant)],
    ["saveImage", () => saveImage("prod-1", image)],
    ["saveSettings", () => saveSettings(settings)],
    ["setProductFlag", () => setProductFlag("prod-1", "is_published", true)],
    ["setVariantStock", () => setVariantStock("var-1", 3)],
    ["reorderImages", () => reorderImages(["img-1"])],
    ["deleteCategory", () => deleteCategory("cat-1")],
    ["deleteCollection", () => deleteCollection("col-1")],
    ["deleteProduct", () => deleteProduct("prod-1")],
    ["deleteVariant", () => deleteVariant("var-1")],
    ["deleteImage", () => deleteImage("img-1")],
    ["uploadProductImage", () => uploadProductImage("prod-1", uploadData())],
  ] as const;

  it.each(guardedActions)(
    "%s rejects an unauthenticated caller before touching storage or the database",
    async (_name, run) => {
      mocks.requireAdmin.mockRejectedValue(new Error("AUTH_REDIRECT"));

      await expect(run()).rejects.toThrow("AUTH_REDIRECT");
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );
});

describe("saveCategory", () => {
  it("returns a validation error without writing when the slug is invalid", async () => {
    const result = await saveCategory({ ...category, slug: "Bad Slug" });
    expect(result.ok).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("inserts the mapped row and revalidates the category list", async () => {
    const result = await saveCategory(category);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(result).toEqual({ ok: true });
    expect(db.from).toHaveBeenCalledWith("categories");
    expect(db.calls.insert).toHaveBeenCalledWith(category);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/categories");
  });

  it("updates by id instead of inserting when editing", async () => {
    await saveCategory(category, "cat-1");
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.calls.insert).not.toHaveBeenCalled();
    expect(db.calls.update).toHaveBeenCalledWith(category);
    expect(db.calls.update.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", "cat-1");
  });
});

describe("saveProduct", () => {
  it("inserts a draft product with null optional relations", async () => {
    await saveProduct(product);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("products");
    expect(db.calls.insert).toHaveBeenCalledWith({
      ...product,
      category_id: null,
      collection_id: null,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products", "layout");
  });
});

describe("setProductFlag", () => {
  it("writes only whitelisted publication fields", async () => {
    await setProductFlag("prod-1", "is_published", true);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.calls.update).toHaveBeenCalledWith({ is_published: true });
    expect(db.calls.update.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", "prod-1");
  });

  it("refuses an arbitrary column name", async () => {
    const result = await setProductFlag("prod-1", "price", true);
    expect(result.ok).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("setVariantStock", () => {
  it("clamps stock to a non-negative integer", async () => {
    await setVariantStock("var-1", 7);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.calls.update).toHaveBeenCalledWith({ stock: 7 });
  });

  it("rejects negative stock", async () => {
    const result = await setVariantStock("var-1", -2);
    expect(result.ok).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("reorderImages", () => {
  it("assigns zero-based sort orders in the given sequence", async () => {
    await reorderImages(["img-a", "img-b", "img-c"]);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("product_images");
    expect(db.calls.update.mock.calls.map((call: unknown[]) => call[0])).toEqual([
      { sort_order: 0 },
      { sort_order: 1 },
      { sort_order: 2 },
    ]);
  });
});

describe("deleteCollection", () => {
  it("deletes only the requested id", async () => {
    await deleteCollection("col-1");
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("collections");
    expect(db.calls.delete).toHaveBeenCalledOnce();
    expect(db.calls.delete.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", "col-1");
  });
});

describe("saveCollection", () => {
  it("inserts a draft collection and revalidates the list", async () => {
    const input = {
      slug: "hiver-2026",
      name_fr: "Hiver 2026",
      name_ar: "شتاء 2026",
      name_en: "Winter 2026",
      description_fr: null,
      description_ar: null,
      description_en: null,
      cover_image: null,
      is_published: false,
      sort_order: 1,
    };
    await saveCollection(input);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("collections");
    expect(db.calls.insert).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/collections");
  });
});

describe("variants and images", () => {
  it("inserts a variant with its parent product id", async () => {
    const input = {
      sku: "DW-SC-CRM-M",
      color: "Crème",
      color_en: "Cream",
      color_ar: null,
      size: "M" as const,
      price: 890,
      stock: 12,
      is_active: true,
      sort_order: 0,
    };
    await saveVariant("prod-1", input);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("product_variants");
    expect(db.calls.insert).toHaveBeenCalledWith({ ...input, product_id: "prod-1" });
  });

  it("inserts an image with its parent product id", async () => {
    const input = {
      storage_path: "products/prod-1/1.webp",
      external_url: null,
      alt_fr: "Dos",
      alt_ar: null,
      alt_en: "Back",
      sort_order: 0,
    };
    await saveImage("prod-1", input);
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("product_images");
    expect(db.calls.insert).toHaveBeenCalledWith({ ...input, product_id: "prod-1" });
  });

  it("deletes a single variant and a single image", async () => {
    await deleteVariant("var-1");
    await deleteImage("img-1");
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.calls.delete).toHaveBeenCalledTimes(2);
    expect(db.calls.delete.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", "var-1");
    expect(db.calls.delete.mock.results[1]?.value.eq).toHaveBeenCalledWith("id", "img-1");
  });
});

describe("catalogue deletion", () => {
  it("deletes the requested category and product", async () => {
    await deleteCategory("cat-1");
    await deleteProduct("prod-1");
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.calls.delete).toHaveBeenCalledTimes(2);
    expect(db.calls.delete.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", "cat-1");
    expect(db.calls.delete.mock.results[1]?.value.eq).toHaveBeenCalledWith("id", "prod-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/products", "layout");
  });
});

describe("saveSettings", () => {
  it("normalizes the WhatsApp number to digits before saving", async () => {
    await saveSettings({
      whatsapp_number: "+212 721-919-977",
      contact_email: null,
      instagram_url: null,
      inquiry_logging_enabled: false,
    });
    const db = await mocks.createClient.mock.results[0]?.value;
    expect(db.from).toHaveBeenCalledWith("settings");
    expect(db.calls.update).toHaveBeenCalledWith({
      whatsapp_number: "212721919977",
      contact_email: null,
      instagram_url: null,
      inquiry_logging_enabled: false,
    });
    expect(db.calls.update.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", true);
  });
});
