# DISTRICT WEAR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DISTRICT WEAR storefront and admin panel in seven reviewed phases.

**Architecture:** One Next.js App Router application. `app/[locale]` is the public storefront
with French default and Arabic RTL; `app/admin` is a protected island using Supabase Auth.
Shared tokens live in `app/globals.css`; data access is split between anon browser/server
clients and a server-only service-role client.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, next-intl 4, Supabase,
Zustand, react-hook-form + Zod, shadcn/ui, Framer Motion, Lenis, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-district-wear-design.md`

## Global Constraints

- Colors only via Tailwind tokens backed by CSS variables; no literal hex in components.
- Logical properties only: `ps-`/`pe-`/`ms-`/`me-`/`start`/`end`.
- Animate transform and opacity only; respect `prefers-reduced-motion`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- No `any`; strict TypeScript; ESLint + Prettier clean.
- Stop after each phase and wait for client review.

## Review Focus

- WhatsApp message: French names, one line per item, total, short reference, compact length.
- Cart: stale price/stock must invalidate lines, never silently change totals.
- RTL: logical properties in every component; `dir` and `lang` correct for Arabic.
- RLS: anon cannot read drafts, cannot write catalogue, cannot read inquiry rows.
- Netlify: static/ISR pages build without paid plugins or services.

---

## Phase 0 — Setup, tokens, i18n skeleton, layout

### Task 0.1: Toolchain

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
`eslint.config.mjs`, `prettier.config.mjs`, `.gitignore`, `.env.example`, `netlify.toml`,
`vitest.config.ts`, `lib/utils.ts`

- [ ] Create configs with pinned Next 16.4.x, Tailwind v4, next-intl 4.
- [ ] Run `npm install`; expect a lockfile and no peer-dependency errors.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run format:check`; expect clean.

### Task 0.2: Design tokens and i18n

**Files:** `app/globals.css`, `i18n/{routing,request,navigation}.ts`, `proxy.ts`,
`messages/{fr,ar,en}.json`

- [ ] Define forest/cream/ink scales as CSS variables and Tailwind tokens.
- [ ] Configure fr default, ar RTL, en; locale-prefixed routes; proxy excludes `/admin`.

### Task 0.3: Layout shell

**Files:** `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`,
`components/layout/{navbar,footer,language-switcher,mobile-nav}.tsx`,
`components/motion/smooth-scroll.tsx`, `public/logos/district-wear-mark.svg`

- [ ] Render `<html lang dir>`, fonts, providers, skip link, Navbar, Footer.
- [ ] Language switcher preserves pathname and query string.
- [ ] Run `npm run build`; start `npm run dev` and verify `/fr`, `/ar`, `/en` render.

## Phase 1 — Database

Migrations `0001_profiles.sql`, `0002_catalog.sql`, `0003_settings_inquiries.sql`,
`0004_rls.sql`, `0005_storage.sql`, `seed.sql`; typed Supabase clients. Verify policies with
anon/authenticated role simulations; seed 12 products with FR/AR/EN copy.

## Phase 2 — Admin

Supabase Auth login, route guard, dashboard, products/categories/collections CRUD, settings,
image upload, toasts, confirm dialogs, Zod validation in server actions.

## Phase 3 — Storefront data

Home, Shop with filters/search/sort, Product gallery and variant picker, related products.

## Phase 4 — Cart and WhatsApp

Vitest tests first for `buildWhatsAppMessage` and cart selectors/store; then drawer, full cart
page, revalidation, inquiry logger route with rate limit.

## Phase 5 — Content and polish

Collections/Lookbook, About, Contact, locale 404, page transitions, reveals, responsive checks
at 360/768/1280/1920.

## Phase 6 — Launch

Per-locale metadata, hreflang, sitemap, robots, OG image, JSON-LD, Lighthouse pass, full README,
Netlify deploy.
