import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ADMIN_ID, asRole, createTestDb, expectDenied, seedUsers, setUser } from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await seedUsers(db);
});

afterAll(async () => {
  await db?.close();
});

describe("product image storage", () => {
  it("creates a public product-images bucket with a size and MIME allowlist", async () => {
    const result = await db.query<{
      id: string;
      public: boolean;
      file_size_limit: string;
      allowed_mime_types: string[];
    }>(`select id, public, file_size_limit, allowed_mime_types
         from storage.buckets where id = 'product-images'`);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].public).toBe(true);
    expect(Number(result.rows[0].file_size_limit)).toBe(5 * 1024 * 1024);
    expect(result.rows[0].allowed_mime_types).toEqual(
      expect.arrayContaining(["image/webp", "image/jpeg", "image/png", "image/avif"]),
    );
  });

  it("lets anon read objects but only an admin upload or delete them", async () => {
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('product-images', 'public.webp')`,
    );
    const anonRead = await asRole(db, "anon", () =>
      db.query<{ name: string }>(
        "select name from storage.objects where bucket_id = 'product-images'",
      ),
    );
    expect(anonRead.rows.map((row) => row.name)).toContain("public.webp");

    await expectDenied(() =>
      asRole(db, "anon", () =>
        db.query(
          `insert into storage.objects (bucket_id, name) values ('product-images', 'anon.webp')`,
        ),
      ),
    );

    await setUser(db, ADMIN_ID);
    await asRole(db, "authenticated", async () => {
      await db.query(
        `insert into storage.objects (bucket_id, name) values ('product-images', 'admin.webp')`,
      );
      await db.query(`delete from storage.objects where name = 'admin.webp'`);
    });
    await setUser(db, null);
  });
});
