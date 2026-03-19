# app/ → apps/ Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the monorepo split — move all routes, components, services, and hooks from the root `app/` into `apps/admin/` and `apps/main/`, fix broken package imports, and clean up the old root directories.

**Architecture:** The repo is a Turborepo monorepo with `apps/admin` (Next.js, port 3001), `apps/main` (Next.js, port 3000), and shared `packages/database`, `packages/shared`, `packages/ui`. All cross-app code lives in packages; app-specific code lives in the respective app. `@/` paths resolve to the app root; `@repo/*` paths resolve to packages.

**Tech Stack:** Next.js 16, TypeScript, Turborepo, Drizzle ORM, Supabase, Tailwind CSS v4, Biome

---

## Import path reference

When copying files to apps, update these `@/lib/...` and `@/services/...` imports:

| Old (root) | New (monorepo) |
|---|---|
| `@/lib/constants` | `@repo/shared/constants` |
| `@/lib/routes` | `@repo/shared/routes` |
| `@/lib/utils` | `@repo/shared/utils` |
| `@/lib/api-endpoints` | `@repo/shared/api-endpoints` |
| `@/lib/schemas` | `@repo/shared/schemas` |
| `@/lib/http-status` | `@repo/shared/http-status` |
| `@/lib/pagination` | `@repo/shared/pagination` |
| `@/lib/analytics` | `@repo/shared/analytics` |
| `@/lib/security.server` | `@repo/database/lib/security` |
| `@/lib/auth.server` | `@repo/database/lib/auth` |
| `@/lib/db-locking` | `@repo/database/lib/db-locking` |
| `@/lib/idempotency` | `@repo/database/lib/idempotency` |
| `@/lib/supabase/server` | `@repo/database/lib/supabase/server` |
| `@/lib/supabase/admin` | `@repo/database/lib/supabase/admin` |
| `@/lib/supabase/client` | `@repo/database/lib/supabase/client` |
| `@/lib/api-client` | `@repo/shared` |
| `@/services/*.server` | `@repo/database/services/*.server` |
| `@/types/*` | `@repo/shared/types/*` |
| `@/components/ui/*` | `@repo/ui/components/*` |

These stay as `@/` (within-app imports, after files are moved to their app):
- `@/components/admin/*` — in admin app
- `@/components/layout/admin-sidebar` — in admin app
- `@/components/image-uploader` — in admin app
- `@/components/layout/*` (non-admin) — in main app
- `@/components/account/*`, `@/components/products/*`, `@/components/sections/*`, `@/components/store/*` — in main app
- `@/services/admin.client` — in admin app
- `@/services/chat.client` — in main app
- `@/hooks/*` — in main app

---

## Task 1: Add api-client to packages/shared

**Files:**
- Create: `packages/shared/src/api-client.ts`
- Modify: `packages/shared/package.json`

- [ ] **Step 1: Create `packages/shared/src/api-client.ts`**

Copy from root `lib/api-client.ts` and update the one internal import:

```ts
// Change this line:
import { HTTP_STATUS } from "@/lib/http-status";
// To:
import { HTTP_STATUS } from "./http-status";
```

Everything else stays the same.

- [ ] **Step 2: Add export to `packages/shared/package.json`**

Add to the `exports` object:
```json
"./api-client": "./src/api-client.ts"
```

- [ ] **Step 3: Commit**

```bash
cd /path/to/root
git add packages/shared/src/api-client.ts packages/shared/package.json
git commit -m "feat: add api-client to packages/shared"
```

---

## Task 2: Fix packages/database — add supabase browser client

**Files:**
- Create: `packages/database/src/lib/supabase/client.ts`
- Modify: `packages/database/package.json`

- [ ] **Step 1: Copy `lib/supabase/client.ts` → `packages/database/src/lib/supabase/client.ts`**

File has no internal `@/` imports — copy as-is.

- [ ] **Step 2: Add export to `packages/database/package.json`**

The `"./lib/*"` wildcard already covers it — no change needed. Verify the exports section includes:
```json
"./lib/*": "./src/lib/*.ts"
```

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/lib/supabase/client.ts
git commit -m "feat: add supabase browser client to packages/database"
```

---

## Task 3: Fix packages/ui — useMobile hook and image-uploader

The `packages/ui/src/components/sidebar.tsx` has a broken `@/hooks/useMobile` import.
The `packages/ui/src/components/image-uploader.tsx` has broken `@/lib/*` imports — this component is admin-only, so remove it from packages/ui.

**Files:**
- Create: `packages/ui/src/hooks/useMobile.ts`
- Modify: `packages/ui/src/components/sidebar.tsx`
- Delete: `packages/ui/src/components/image-uploader.tsx`

- [ ] **Step 1: Create `packages/ui/src/hooks/useMobile.ts`**

Copy from root `hooks/useMobile.ts` — no import changes needed (no `@/` imports).

- [ ] **Step 2: Update `packages/ui/src/components/sidebar.tsx` import**

```ts
// Change:
import { useIsMobile } from "@/hooks/useMobile";
// To:
import { useIsMobile } from "../hooks/useMobile";
```

- [ ] **Step 3: Remove `packages/ui/src/components/image-uploader.tsx`**

This component is admin-only (used only in `components/admin/products/product-form.tsx`). It will live in `apps/admin/components/image-uploader.tsx` instead.

```bash
git rm packages/ui/src/components/image-uploader.tsx
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/hooks/useMobile.ts packages/ui/src/components/sidebar.tsx
git commit -m "fix: move useMobile to packages/ui hooks, remove misplaced image-uploader"
```

---

## Task 4: Update root package.json for workspace

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add workspaces field to root `package.json`**

Add after the `"private": true` line:
```json
"workspaces": ["apps/*", "packages/*"],
```

- [ ] **Step 2: Update scripts to use turbo**

Replace the `"dev"`, `"build"`, `"start"` scripts with turbo equivalents:
```json
"dev": "turbo dev",
"build": "turbo build",
"start": "turbo start",
"typecheck": "turbo typecheck",
"lint": "turbo lint",
"lint:fix": "turbo lint:fix",
```

Keep these root-level scripts (they reference root-level tools):
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio",
"db:reset": "npx tsx scripts/reset-db.ts",
"db:seed:e2e": "npx tsx scripts/seed-e2e.ts",
"test": "vitest",
"test:run": "vitest run",
"test:security": "vitest run tests/security/",
"test:unit": "vitest run tests/unit/",
"test:components": "vitest run tests/components/",
"test:a11y": "playwright test tests/e2e/a11y.spec.ts",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report",
"prepare": "husky"
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: configure root package.json as workspace root"
```

---

## Task 5: Set up apps/admin/app/ — routes and layout

The admin app needs its full Next.js route structure. Source files come from root `app/admin/` and `app/api/admin/`.

**Mapping:**
- `app/admin/(dashboard)/` → `apps/admin/app/(dashboard)/`
- `app/admin/(public)/` → `apps/admin/app/(public)/`
- `app/api/admin/` → `apps/admin/app/api/` *(strip the `/admin` prefix — the app IS admin)*
- `app/layout.tsx` → `apps/admin/app/layout.tsx` (copy as-is, update component imports)
- `app/globals.css` → `apps/admin/app/globals.css`

- [ ] **Step 1: Copy directory structure**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
cp -r "$ROOT/app/admin/(dashboard)" "$ROOT/apps/admin/app/(dashboard)"
cp -r "$ROOT/app/admin/(public)" "$ROOT/apps/admin/app/(public)"
cp -r "$ROOT/app/api/admin" "$ROOT/apps/admin/app/api"
cp "$ROOT/app/layout.tsx" "$ROOT/apps/admin/app/layout.tsx"
cp "$ROOT/app/globals.css" "$ROOT/apps/admin/app/globals.css"
```

- [ ] **Step 2: Update import in `apps/admin/app/layout.tsx`**

```ts
// Change:
import { Toaster } from "@/components/ui/toaster";
// To:
import { Toaster } from "@repo/ui/components/toaster";
// Also remove the css import line:
// import "./globals.css";
// And add:
import "./globals.css";
```
*(The globals.css import stays the same — it references the local file)*

- [ ] **Step 3: Bulk-update `@/lib/*` and `@/services/*.server` imports in all copied admin app files**

Run these sed commands from the repo root to update the copied files:

```bash
ADMIN_APP=apps/admin/app

# lib/* → @repo/shared/*
find "$ADMIN_APP" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/constants"|from "@repo/shared/constants"|g' \
  -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
  -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
  -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
  -e 's|from "@/lib/schemas"|from "@repo/shared/schemas"|g' \
  -e 's|from "@/lib/http-status"|from "@repo/shared/http-status"|g' \
  -e 's|from "@/lib/pagination"|from "@repo/shared/pagination"|g' \
  -e 's|from "@/lib/analytics"|from "@repo/shared/analytics"|g' \
  -e 's|from "@/lib/api-client"|from "@repo/shared/api-client"|g'

# lib/security*, lib/auth*, lib/supabase/* → @repo/database/lib/*
find "$ADMIN_APP" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/security.server"|from "@repo/database/lib/security"|g' \
  -e 's|from "@/lib/auth.server"|from "@repo/database/lib/auth"|g' \
  -e 's|from "@/lib/db-locking"|from "@repo/database/lib/db-locking"|g' \
  -e 's|from "@/lib/idempotency"|from "@repo/database/lib/idempotency"|g' \
  -e 's|from "@/lib/supabase/server"|from "@repo/database/lib/supabase/server"|g' \
  -e 's|from "@/lib/supabase/admin"|from "@repo/database/lib/supabase/admin"|g' \
  -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g'

# services/*.server → @repo/database/services/*.server
find "$ADMIN_APP" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/services/analytics.server"|from "@repo/database/services/analytics.server"|g' \
  -e 's|from "@/services/category.server"|from "@repo/database/services/category.server"|g' \
  -e 's|from "@/services/chat.server"|from "@repo/database/services/chat.server"|g' \
  -e 's|from "@/services/customer.server"|from "@repo/database/services/customer.server"|g' \
  -e 's|from "@/services/dashboard.server"|from "@repo/database/services/dashboard.server"|g' \
  -e 's|from "@/services/finance.server"|from "@repo/database/services/finance.server"|g' \
  -e 's|from "@/services/guest.server"|from "@repo/database/services/guest.server"|g' \
  -e 's|from "@/services/order-split.server"|from "@repo/database/services/order-split.server"|g' \
  -e 's|from "@/services/order.server"|from "@repo/database/services/order.server"|g' \
  -e 's|from "@/services/product.server"|from "@repo/database/services/product.server"|g' \
  -e 's|from "@/services/storage.server"|from "@repo/database/services/storage.server"|g' \
  -e 's|from "@/services/supplier-management.server"|from "@repo/database/services/supplier-management.server"|g' \
  -e 's|from "@/services/supplier.server"|from "@repo/database/services/supplier.server"|g' \
  -e 's|from "@/services/user.server"|from "@repo/database/services/user.server"|g'

# components/ui/* → @repo/ui/components/*
find "$ADMIN_APP" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/components/ui/|from "@repo/ui/components/|g'

# types/* → @repo/shared/types/*
find "$ADMIN_APP" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/types/|from "@repo/shared/types/|g'
```

- [ ] **Step 4: Verify no stale `@/lib/` or `@/services/*.server` or `@/types/` imports remain in admin app**

```bash
grep -r 'from "@/lib/' apps/admin/app/ | grep -v "node_modules"
grep -r 'from "@/services/.*\.server"' apps/admin/app/ | grep -v "node_modules"
grep -r 'from "@/types/' apps/admin/app/ | grep -v "node_modules"
```

Expected: no output (all resolved).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/
git commit -m "feat: add admin routes to apps/admin/app/"
```

---

## Task 6: Move admin components to apps/admin/

**Files:**
- Create: `apps/admin/components/admin/` (all files from root `components/admin/`)
- Create: `apps/admin/components/layout/admin-sidebar.tsx`
- Create: `apps/admin/components/image-uploader.tsx`

- [ ] **Step 1: Copy admin components**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
mkdir -p "$ROOT/apps/admin/components/layout"
cp -r "$ROOT/components/admin" "$ROOT/apps/admin/components/admin"
cp "$ROOT/components/layout/admin-sidebar.tsx" "$ROOT/apps/admin/components/layout/admin-sidebar.tsx"
cp "$ROOT/components/image-uploader.tsx" "$ROOT/apps/admin/components/image-uploader.tsx"
```

- [ ] **Step 2: Bulk-update imports in copied admin components**

```bash
ADMIN_COMPS=apps/admin/components

find "$ADMIN_COMPS" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/constants"|from "@repo/shared/constants"|g' \
  -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
  -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
  -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
  -e 's|from "@/lib/schemas"|from "@repo/shared/schemas"|g' \
  -e 's|from "@/lib/http-status"|from "@repo/shared/http-status"|g' \
  -e 's|from "@/lib/pagination"|from "@repo/shared/pagination"|g' \
  -e 's|from "@/lib/api-client"|from "@repo/shared/api-client"|g' \
  -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g' \
  -e 's|from "@/services/analytics.server"|from "@repo/database/services/analytics.server"|g' \
  -e 's|from "@/services/category.server"|from "@repo/database/services/category.server"|g' \
  -e 's|from "@/services/chat.server"|from "@repo/database/services/chat.server"|g' \
  -e 's|from "@/services/customer.server"|from "@repo/database/services/customer.server"|g' \
  -e 's|from "@/services/order.server"|from "@repo/database/services/order.server"|g' \
  -e 's|from "@/services/product.server"|from "@repo/database/services/product.server"|g' \
  -e 's|from "@/services/supplier.server"|from "@repo/database/services/supplier.server"|g' \
  -e 's|from "@/components/ui/|from "@repo/ui/components/|g' \
  -e 's|from "@/types/|from "@repo/shared/types/|g'
```

- [ ] **Step 3: Verify**

```bash
grep -r 'from "@/lib/' apps/admin/components/ | grep -v "node_modules"
grep -r 'from "@/types/' apps/admin/components/ | grep -v "node_modules"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/
git commit -m "feat: move admin components to apps/admin/"
```

---

## Task 7: Move admin services to apps/admin/

**Files:**
- Create: `apps/admin/services/admin.client.ts`

- [ ] **Step 1: Copy `services/admin.client.ts`**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
mkdir -p "$ROOT/apps/admin/services"
cp "$ROOT/services/admin.client.ts" "$ROOT/apps/admin/services/admin.client.ts"
```

- [ ] **Step 2: Update imports in `apps/admin/services/admin.client.ts`**

```ts
// Change:
import { axios } from "@/lib/api-client";
// To:
import { axios } from "@repo/shared/api-client";
```

Also update any other `@/lib/*` imports following the reference table.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/services/
git commit -m "feat: move admin.client.ts to apps/admin/services/"
```

---

## Task 8: Complete apps/main/app/ — add API routes and fix imports

**Files:**
- Create: `apps/main/app/api/chat/` (from `app/api/chat/`)
- Create: `apps/main/app/api/products/` (from `app/api/products/`)
- Create: `apps/main/app/api/upload/` (from `app/api/upload/`)
- Create: `apps/main/app/not-found.tsx` (from `app/not-found.tsx`)
- Modify: `apps/main/app/globals.css` (copy from `app/globals.css` if missing)
- Modify: all existing `apps/main/app/**/*.tsx` files — fix broken `@/lib/`, `@/services/`, `@/components/ui/` imports

- [ ] **Step 1: Copy missing API routes and pages**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
cp -r "$ROOT/app/api/chat" "$ROOT/apps/main/app/api/chat"
cp -r "$ROOT/app/api/products" "$ROOT/apps/main/app/api/products"
cp -r "$ROOT/app/api/upload" "$ROOT/apps/main/app/api/upload"
cp "$ROOT/app/not-found.tsx" "$ROOT/apps/main/app/not-found.tsx"
# globals.css (copy if it doesn't exist already)
[ ! -f "$ROOT/apps/main/app/globals.css" ] && cp "$ROOT/app/globals.css" "$ROOT/apps/main/app/globals.css"
```

- [ ] **Step 2: Fix imports in newly copied files**

```bash
MAIN_API=apps/main/app/api

find "$MAIN_API" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/constants"|from "@repo/shared/constants"|g' \
  -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
  -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
  -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
  -e 's|from "@/lib/schemas"|from "@repo/shared/schemas"|g' \
  -e 's|from "@/lib/http-status"|from "@repo/shared/http-status"|g' \
  -e 's|from "@/lib/pagination"|from "@repo/shared/pagination"|g' \
  -e 's|from "@/lib/security.server"|from "@repo/database/lib/security"|g' \
  -e 's|from "@/lib/auth.server"|from "@repo/database/lib/auth"|g' \
  -e 's|from "@/lib/db-locking"|from "@repo/database/lib/db-locking"|g' \
  -e 's|from "@/lib/idempotency"|from "@repo/database/lib/idempotency"|g' \
  -e 's|from "@/lib/supabase/server"|from "@repo/database/lib/supabase/server"|g' \
  -e 's|from "@/lib/supabase/admin"|from "@repo/database/lib/supabase/admin"|g' \
  -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g' \
  -e 's|from "@/services/analytics.server"|from "@repo/database/services/analytics.server"|g' \
  -e 's|from "@/services/category.server"|from "@repo/database/services/category.server"|g' \
  -e 's|from "@/services/chat.server"|from "@repo/database/services/chat.server"|g' \
  -e 's|from "@/services/customer.server"|from "@repo/database/services/customer.server"|g' \
  -e 's|from "@/services/order.server"|from "@repo/database/services/order.server"|g' \
  -e 's|from "@/services/product.server"|from "@repo/database/services/product.server"|g' \
  -e 's|from "@/services/storage.server"|from "@repo/database/services/storage.server"|g' \
  -e 's|from "@/services/guest.server"|from "@repo/database/services/guest.server"|g' \
  -e 's|from "@/types/|from "@repo/shared/types/|g'
```

- [ ] **Step 3: Fix imports in existing apps/main/app pages (already copied but with stale imports)**

```bash
MAIN_APP_PAGES=apps/main/app

# Apply same bulk replacements to pre-existing pages
find "$MAIN_APP_PAGES" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/constants"|from "@repo/shared/constants"|g' \
  -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
  -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
  -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
  -e 's|from "@/lib/schemas"|from "@repo/shared/schemas"|g' \
  -e 's|from "@/lib/http-status"|from "@repo/shared/http-status"|g' \
  -e 's|from "@/lib/pagination"|from "@repo/shared/pagination"|g' \
  -e 's|from "@/lib/supabase/server"|from "@repo/database/lib/supabase/server"|g' \
  -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g' \
  -e 's|from "@/services/analytics.server"|from "@repo/database/services/analytics.server"|g' \
  -e 's|from "@/services/category.server"|from "@repo/database/services/category.server"|g' \
  -e 's|from "@/services/product.server"|from "@repo/database/services/product.server"|g' \
  -e 's|from "@/services/order.server"|from "@repo/database/services/order.server"|g' \
  -e 's|from "@/services/guest.server"|from "@repo/database/services/guest.server"|g' \
  -e 's|from "@/components/ui/|from "@repo/ui/components/|g' \
  -e 's|from "@/types/|from "@repo/shared/types/|g'
```

- [ ] **Step 4: Verify**

```bash
grep -r 'from "@/lib/' apps/main/app/ | grep -v "node_modules"
grep -r 'from "@/services/.*\.server"' apps/main/app/ | grep -v "node_modules"
grep -r 'from "@/components/ui/' apps/main/app/ | grep -v "node_modules"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/main/app/
git commit -m "feat: add missing API routes to apps/main and fix import paths"
```

---

## Task 9: Move main app components to apps/main/

**Files:**
- Create: `apps/main/components/account/`
- Create: `apps/main/components/products/`
- Create: `apps/main/components/sections/`
- Create: `apps/main/components/store/`
- Create: `apps/main/components/layout/` (customer-sidebar, footer, footer-link, navbar, social-icon)

- [ ] **Step 1: Copy main components**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
cp -r "$ROOT/components/account" "$ROOT/apps/main/components/account"
cp -r "$ROOT/components/products" "$ROOT/apps/main/components/products"
cp -r "$ROOT/components/sections" "$ROOT/apps/main/components/sections"
cp -r "$ROOT/components/store" "$ROOT/apps/main/components/store"
mkdir -p "$ROOT/apps/main/components/layout"
cp "$ROOT/components/layout/customer-sidebar.tsx" "$ROOT/apps/main/components/layout/customer-sidebar.tsx"
cp "$ROOT/components/layout/footer.tsx" "$ROOT/apps/main/components/layout/footer.tsx"
cp "$ROOT/components/layout/footer-link.tsx" "$ROOT/apps/main/components/layout/footer-link.tsx"
cp "$ROOT/components/layout/navbar.tsx" "$ROOT/apps/main/components/layout/navbar.tsx"
cp "$ROOT/components/layout/social-icon.tsx" "$ROOT/apps/main/components/layout/social-icon.tsx"
```

- [ ] **Step 2: Bulk-update imports**

```bash
MAIN_COMPS=apps/main/components

find "$MAIN_COMPS" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  -e 's|from "@/lib/constants"|from "@repo/shared/constants"|g' \
  -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
  -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
  -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
  -e 's|from "@/lib/schemas"|from "@repo/shared/schemas"|g' \
  -e 's|from "@/lib/http-status"|from "@repo/shared/http-status"|g' \
  -e 's|from "@/lib/pagination"|from "@repo/shared/pagination"|g' \
  -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g' \
  -e 's|from "@/services/analytics.server"|from "@repo/database/services/analytics.server"|g' \
  -e 's|from "@/services/category.server"|from "@repo/database/services/category.server"|g' \
  -e 's|from "@/services/product.server"|from "@repo/database/services/product.server"|g' \
  -e 's|from "@/services/order.server"|from "@repo/database/services/order.server"|g' \
  -e 's|from "@/components/ui/|from "@repo/ui/components/|g' \
  -e 's|from "@/types/|from "@repo/shared/types/|g'
```

- [ ] **Step 3: Verify**

```bash
grep -r 'from "@/lib/' apps/main/components/ | grep -v "node_modules"
grep -r 'from "@/components/ui/' apps/main/components/ | grep -v "node_modules"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/main/components/
git commit -m "feat: move main components to apps/main/"
```

---

## Task 10: Move main services and hooks to apps/main/

**Files:**
- Create: `apps/main/services/chat.client.ts`
- Create: `apps/main/hooks/use-chat-scroll.tsx`
- Create: `apps/main/hooks/use-realtime-chat.tsx`
- Create: `apps/main/hooks/useChat.ts`
- Create: `apps/main/hooks/useDebounce.ts`

- [ ] **Step 1: Copy services and hooks**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
mkdir -p "$ROOT/apps/main/services" "$ROOT/apps/main/hooks"
cp "$ROOT/services/chat.client.ts" "$ROOT/apps/main/services/chat.client.ts"
cp "$ROOT/hooks/use-chat-scroll.tsx" "$ROOT/apps/main/hooks/use-chat-scroll.tsx"
cp "$ROOT/hooks/use-realtime-chat.tsx" "$ROOT/apps/main/hooks/use-realtime-chat.tsx"
cp "$ROOT/hooks/useChat.ts" "$ROOT/apps/main/hooks/useChat.ts"
cp "$ROOT/hooks/useDebounce.ts" "$ROOT/apps/main/hooks/useDebounce.ts"
```

- [ ] **Step 2: Update imports**

```bash
MAIN_SVC=apps/main/services
MAIN_HOOKS=apps/main/hooks

for dir in "$MAIN_SVC" "$MAIN_HOOKS"; do
  find "$dir" -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
    -e 's|from "@/lib/api-client"|from "@repo/shared/api-client"|g' \
    -e 's|from "@/lib/api-endpoints"|from "@repo/shared/api-endpoints"|g' \
    -e 's|from "@/lib/routes"|from "@repo/shared/routes"|g' \
    -e 's|from "@/lib/utils"|from "@repo/shared/utils"|g' \
    -e 's|from "@/lib/supabase/client"|from "@repo/database/lib/supabase/client"|g' \
    -e 's|from "@/types/|from "@repo/shared/types/|g'
done
```

- [ ] **Step 3: Verify**

```bash
grep -r 'from "@/lib/' apps/main/services/ apps/main/hooks/ | grep -v "node_modules"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/main/services/ apps/main/hooks/
git commit -m "feat: move main services and hooks to apps/main/"
```

---

## Task 11: Remove old root directories

With all code migrated, remove the stale root-level source directories and monolith config files.

- [ ] **Step 1: Remove old root source directories**

```bash
ROOT=/Users/kien.ha/Code/auth_shop_platform
git rm -r "$ROOT/app"
git rm -r "$ROOT/components"
git rm -r "$ROOT/services"
git rm -r "$ROOT/hooks"
git rm -r "$ROOT/lib"
git rm -r "$ROOT/types"
git rm -r "$ROOT/utils"
```

- [ ] **Step 2: Remove monolith-only root config files**

These belong to the monolith Next.js app, not the workspace root:

```bash
git rm "$ROOT/next.config.ts"
git rm "$ROOT/next-env.d.ts"
git rm "$ROOT/postcss.config.mjs"
git rm "$ROOT/components.json"
```

Keep at root (still needed): `vitest.config.ts`, `playwright.config.ts`, `biome.json`, `drizzle.config.ts`, `knip.json`, `tsconfig.json`, `turbo.json`, `.env*`, `public/`, `scripts/`, `tests/`, `coverage/`, `agent/`, `proxy.ts`

- [ ] **Step 3: Verify no broken references remain**

```bash
# Check that no test file imports from the deleted directories
grep -r 'from "@/lib/\|from "@/services/\|from "@/components/\|from "@/hooks/' tests/ | grep -v "node_modules" | head -20
```

If test imports are found, update them to use `@repo/database`, `@repo/shared`, or `@repo/ui` paths. Tests using `@/services/*.server` → `@repo/database/services/*.server`, etc.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: remove old monolith root directories and config"
```

---

## Task 12: Final verification

- [ ] **Step 1: Check for any remaining stale imports across the monorepo**

```bash
# Should return nothing for cross-boundary @/ imports in packages
grep -r 'from "@/lib/\|from "@/services/\|from "@/hooks/\|from "@/types/' packages/ | grep -v "node_modules"

# apps may still use @/ for within-app paths — verify they reference local files only
grep -r 'from "@/lib/' apps/ | grep -v "node_modules"
```

- [ ] **Step 2: Run typechecks for both apps**

```bash
cd apps/admin && npx tsc --noEmit
cd apps/main && npx tsc --noEmit
```

Fix any remaining import errors found.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve remaining import path issues post-migration"
```

---

## Notes

- **Tests (`tests/`):** Root-level tests reference old `@/` paths and will need updating as a follow-up. The vitest config uses path aliases from `tsconfig.json` — after removing root-level `lib/`, `services/`, etc., the root `tsconfig.json` paths need to be updated to point to `packages/*` for test imports.
- **`lib/customers.ts`, `lib/orders.ts`, `lib/products.ts`:** These are unused mock data files (only `customers.ts` has a test). They can be deleted as part of Task 11 along with the `lib/` directory. Update or delete `tests/unit/lib/customers.test.ts` accordingly.
- **`run_move.sh`:** An untracked helper script — safe to delete after migration is complete.
