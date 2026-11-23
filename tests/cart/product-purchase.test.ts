import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

describe("product add-to-cart boundary", () => {
  const page = source("app", "[locale]", "product", "[slug]", "page.tsx");
  const wrapper = source("components", "cart", "product-purchase.tsx");

  it("does not pass a function prop from the server product page", () => {
    expect(page).toContain("ProductPurchase");
    expect(page).not.toContain("renderAction");
  });

  it("creates the renderAction closure inside a client wrapper", () => {
    expect(wrapper.startsWith('"use client";')).toBe(true);
    expect(wrapper).toContain("VariantPicker");
    expect(wrapper).toContain("AddToCartButton");
    expect(wrapper).toContain("renderAction");
  });
});
