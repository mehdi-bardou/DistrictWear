import { describe, expect, it } from "vitest";
import { loginSchema } from "../../lib/admin/schemas";

describe("loginSchema", () => {
  it("accepts a well-formed email and a non-empty password", () => {
    expect(
      loginSchema.safeParse({ email: "owner@example.com", password: "secret123" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret123" }).success).toBe(
      false,
    );
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "owner@example.com", password: "" }).success).toBe(false);
  });
});
