import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Locale = "en" | "fr" | "ar";
type Messages = Record<string, Record<string, string>>;

function source(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

function messages(locale: Locale): Messages {
  return JSON.parse(source("messages", `${locale}.json`)) as Messages;
}

describe("cart update and stale notice wiring", () => {
  const panel = source("components", "cart", "cart-panel.tsx");

  it("routes both single and bulk updates through the shared mapper", () => {
    expect(panel).toContain("applyFreshValues(lines, [line])");
    expect(panel).toContain("applyFreshValues(lines, reconciled)");
  });

  it("renders a reason for a stock-only change", () => {
    expect(panel).toContain('t("stockChanged")');
  });

  it("localizes stockChanged in all three locales with Arabic script", () => {
    const values = (["en", "fr", "ar"] as const).map(
      (locale) => messages(locale).cart.stockChanged,
    );

    expect(values.every((value) => typeof value === "string" && value.length > 0)).toBe(true);
    expect(new Set(values).size).toBe(3);
    expect(values[2]).toMatch(/[\u0600-\u06FF]/);
  });
});
