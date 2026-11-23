import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ADMIN_ID,
  CUSTOMER_ID,
  asRole,
  createTestDb,
  expectDenied,
  seedUsers,
  setUser,
} from "./harness";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await seedUsers(db);
});

afterAll(async () => {
  await db?.close();
});

describe("public schema RLS", () => {
  it("strips Supabase default table privileges back to the minimum", async () => {
    const result = await db.query<{
      role: string;
      table_name: string;
      privilege: string;
      allowed: boolean;
    }>(`
      select r.rolname as role, c.relname as table_name, p.privilege,
             has_table_privilege(r.rolname, c.oid, p.privilege) as allowed
      from pg_roles r
      cross join pg_class c
      cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) as p(privilege)
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and r.rolname in ('anon', 'authenticated')
    `);
    const allowed = new Set(
      result.rows
        .filter((row) => row.allowed)
        .map((row) => `${row.role}.${row.table_name}.${row.privilege}`),
    );

    const anonReadable = [
      "categories",
      "collections",
      "product_images",
      "product_variants",
      "products",
      "settings",
    ];
    const adminWritable = [
      "categories",
      "collections",
      "product_images",
      "product_variants",
      "products",
      "profiles",
      "inquiries",
      "settings",
    ];

    for (const table of anonReadable) {
      expect(allowed.has(`anon.${table}.SELECT`), `anon SELECT ${table}`).toBe(true);
    }
    for (const table of ["inquiries", "inquiry_attempts", "profiles"]) {
      expect(allowed.has(`anon.${table}.SELECT`), `anon SELECT ${table}`).toBe(false);
    }
    const allTables = new Set(result.rows.map((row) => row.table_name));
    for (const table of allTables) {
      for (const privilege of ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        expect(allowed.has(`anon.${table}.${privilege}`), `anon ${privilege} ${table}`).toBe(false);
      }
      for (const privilege of ["TRUNCATE", "REFERENCES", "TRIGGER"]) {
        expect(
          allowed.has(`authenticated.${table}.${privilege}`),
          `authenticated ${privilege} ${table}`,
        ).toBe(false);
      }
    }
    for (const table of adminWritable) {
      for (const privilege of ["INSERT", "UPDATE", "DELETE"]) {
        expect(
          allowed.has(`authenticated.${table}.${privilege}`),
          `authenticated ${privilege} ${table}`,
        ).toBe(true);
      }
    }
    for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      expect(allowed.has(`authenticated.inquiry_attempts.${privilege}`), privilege).toBe(false);
    }
  });

  it("enables row level security on every public table", async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>(`
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `);
    expect(result.rows.length).toBeGreaterThanOrEqual(8);
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
    expect(result.rows.map((row) => row.relname)).toEqual(
      expect.arrayContaining([
        "categories",
        "collections",
        "inquiries",
        "inquiry_attempts",
        "product_images",
        "product_variants",
        "products",
        "profiles",
        "settings",
      ]),
    );
  });

  it("lets anon read published products but never drafts", async () => {
    const anon = await asRole(db, "anon", () =>
      db.query<{ id: string }>("select id from public.products"),
    );
    expect(anon.rows).toHaveLength(12);

    await db.query(`
      insert into public.products (slug, name_fr, name_ar, name_en, is_published)
      values ('rls-draft', 'Brouillon', 'مسودة', 'Draft', false)
    `);
    const afterDraft = await asRole(db, "anon", () =>
      db.query<{ id: string }>("select id from public.products"),
    );
    expect(afterDraft.rows).toHaveLength(12);
  });

  it("denies anon catalogue writes", async () => {
    await expectDenied(() =>
      asRole(db, "anon", () =>
        db.query(`insert into public.products (slug, name_fr, name_ar, name_en)
                  values ('rls-anon-insert', 'X', 'X', 'X')`),
      ),
    );
    await expectDenied(() =>
      asRole(db, "anon", () => db.query(`update public.products set name_fr = 'X'`)),
    );
    await expectDenied(() => asRole(db, "anon", () => db.query(`delete from public.products`)));
  });

  it("hides inactive categories, unpublished collections and drafts' media", async () => {
    await db.exec(`
      insert into public.categories (slug, name_fr, name_ar, name_en, is_active)
      values ('rls-inactive', 'Inactive', 'غير نشط', 'Inactive', false);
      insert into public.collections (slug, name_fr, name_ar, name_en, is_published)
      values ('rls-hidden', 'Hidden', 'مخفي', 'Hidden', false);
    `);
    const draftId = (
      await db.query<{ id: string }>("select id from public.products where slug = 'rls-draft'")
    ).rows[0].id;
    await db.query(
      `insert into public.product_variants (product_id, sku, color, size, price)
       values ($1, 'RLS-DRAFT', 'Noir', 'M', 100)`,
      [draftId],
    );
    await db.query(
      `insert into public.product_images (product_id, external_url)
       values ($1, 'https://images.unsplash.com/photo-rls-draft')`,
      [draftId],
    );

    const visible = await asRole(db, "anon", async () => ({
      categories: await db.query<{ slug: string }>("select slug from public.categories"),
      collections: await db.query<{ slug: string }>("select slug from public.collections"),
      variants: await db.query<{ sku: string }>("select sku from public.product_variants"),
      images: await db.query<{ id: string }>("select id from public.product_images"),
    }));

    expect(visible.categories.rows.map((r) => r.slug)).not.toContain("rls-inactive");
    expect(visible.collections.rows.map((r) => r.slug)).not.toContain("rls-hidden");
    expect(visible.variants.rows.map((r) => r.sku)).not.toContain("RLS-DRAFT");
    const hiddenImage = (
      await db.query<{ id: string }>(
        `select id from public.product_images where external_url = 'https://images.unsplash.com/photo-rls-draft'`,
      )
    ).rows[0].id;
    expect(visible.images.rows.map((r) => r.id)).not.toContain(hiddenImage);
  });

  it("never exposes profiles or inquiries to anon or non-admin users", async () => {
    await db.query(
      `insert into public.inquiries (reference, locale, message)
       values ('RLS-TEST-1', 'fr', 'Test')`,
    );

    await setUser(db, CUSTOMER_ID);
    const customerRows = await asRole(db, "authenticated", async () => ({
      profiles: await db.query("select * from public.profiles"),
      inquiries: await db.query("select * from public.inquiries"),
    }));
    expect(customerRows.profiles.rows).toHaveLength(1);
    expect(customerRows.inquiries.rows).toHaveLength(0);

    await expectDenied(() => asRole(db, "anon", () => db.query("select * from public.profiles")));
    await expectDenied(() => asRole(db, "anon", () => db.query("select * from public.inquiries")));

    await setUser(db, ADMIN_ID);
    const adminInquiries = await asRole(db, "authenticated", () =>
      db.query("select * from public.inquiries"),
    );
    expect(adminInquiries.rows.length).toBeGreaterThan(0);
    await setUser(db, null);
  });

  it("exposes is_admin only to a profile with the admin role", async () => {
    const read = async () =>
      (await db.query<{ ok: boolean }>("select public.is_admin() as ok")).rows[0].ok;
    await setUser(db, null);
    expect(await read()).toBe(false);
    await setUser(db, CUSTOMER_ID);
    expect(await read()).toBe(false);
    await setUser(db, ADMIN_ID);
    expect(await read()).toBe(true);
    await setUser(db, null);
  });

  it("lets an authenticated admin write catalogue but not a normal customer", async () => {
    await setUser(db, CUSTOMER_ID);
    await expectDenied(() =>
      asRole(db, "authenticated", () =>
        db.query(`insert into public.products (slug, name_fr, name_ar, name_en)
                  values ('rls-customer-insert', 'X', 'X', 'X')`),
      ),
    );

    await setUser(db, ADMIN_ID);
    await asRole(db, "authenticated", async () => {
      await db.query(`
        insert into public.products (slug, name_fr, name_ar, name_en, is_published)
        values ('rls-admin-insert', 'Admin', 'أدمن', 'Admin', true)
      `);
      await db.query(
        `update public.products set name_fr = 'Admin edit' where slug = 'rls-admin-insert'`,
      );
      await db.query(`delete from public.products where slug = 'rls-admin-insert'`);
    });
    await setUser(db, null);
  });

  it("keeps the settings singleton public for reading and admin-only for writing", async () => {
    const anon = await asRole(db, "anon", () => db.query("select * from public.settings"));
    expect(anon.rows).toHaveLength(1);
    await expectDenied(() =>
      asRole(db, "anon", () => db.query(`update public.settings set whatsapp_number = '000'`)),
    );
    await setUser(db, ADMIN_ID);
    await asRole(db, "authenticated", () =>
      db.query(`update public.settings set contact_email = 'owner@districtwear.ma'`),
    );
    await setUser(db, null);
    const updated = await db.query<{ contact_email: string }>(
      "select contact_email from public.settings",
    );
    expect(updated.rows[0].contact_email).toBe("owner@districtwear.ma");
  });
});
