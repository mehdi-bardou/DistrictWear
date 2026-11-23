import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const root = process.cwd();

function sourceFiles(dir: string): string[] {
  const full = path.join(root, dir);
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" || entry.name === ".next" ? [] : sourceFiles(relative);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [relative] : [];
  });
}

type Tables = Database["public"]["Tables"];

describe("typed Supabase clients", () => {
  it("declares every Phase 1 table in the Database type", () => {
    const tables: (keyof Tables)[] = [
      "categories",
      "collections",
      "inquiries",
      "inquiry_attempts",
      "product_images",
      "product_variants",
      "products",
      "profiles",
      "settings",
    ];
    expect(new Set(tables).size).toBe(9);
  });

  it("mentions the service-role key in exactly one server-only module", () => {
    const files = [...sourceFiles("app"), ...sourceFiles("components"), ...sourceFiles("lib")];
    const matches = files.filter((file) =>
      readFileSync(path.join(root, file), "utf8").includes("SUPABASE_SERVICE_ROLE_KEY"),
    );
    expect(matches).toEqual([path.join("lib", "supabase", "admin.ts")]);
  });

  it("keeps the browser and server clients on the anon key", () => {
    for (const file of ["lib/supabase/client.ts", "lib/supabase/server.ts"]) {
      const source = readFileSync(path.join(root, file), "utf8");
      expect(source).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      expect(source).not.toContain("SERVICE_ROLE");
    }
  });
});
