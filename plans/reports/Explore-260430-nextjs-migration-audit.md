# Next.js Migration Audit: Admin App → Vite + React
**Date:** 2026-04-30  
**Scope:** `/Users/kien.ha/Code/auth_shop_platform/apps/admin/`  
**Total .ts/.tsx files:** 157 (app/, components/, lib/, services/)

---

## SUMMARY: Migration Effort Assessment

**Risk Level:** MEDIUM  
**Breaking Usages:** 117 imports across 5 major Next.js APIs  
**Key Blocker:** 47 API route handlers + heavy next/navigation coupling  
**Effort Estimate:** 3–5 days (refactor routes to Express/Hapi, replace router hooks)

---

## 1. Next.js Package Imports – Total: 118 imports

### By Package:
| Package | Count | Files | Breaking? |
|---------|-------|-------|-----------|
| `next/server` | 51 | 47 | ✅ CRITICAL |
| `next/link` | 32 | 32 | ✅ CRITICAL |
| `next/navigation` | 20 | 18 | ✅ CRITICAL |
| `next/image` | 9 | 9 | ✅ HIGH |
| `next/dynamic` | 4 | 4 | ✅ MEDIUM |
| `next/font/google` | 1 | 1 | LOW |
| `next/cache` (revalidatePath) | 1 | 1 | MEDIUM |

---

## 2. `next/server` Usage: 51 imports → **47 API Route Handlers**

All route handlers under `/app/api/admin/**/route.ts` import `NextRequest` and/or `NextResponse`.

**Top 10 files:**
1. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/customers/[id]/route.ts`
2. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/customers/[id]/status/route.ts`
3. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/products/route.ts`
4. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/suppliers/[id]/route.ts`
5. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/suppliers/[id]/stats/route.ts`
6. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/orders/[id]/route.ts`
7. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/orders/[id]/cancel/route.ts`
8. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/orders/[id]/payments/route.ts`
9. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/chat/route.ts`
10. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/expenses/route.ts`

**Also in lib/:**
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/lib/api-auth.ts`
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/lib/order-idempotency.ts`
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/lib/idempotency.ts`
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/lib/date-range.ts`

**Migration path:** Replace `NextRequest`/`NextResponse` with Express Request/Response or fetch-compatible response object. Requires handler rewrite.

---

## 3. `next/link` Usage: 32 imports → **32 Files**

**Breaking:** All `<Link>` components must be replaced with `<a>` or React Router's `<Link>`.

**Top 10 files (by importance):**
1. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/layout.tsx` (root layout)
2. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/page.tsx` (dashboard home)
3. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/customers/page.tsx`
4. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/products/page.tsx`
5. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/orders/page.tsx`
6. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/layout/admin-sidebar.tsx` (navigation hub)
7. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/customers/customer-table.tsx`
8. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/orders/order-table.tsx`
9. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/dashboard/dashboard-recent-orders.tsx`
10. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/products/product-form.tsx`

**Note:** 32 files = approximately 70% of page/component files use `<Link>`.

---

## 4. `next/navigation` Hook Usage: 20 imports → **18 Files**

### Breakdown by Hook:
| Hook | Count | Files |
|------|-------|-------|
| `useRouter` | 34 | Client-side navigation |
| `usePathname` | 22 | Route-aware styling/logic |
| `useSearchParams` | 20 | Query string handling |
| `useParams` | 6 | Dynamic route parameters |
| `redirect` (server) | 1 (auth) | `/app/(public)/login/page.tsx` |

**Critical files (useRouter + useSearchParams heavy):**
1. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/customers/page.tsx` (filtering, sorting)
2. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/products/page.tsx` (filters)
3. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/orders/page.tsx` (pagination, status filters)
4. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/suppliers/page.tsx` (filters)
5. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/layout/admin-sidebar.tsx` (active link tracking)

**Migration path:** Use React Router v6 (`useNavigate`, `useLocation`, `useSearchParams`) or TanStack Router equivalents.

---

## 5. `next/image` Usage: 9 imports → **9 Files**

Simple replacements with `<img>` or image library. **Low effort.**

**Files:**
1. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/settings/page.tsx`
2. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/products/page.tsx`
3. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/orders/[id]/page.tsx`
4. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/image-uploader.tsx`
5. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/products/product-table.tsx`
6. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/orders/order-item-table.tsx`
7. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/order-detail/order-items-table.tsx`
8. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/chat-room/message-list.tsx`
9. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/orders/create/product-selector.tsx`

**Note:** `next.config.ts` has `remotePatterns` for image optimization. Vite won't enforce these; move to runtime checks if needed.

---

## 6. `next/dynamic` Usage: 4 imports → **4 Files**

Lazy-load components using `next/dynamic()`.

**Files:**
1. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/page.tsx`
2. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/analytics/page.tsx`
3. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/analytics/finance/page.tsx`
4. `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/(dashboard)/analytics/overview/page.tsx`

**Migration:** Replace with React's `React.lazy()` + `<Suspense>` or Vite's `import.meta.glob()` for code splitting.

---

## 7. `next/cache` (revalidatePath): 1 import → **1 File**

- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/api/admin/products/route.ts`

**Usage:** ISR-style cache invalidation. In Vite, requires custom cache layer or SWR-style revalidation on client.

---

## 8. Server Components & 'use server' Directives

### 'use client':
**Count:** 0 explicit `'use client'` directives found.  
**Implication:** App is built as traditional Next.js Server Components by default. All page components and layouts are RSC-enabled.

### 'use server':
**Count:** 0 server actions found.  
**Data fetching:** All server-side logic is via `/app/api/**/route.ts` handlers, not RSC data functions.

### Metadata Export:
**Count:** 1 file  
- `/Users/kien.ha/Code/auth_shop_platform/apps/admin/app/layout.tsx` (`export const metadata`)

Easily replaced with helmet/react-head library for SEO in Vite.

---

## 9. API Route Structure: 47 route.ts Files

**Distribution:**
- `/app/api/admin/` base: **13 core endpoints**
- Dynamic routes `[id]/`: **20+ nested handlers** (customer, product, order details)
- Sub-resources (`.../stats/`, `.../[id]/route.ts`): **14+ handlers**

**Sample routes:**
- GET `/admin/customers` → `app/api/admin/customers/route.ts`
- GET `/admin/customers/[id]` → `app/api/admin/customers/[id]/route.ts`
- POST `/admin/customers/[id]/status` → `app/api/admin/customers/[id]/status/route.ts`
- GET `/admin/orders/[id]/payments` → `app/api/admin/orders/[id]/payments/route.ts`

**Migration path:** Convert `route.ts` to Express routes or migrate to dedicated backend service. Vite is frontend-only.

---

## 10. Environment Variables

**NEXT_PUBLIC_* scan:** 0 results  
**Implication:** No hardcoded Next.js-specific env vars in code. Environment config likely in `.env` (not checked as file is in .gitignore).

---

## 11. Middleware & Advanced Features

**middleware.ts:** None found  
**cookies()/headers() from next/headers:** 0 uses  
**unstable_* APIs:** 0 uses  
**react-server condition:** Not used

---

## 12. Additional Next.js Files

- `next-env.d.ts` — Next.js type definitions (auto-generated, can delete in Vite)
- `next.config.ts` — Config for remotePatterns, transpilePackages, serverExternalPackages
- `.next/` — Build output (will not exist in Vite)

---

## Migration Checklist by Priority

### 🔴 CRITICAL (Must Do)
- [ ] Convert 47 API route handlers to Express/Hapi/backend service
- [ ] Replace 32 `<Link>` components with React Router `<Link>` or plain `<a>`
- [ ] Replace 82 hook usages (`useRouter`, `usePathname`, etc.) with React Router equivalents
- [ ] Replace 4 `next/dynamic()` with `React.lazy()` + `<Suspense>`

### 🟠 HIGH (Should Do)
- [ ] Replace 9 `<Image>` with `<img>` (or image optimization library)
- [ ] Remove `next/font/google` → use CSS `@import` or local fonts
- [ ] Replace metadata export with react-helmet or vite-plugin-head

### 🟡 MEDIUM (Nice to Have)
- [ ] Remove `revalidatePath` call → implement SWR or manual cache invalidation
- [ ] Delete `next.config.ts` → move image validation to runtime
- [ ] Set up environment variable loading (Vite uses `import.meta.env`)

---

## File Size & Scope Summary

| Category | Count | Impact |
|----------|-------|--------|
| Total .ts/.tsx files | 157 | Scope |
| API route handlers | 47 | **CRITICAL** |
| Files with next/link | 32 | **CRITICAL** |
| Files with next/navigation hooks | 18 | **CRITICAL** |
| Files with next/image | 9 | HIGH |
| Files with next/dynamic | 4 | MEDIUM |
| Files with next/cache | 1 | MEDIUM |
| Files with metadata | 1 | LOW |

---

## Recommended Next Steps

1. **Extract backend routes** → Move `/app/api/**/` to a separate Express/backend service
2. **Create router wrapper** → Build React Router adapter layer to replace `next/navigation` hooks
3. **Component audit** → Find & replace `<Link>`, `<Image>`, `next/dynamic`
4. **Test incremental migration** → Convert one feature at a time (customers → products → orders)
5. **Vite setup** → Configure Vite with React, TailwindCSS, alias paths matching current structure

