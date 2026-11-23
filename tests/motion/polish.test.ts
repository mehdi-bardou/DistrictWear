import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

const root = fileURLToPath(new URL("../..", import.meta.url));

function source(relativePath: string): string {
  const fullPath = path.join(root, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

type Messages = Record<string, Record<string, string>>;

const locales = [
  { code: "fr", messages: fr as unknown as Messages },
  { code: "ar", messages: ar as unknown as Messages },
  { code: "en", messages: en as unknown as Messages },
] as const;

const existingNamespaces = [
  "about",
  "cart",
  "collections",
  "common",
  "contact",
  "footer",
  "home",
  "language",
  "meta",
  "nav",
  "product",
  "shop",
  "whatsapp",
];

describe("notFound translations", () => {
  it("adds exactly the five required keys to every locale", () => {
    for (const { messages } of locales) {
      expect(Object.keys(messages.notFound ?? {}).sort()).toEqual([
        "copy",
        "home",
        "label",
        "shop",
        "title",
      ]);
      for (const value of Object.values(messages.notFound ?? {})) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("adds only the notFound namespace", () => {
    for (const { messages } of locales) {
      expect(Object.keys(messages).sort()).toEqual([...existingNamespaces, "notFound"].sort());
    }
  });

  it("writes the Arabic copy in Arabic script", () => {
    const arabic = locales.find(({ code }) => code === "ar")?.messages.notFound ?? {};
    expect(Object.keys(arabic).length).toBeGreaterThan(0);
    for (const value of Object.values(arabic)) {
      expect(value).toMatch(/[\u0600-\u06FF]/);
    }
  });
});

describe("PageTransition", () => {
  const code = source("components/motion/page-transition.tsx");

  it("keys a motion.div and animates only opacity and transform", () => {
    expect(code).toContain("<motion.div");
    expect(code).toMatch(/key=\{transitionKey\}/);
    expect(code).toContain("${locale}:${pathname}");
    expect(code).toContain("initial={{ opacity: 0, y: 8 }}");
    expect(code).toContain("animate={{ opacity: 1, y: 0 }}");
    expect(code).toContain("duration: 0.28");
    expect(code).toContain('ease: "easeOut"');
    expect(code).not.toContain("AnimatePresence");
  });

  it("keeps the element type stable and zeroes reduced-motion duration", () => {
    expect(code).toContain("useReducedMotion()");
    expect(code).toContain("duration: 0");
    expect(code).not.toContain("<div");
    expect(code).not.toContain("layout");
    expect(code).toContain("usePathname()");
    expect(code).toContain("useLocale()");
  });
});

describe("Reveal", () => {
  const code = source("components/motion/reveal.tsx");

  it("reveals with opacity and transform only", () => {
    expect(code).toContain("<motion.div");
    expect(code).toContain("initial={{ opacity: 0, y: 18 }}");
    expect(code).toContain("whileInView={{ opacity: 1, y: 0 }}");
    expect(code).toContain("viewport={{ once: true, amount: 0.15 }}");
    expect(code).toContain("delay");
    expect(code).toContain("duration: 0.45");
    expect(code).not.toContain("height:");
    expect(code).not.toContain("background");
  });

  it("keeps the element type stable and zeroes reduced-motion duration", () => {
    expect(code).toContain("useReducedMotion()");
    expect(code).toContain("duration: 0");
    expect(code).not.toContain("<div");
    expect(code).not.toContain("dir=");
  });
});

describe("locale-aware 404", () => {
  const code = source("app/[locale]/not-found.tsx");

  it("resolves the locale through getLocale with an fr fallback and no params", () => {
    expect(code).toContain("getLocale()");
    expect(code).toContain("setRequestLocale(locale)");
    expect(code).toContain('namespace: "notFound"');
    expect(code).toContain("hasLocale(routing.locales");
    expect(code).toContain('"fr"');
    expect(code).not.toContain("params");
  });

  it("renders editorial 404 links without a competing root not-found", () => {
    expect(code).toContain('href="/"');
    expect(code).toContain('href="/shop"');
    expect(code).toContain('"shell');
    expect(code).toContain('"display-xl');
    expect(code).toContain('"rule');
    expect(existsSync(path.join(root, "app", "not-found.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "app", "layout.tsx"))).toBe(false);
  });

  it("routes unknown locale paths through notFound()", () => {
    expect(source("app/[locale]/[...rest]/page.tsx")).toContain("notFound()");
  });
});

describe("motion wiring", () => {
  it("wraps only the layout children with PageTransition", () => {
    const layout = source("app/[locale]/layout.tsx");
    expect(layout).toContain('from "@/components/motion/page-transition"');
    expect(layout).toContain("<PageTransition>{children}</PageTransition>");
  });

  it("reveals the requested headings in each page", () => {
    const pages: Array<[string, number]> = [
      ["app/[locale]/page.tsx", 4],
      ["app/[locale]/collections/page.tsx", 1],
      ["app/[locale]/collections/[slug]/page.tsx", 1],
      ["app/[locale]/about/page.tsx", 3],
    ];
    for (const [file, minimum] of pages) {
      const count = source(file).match(/<Reveal\b/g)?.length ?? 0;
      expect(count, file).toBeGreaterThanOrEqual(minimum);
    }
  });
});
