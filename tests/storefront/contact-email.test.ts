import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validContactEmail } from "../../lib/storefront/contact";

const root = fileURLToPath(new URL("../..", import.meta.url));

describe("validContactEmail", () => {
  it("accepts a normal contact address", () => {
    expect(validContactEmail("contact@districtwear.ma")).toBe("contact@districtwear.ma");
  });

  it("rejects an address without a dotted domain", () => {
    expect(validContactEmail("contact@localhost")).toBeNull();
  });

  it("rejects whitespace, extra @ and header injection", () => {
    expect(validContactEmail("a b@example.com")).toBeNull();
    expect(validContactEmail("a@@example.com")).toBeNull();
    expect(validContactEmail("a@example.com\r\nBcc: evil@example.com")).toBeNull();
  });

  it("rejects an address longer than 254 characters", () => {
    const long = `${"a".repeat(250)}@example.com`;
    expect(long.length).toBeGreaterThan(254);
    expect(validContactEmail(long)).toBeNull();
  });

  it("rejects null and empty values", () => {
    expect(validContactEmail(null)).toBeNull();
    expect(validContactEmail("")).toBeNull();
  });
});

describe("contact page mailto row", () => {
  const code = readFileSync(path.join(root, "app/[locale]/contact/page.tsx"), "utf8");

  it("renders the mailto link only from the validated address", () => {
    expect(code).toContain("const email = validContactEmail(settings.contactEmail)");
    expect(code).toContain("Boolean(email || instagramUrl || whatsapp)");
    expect(code).toContain("{email && (");
    expect(code).toContain("href={`mailto:${email}`}");
    expect(code).not.toContain("href={`mailto:${settings.contactEmail}`}");
  });
});
