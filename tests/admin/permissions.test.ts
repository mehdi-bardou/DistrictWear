import { describe, expect, it } from "vitest";
import { isAdminRole, safeNextPath } from "../../lib/admin/permissions";

describe("isAdminRole", () => {
  it("grants access only to the admin profile role", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("customer")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps an internal admin destination with its query string", () => {
    expect(safeNextPath("/admin/products?q=hoodie")).toBe("/admin/products?q=hoodie");
  });

  it("rejects a protocol-relative destination", () => {
    expect(safeNextPath("//evil.example/steal")).toBe("/admin");
  });

  it("rejects an absolute external URL", () => {
    expect(safeNextPath("https://evil.example/steal")).toBe("/admin");
  });

  it("rejects the backslash trick browsers treat as a slash", () => {
    expect(safeNextPath("/\\evil.example/steal")).toBe("/admin");
  });

  it("rejects an encoded slash trick", () => {
    expect(safeNextPath("/%2f%2fevil.example/steal")).toBe("/admin");
  });

  it("rejects the login page to avoid a redirect loop", () => {
    expect(safeNextPath("/admin/login")).toBe("/admin");
  });

  it("falls back for missing, empty and non-path values", () => {
    expect(safeNextPath(null)).toBe("/admin");
    expect(safeNextPath("")).toBe("/admin");
    expect(safeNextPath("products")).toBe("/admin");
  });
});
