import { describe, expect, it } from "vitest";
import { isNavItemActive } from "../../lib/admin/navigation";

describe("isNavItemActive", () => {
  it("matches the dashboard only at the exact admin root", () => {
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
    expect(isNavItemActive("/admin/products", "/admin")).toBe(false);
  });

  it("matches a section and its nested pages", () => {
    expect(isNavItemActive("/admin/products", "/admin/products")).toBe(true);
    expect(isNavItemActive("/admin/products/123", "/admin/products")).toBe(true);
  });

  it("does not match a sibling section with the same prefix", () => {
    expect(isNavItemActive("/admin/products-archive", "/admin/products")).toBe(false);
  });
});
