# DISTRICT WEAR

Premium streetwear storefront with one-message WhatsApp ordering and a protected admin panel.

> Phases 0 and 1 of 6 are implemented. Full setup instructions arrive in Phase 6.

## Stack

Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Supabase, next-intl, Zustand,
react-hook-form + Zod, shadcn/ui, Framer Motion, Lenis. Deploy target: Netlify free tier.

## Local setup (Phase 0)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000` — the locale proxy redirects to `/fr`. `/ar` is RTL and `/en`
is also available. The language switcher in the navbar preserves the current route and query.

## Database setup (Phase 1)

In your Supabase project's SQL Editor, run these files **in order**:

1. `db/migrations/0001_profiles.sql`
2. `db/migrations/0002_catalog.sql`
3. `db/migrations/0003_settings_inquiries.sql`
4. `db/migrations/0004_rls.sql`
5. `db/migrations/0005_storage.sql`
6. `db/seed.sql`

Then create an admin user in Supabase Auth and grant it the admin role:

```sql
insert into public.profiles (id, email, role)
values ('<auth-user-uuid>', '<admin-email>', 'admin');
```

Put the anon key in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the service-role key in
`SUPABASE_SERVICE_ROLE_KEY` (server-only; never prefix it with `NEXT_PUBLIC_`). The shop's
WhatsApp number is seeded into `public.settings` and can be changed later from the admin panel.

`npm test` applies the migrations and seed to an embedded Postgres and simulates the `anon`,
`authenticated` and admin roles, so no live Supabase project is needed for the test suite.

## Scripts

| Script                 | Purpose                 |
| ---------------------- | ----------------------- |
| `npm run dev`          | Development server      |
| `npm run build`        | Production build        |
| `npm run typecheck`    | Strict TypeScript check |
| `npm run lint`         | ESLint                  |
| `npm run format:check` | Prettier                |
| `npm test`             | Vitest                  |

## Design tokens

All colours are defined once in `app/globals.css` as CSS variables exposed as Tailwind tokens:
`forest-*`, `cream-*`, `ink-*`. Never add a literal hex value in a component.

## Documentation

- Design: `docs/superpowers/specs/2026-11-23-district-wear-design.md`
- Phase plan: `docs/superpowers/plans/2026-11-23-district-wear.md`
- Database: `db/migrations/`, `db/seed.sql`
