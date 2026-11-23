import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";

const root = process.cwd();
const migrationsDir = path.join(root, "db", "migrations");

export const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
export const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";

export const MIGRATION_FILES = [
  "0001_profiles.sql",
  "0002_catalog.sql",
  "0003_settings_inquiries.sql",
  "0004_rls.sql",
  "0005_storage.sql",
] as const;

/**
 * A real Postgres instance with Supabase's essential shims: the auth and storage
 * schemas and the anon/authenticated/service_role roles. No production code
 * depends on any of these shims; Supabase provides them in the real project.
 */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();

  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;

    -- Supabase's default privileges grant every table privilege to the API
    -- roles. Mirror that so the explicit REVOKEs in the migrations are tested
    -- against production-like grants, not an artificially empty shim.
    alter default privileges in schema public
      grant all on tables to anon, authenticated, service_role;

    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid
      language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    -- Supabase grants this in real projects; the shim must match for RLS
    -- policies that call auth.uid() to evaluate as anon/authenticated.
    grant usage on schema auth to anon, authenticated, service_role;

    create schema storage;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(),
      bucket_id text not null,
      name text not null
    );
  `);

  for (const file of MIGRATION_FILES) {
    const fullPath = path.join(migrationsDir, file);
    if (!existsSync(fullPath)) {
      throw new Error(`Missing migration db/migrations/${file}`);
    }
    await db.exec(readFileSync(fullPath, "utf8"));
  }

  const seedPath = path.join(root, "db", "seed.sql");
  if (!existsSync(seedPath)) {
    throw new Error("Missing db/seed.sql");
  }
  await db.exec(readFileSync(seedPath, "utf8"));

  return db;
}

export async function seedUsers(db: PGlite): Promise<void> {
  await db.query(
    `insert into auth.users (id, email) values ($1, $2), ($3, $4)
     on conflict do nothing`,
    [ADMIN_ID, "admin@districtwear.ma", CUSTOMER_ID, "client@example.com"],
  );
  await db.query(
    `insert into public.profiles (id, email, role) values
       ($1, 'admin@districtwear.ma', 'admin'),
       ($2, 'client@example.com', 'customer')
     on conflict do nothing`,
    [ADMIN_ID, CUSTOMER_ID],
  );
}

export async function setUser(db: PGlite, id: string | null): Promise<void> {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ""]);
}

export async function asRole<T>(
  db: PGlite,
  role: "anon" | "authenticated",
  fn: () => Promise<T>,
): Promise<T> {
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

export async function expectDenied(fn: () => Promise<unknown>): Promise<void> {
  await expect(fn()).rejects.toThrow(/permission denied|row-level security|policy/i);
}
