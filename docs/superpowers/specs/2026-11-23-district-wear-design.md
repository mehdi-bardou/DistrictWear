# DISTRICT WEAR — Design

**Date:** 2026-11-23
**Status:** Approved by the client's brief; implementation proceeds phase by phase.

## Intent

Build a production-grade clothing e-commerce site for a real client. The storefront is a
browse-and-inquire experience: no accounts, no online payment, no checkout. A customer fills a
cart and sends it as one pre-filled WhatsApp message; payment and fulfilment are arranged in
person. A separate admin panel lets the shop owner manage catalogue, stock, categories and
store settings.

## Goals

- Premium editorial storefront with Awwwards-level polish, mobile-first and accessible.
- French (default), Arabic (RTL) and English with route-preserving switching.
- One compact WhatsApp message per cart, always using French product/colour names.
- Tight Supabase RLS: anon read-only on public data; admin writes gated by a DB role check.
- Deploy on Netlify free tier with no paid services.

## Non-goals

- Customer accounts, online payments, checkout, shipping calculations, coupons.
- WebGL, video backgrounds, heavy animation libraries beyond Framer Motion + Lenis.
- Any public write endpoint other than the feature-flagged inquiry logger.

## Anti-goals

- Silent cart mutation: stale prices/stock must be surfaced, never applied invisibly.
- Hard-coded brand colours, WhatsApp numbers or secrets anywhere in components.
- Left-aligned CSS in RTL contexts (`ml-`, `pl-`, `text-left`, `left-*`).

## Constraints

- Next.js 16 App Router + TypeScript strict + Tailwind CSS v4.
- Supabase Postgres/Auth/Storage; next-intl v4; Zustand persisted cart.
- react-hook-form + Zod; shadcn/ui in admin; Framer Motion + Lenis in storefront.
- Netlify free tier; ISR with modest revalidation; no paid vendors.
- Logical CSS properties everywhere; `prefers-reduced-motion` honoured.

## Approaches considered

1. **Single Next.js app with a locale segment and an `/admin` segment (chosen).** One deploy,
   one build, shared design tokens; storefront stays static where possible and admin uses
   server actions. Trades a slightly larger bundle for far lower operational cost.
2. **Separate storefront and admin apps.** Cleaner isolation but two builds, two deploys and
   duplicated tokens on a free tier. Rejected.
3. **Headless CMS instead of Supabase.** Faster admin scaffolding but a paid service and a
   second data model. Rejected.

## Decisions made here (builder calls, not client approvals)

- Canonical palette was replaced with the colours sampled from the client's logo artwork:
  forest `#013921`, cream `#FDEED9`, near-black `#090807`; all other tones derived from these.
- Logo assets: `public/logos/district-wear-logo.webp` (light backgrounds),
  `district-wear-logo-light.webp` (dark backgrounds), `app/icon.png` (favicon crop).
- Supabase Storage for images; Unsplash URLs in the seed with local SVG fallbacks.
- Fonts self-hosted via `next/font/google` (build-time download, cached) — Barlow Condensed,
  Inter, IBM Plex Sans Arabic.
- Variant `color` stores the canonical French label used in WhatsApp; `color_en` / `color_ar`
  are optional display fallbacks.
- Inquiry logging ships disabled; rate limiting uses a Postgres counter, no extra vendor.
- Tailwind v4 CSS-first tokens in `app/globals.css`; shadcn/ui components live in
  `components/admin/ui`.

## Data model

See section "Full database schema" in the kickoff message and `db/migrations/*.sql` in Phase 1.
Key points: singleton `settings` row; role check in `public.is_admin()` as `SECURITY DEFINER`
to avoid RLS recursion; public reads gated on `is_published`; anon can only insert well-formed
inquiries; storage policies restrict writes to admins.

## Phase order

0. Setup, tooling, tokens, i18n + RTL skeleton, navbar/footer/language switcher.
1. Schema, migrations, RLS, seed.
2. Admin auth + panel.
3. Storefront Home / Shop / Product with real data.
4. Cart + WhatsApp builder (tests first).
5. Lookbook, About, Contact, 404, animation polish.
6. SEO, performance, a11y, README, Netlify deploy.

Execution method supplied by the client: implement one phase, stop, wait for review.
