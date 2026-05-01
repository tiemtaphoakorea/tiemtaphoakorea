# Admin App Migration from Next.js to Vite + React — Monorepo Exploration Report

**Date:** 2026-04-30  
**Report:** Explore task — understand monorepo context for admin app migration to Vite + React  

---

## 1. apps/main/ Structure

**What it is:** Storefront/e-commerce landing page for customers (guest users and B2B wholesale)

**Package.json:**
- `@workspace/main` (v0.0.0)
- **Framework:** Next.js v16.1.5
- **Port:** 3000 (dev: `next dev --port 3000`)
- **Build:** `pnpm --filter @workspace/database db:status && next build`

**Key dependencies:**
- `next` (v16.1.5)
- `react` (v19.2.4)
- `@tanstack/react-query` (v5.90.19)
- `@supabase/ssr` (v0.8.0), `@supabase/supabase-js` (v2.95.2)
- `@workspace/ui`, `@workspace/shared`, `@workspace/database`

**Structure:**
- App directory: `/apps/main/app/`
  - `(store)` — customer-facing storefront pages (products, checkout, etc.)
  - `api/` — **10+ API routes** (products, categories, chat, upload, etc.)
  - `design-system/` — design documentation page
  - `layout.tsx` — root with Next.js metadata

**API Routes in main:** Located at `/apps/main/app/api/`:
```
/products
/categories
/upload
/chat
/chat/messages
/chat/rooms
/chat/rooms/[id]/messages
/chat/rooms/[id]/mark-read
```

**Key routes:**
- `GET /api/products` — fetch catalog
- `GET /api/categories` — fetch categories
- `POST /api/upload` — upload images
- `/api/chat/*` — guest-to-admin messaging

**Auth:** Uses Supabase + session cookies (from shared auth in `packages/database`)

---

## 2. packages/ Inventory

| Package | Purpose | Key Exports | Next.js Dependent? |
|---------|---------|-------------|------------------|
| `@workspace/database` | Database ORM, schema, auth helpers, business logic services | `./schema`, `./services/*`, `./db`, `./lib/auth` | **YES** — depends `next` (v15.0.0) in devDeps; uses `next/cache`, `next/headers` server functions |
| `@workspace/shared` | Constants, Zod schemas, utilities, API client | `./constants`, `./schemas`, `./utils`, `./api-endpoints`, `./analytics` | **NO** — pure utilities; has no Next.js imports |
| `@workspace/ui` | shadcn-based component library + Tailwind styles | `./components/*`, `./hooks/*`, `./globals.css` | **PARTIALLY** — uses `next-themes` (ThemeProvider in `sonner.tsx`); no other Next.js APIs |
| `@workspace/eslint-config` | ESLint presets | — | NO |
| `@workspace/typescript-config` | TypeScript presets | — | NO |

### Deep Dives

**packages/database (Drizzle + Auth):**
- **Schema location:** `/packages/database/src/schema/` — users, profiles, products, orders, customers, suppliers, chat, etc.
- **Client export:** `./db` → `/src/db.ts` (Drizzle instance connecting to Postgres via `postgres` lib)
- **Auth exports:** `./lib/auth` → `/src/lib/auth.ts`
  - `getInternalUser(request?: Request)` — validates session cookie, fetches user + profile
  - `getSession(request)` — verifies JWT in cookies
  - Profile cache (60s TTL) on every API call
  - Uses `next/cache` for revalidatePath, `next/headers` for cookies
- **Server functions heavily used:** `revalidatePath()`, cookies(), redirect()
- **Security:** Session cookies with httpOnly, secure flags

**packages/shared:**
- Pure utility exports; **NO Next.js dependencies**
- Constants (roles, routes, error messages)
- Zod schemas for validation
- HTTP status codes
- Pagination helpers
- Axios-based API client (`./api-client`)

**packages/ui:**
- shadcn + Radix UI components
- `next-themes` used only in `sonner.tsx` for theme detection
- No other Next.js APIs; can be migrated to work with a generic context API

---

## 3. Cross-App Coupling: Admin ↔ Main

**Shared code:**
- Both import from `@workspace/database`, `@workspace/shared`, `@workspace/ui`
- **No direct imports** between apps (admin does not import from main or vice versa)

**Auth coupling:**
- **Shared Supabase project:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET` (global env in turbo.json)
- **Same cookie domain:** Admin uses `admin_session` cookie (httpOnly, sameSite=lax, domain=localhost in dev)
- **Shared database:** Both read/write the same Postgres instance

**Admin-specific vs. shared:**
- Main has 8 API routes (public: chat, products, categories, upload)
- Admin has 48+ API routes under `/api/admin/*` (employees only)

**API routes are NOT shared:** Even though both apps have separate API routes, they all connect to the same `@workspace/database` services.

---

## 4. Backend Candidates for API Routes After Migration

**Current situation:**
- Admin API routes live at `/apps/admin/app/api/admin/*` (Next.js API routes)
- These routes import from `@workspace/database/services/*` for business logic
- All auth validation goes through `getInternalUser()` from `@workspace/database/lib/auth`

**Analysis of backend options:**

1. **Separate backend app in repo** — NO candidate exists yet
   - No Express, Hono, Fastify, or other backend framework in the monorepo
   - Docs indicate `docs/guide/vercel.json` exists (Vercel static export config) — NO backend reference

2. **API Routes → Hono/Express new app** — **REQUIRED DECISION**
   - Needs a new `/apps/api` (or `/apps/backend`) with Hono or Express
   - Would reuse `@workspace/database` services (all business logic already extracted)
   - Auth middleware would call `getSession()` + `getUserProfile()` from shared
   - Would run on separate port (e.g., 3002) or same container with path prefix

3. **BFF pattern** — Not currently in place; could create a dedicated admin API app

4. **Serverless functions** — No serverless setup detected (no Vercel Functions config beyond static export)

**Conclusion:** **A new backend home is required.** Current setup has API routes baked into Next.js app; moving to Vite SPA means decoupling the API layer. Recommend creating `/apps/api` with Hono or Express before admin migration.

---

## 5. Build/Deploy Infrastructure

**Turbo.json:**
```
Global env: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SESSION_SECRET, OPENAI_API_KEY

Tasks:
  - build: outputs .next/**, dist/**
  - dev: persistent, no cache
  - lint, typecheck: depend on ^build
  - test, format, db:*: cache false
```

**Root package.json scripts:**
```
build       → turbo build
dev         → turbo dev       (starts all apps in parallel)
test:e2e    → playwright test (admin-focused, see below)
db:reset    → tsx scripts/reset-db.ts
```

**Docker:**
- `docker-compose.yml` has **only Postgres** (v16-alpine)
- No app containers defined — apps run locally with `pnpm dev`
- No Dockerfile for admin or main

**Deploy config:**
- `/docs/guide/vercel.json` → Vercel static export config
- **No admin-specific Vercel config** in root or apps/admin
- Likely deployed as monorepo (both apps from same repo)

**Current deployment approach (inferred):**
- Vercel: Both apps deployed from same repo, separate projects
- Admin: likely `@vercel/project-admin` (port 3001 in dev)
- Main: likely `@vercel/project-main` (port 3000 in dev)

---

## 6. Tests Touching Admin

**Playwright E2E config:**
- Base URL: `ADMIN_BASE_URL` from constants (default: `http://admin.localhost:3000`)
- **55+ test files** in `/tests/e2e/` — ALL exercise admin URLs

**Tests by domain:**

| Domain | Spec Files | Example |
|--------|-----------|---------|
| **Chat** | 9 files | `admin-inbox.spec.ts`, `admin-messaging.spec.ts`, `admin-flow.spec.ts` |
| **Admin CRUD** | 8 files | `customers/customer-crud.spec.ts`, `banners/admin-crud.spec.ts`, `users/create.spec.ts` |
| **Orders** | 10 files | `orders/create.spec.ts`, `orders/edit-restrictions.spec.ts` |
| **Accounting** | 5 files | `accounting/pnl-calculation.spec.ts`, `accounting/cost-price-validation.spec.ts` |
| **Products** | 5 files | `products/concurrency.spec.ts`, `products/images.spec.ts` |
| **Security** | 10 files | `security/unauthorized-access.spec.ts`, `security/role-escalation.spec.ts` |
| **Other** | ~12 files | Suppliers, debts, dashboard, suppliers orders, etc. |

**Key fixtures:**
- `loginAsAdmin(page)` — auth fixture in `/tests/e2e/fixtures/auth.ts`
- API helper: `apiPost()`, `getChatRooms()` in `/tests/e2e/helpers/api.ts`

**Test data isolation:**
- Tests use `testRunId` to isolate data (no conflicts in parallel runs)

---

## 7. Key Findings & Gaps

### Blockers for Vite Migration:

1. **Backend API routes need a new home**
   - `@workspace/database` currently imports `next/cache` and `next/headers`
   - Moving admin UI to Vite SPA leaves these routes orphaned
   - **Action:** Create `/apps/api` (Hono/Express) before moving admin

2. **packages/database has Next.js tight coupling**
   - Uses `next/headers` for cookies, `next/cache` for revalidatePath
   - These are server-only APIs; must be abstracted or moved to API layer
   - Example: `getInternalUser(request)` validates session → works if moved to API handler, needs refactoring if used client-side

3. **packages/ui uses next-themes**
   - Only used in `sonner.tsx` for theme detection
   - Vite + React can use generic context API or migrate to `next-themes`-independent solution
   - **Impact:** Low; manageable refactor

4. **Admin-specific routes must move**
   - 48+ routes at `/apps/admin/app/api/admin/*` must go to new backend
   - All import `getInternalUser()` → auth validation must move too

5. **E2E tests point to admin.localhost:3000**
   - Playlist config uses `ADMIN_BASE_URL` constant
   - SPA will be at same domain but served from Vite dev server (port 5173 locally)
   - **Action:** Update test config to point to Vite port during migration

### No blockers on UI side:

- Admin app code is pure React/Next.js — no Next.js-only hooks used in components
- No `next/image`, `next/link` imports detected in admin app
- Uses standard React patterns: React Query, React Hook Form, Zod

---

## 8. Monorepo Context Summary

```
auth_shop_platform/
├── apps/
│   ├── main/           (Next.js, port 3000) — Storefront + 8 public API routes
│   ├── admin/          (Next.js, port 3001) — Admin dashboard + 48 private API routes
│   └── (no /api app)   ← NEEDED for Vite migration
├── packages/
│   ├── database/       (Drizzle ORM, auth, services) — HAS Next.js deps
│   ├── shared/         (Utils, constants, schemas) — Pure, NO Next.js
│   └── ui/             (shadcn, Tailwind) — Light Next.js (next-themes only)
├── tests/
│   ├── e2e/            (Playwright, 55+ specs) — ALL test admin
│   └── security/       (Vitest)
├── turbo.json          (Mono config)
├── docker-compose.yml  (Postgres only)
└── playwright.config.ts (admin.localhost:3000)
```

---

## Appendix: Files Relevant to Migration

- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/package.json` — Admin deps
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/next.config.ts` — Next.js config (transpilePackages, image rules)
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/` — API routes to migrate
- `/Users/kien.ha/Code/auth_shop_platform/packages/database/src/lib/auth.ts` — Core auth logic
- `/Users/kien.ha/Code/auth_shop_platform/packages/database/src/index.ts` — Main exports
- `/Users/kien.ha/Code/auth_shop_platform/packages/shared/src/constants.ts` — Shared constants
- `/Users/kien.ha/Code/auth_shop_platform/playwright.config.ts` — E2E test config
- `/Users/kien.ha/Code/auth_shop_platform/turbo.json` — Turbo task config

---

**End of Report**
