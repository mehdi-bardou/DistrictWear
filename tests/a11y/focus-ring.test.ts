import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));

function source(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const cardLinks = [
  "app/[locale]/collections/page.tsx",
  "components/storefront/product-card.tsx",
] as const;

describe("storefront card keyboard focus", () => {
  for (const file of cardLinks) {
    it(`${file} leaves the card link eligible for the global focus ring`, () => {
      const code = source(file);
      expect(code).not.toContain("focus-visible:outline-none");
      expect(code).toContain('className="group block"');
    });
  }

  it("keeps the token-based :focus-visible ring in the global base layer", () => {
    const css = source("app/globals.css");
    expect(css).toMatch(/@layer base\s*\{/);
    expect(css).toContain(":focus-visible {");
    expect(css).toContain("outline: 2px solid var(--color-forest-700)");
    expect(css).toContain("outline-offset: 3px");
  });
});
