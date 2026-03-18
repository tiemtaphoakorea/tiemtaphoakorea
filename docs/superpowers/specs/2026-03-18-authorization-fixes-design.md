# Authorization Fixes Design

**Date:** 2026-03-18
**Status:** Approved

## Overview

Four categories of authorization bugs exist in the admin API routes. This spec covers the fixes.

---

## Fix 1: Missing auth on cost-history endpoint

**File:** `app/api/admin/products/variants/[variantId]/cost-history/route.ts`

The `GET` handler has no authentication check, making cost price history publicly accessible.

**Fix:** Add `getInternalUser(request)` guard at the top of the handler. Return `401` if user is null. Any authenticated internal user (owner/manager/staff) may read cost history.

---

## Fix 2: Hardcoded role strings in variants route

**File:** `app/api/admin/products/[id]/variants/route.ts`

The `POST` handler checks `["owner", "admin"]` as hardcoded strings. The role `"admin"` does not exist in this system (making it dead code), and the check bypasses the `ROLE` enum.

**Fix:** Replace the hardcoded array with `ROLE.OWNER` from `@/lib/constants`. Only owners may create variants.

---

## Fix 3: Delete permission model by resource

| Resource | DELETE allowed roles |
|---|---|
| `DELETE /customers/[id]` | owner only |
| `DELETE /users/[id]` | owner only (already correct, no change) |
| `DELETE /suppliers/[id]` | owner only |
| `DELETE /orders/[id]` | owner / manager / staff |
| `DELETE /products` (bulk) | owner / manager / staff |
| `DELETE /products/[id]` | owner / manager / staff |
| `DELETE /categories/[id]` | owner / manager / staff |
| `DELETE /supplier-orders/[id]` | owner / manager / staff |

**Implementation pattern:** In owner-only delete handlers, after `getInternalUser(request)`, check `internalUser.profile.role !== ROLE.OWNER` and return `403` if true.

All other HTTP methods (GET, POST, PUT, PATCH) on these routes remain accessible to all internal users.

---

## Fix 4: Pass `request` to `getInternalUser()` consistently

Several API route handlers call `getInternalUser()` without the `request` argument. In API route handlers (not Server Components), the `request` object is always available and must be passed so session extraction reads from the Authorization header or request cookies — not the Next.js `cookies()` server context.

**Affected routes:**
- `app/api/admin/customers/route.ts` (GET, POST)
- `app/api/admin/categories/route.ts` (GET, POST)
- `app/api/admin/suppliers/route.ts` (GET, POST)
- `app/api/admin/stats/route.ts` (GET)
- `app/api/admin/expenses/route.ts` (GET, POST)
- `app/api/admin/chat/route.ts` (GET)

**Fix:** Pass `request` as the argument to every `getInternalUser()` call in these handlers.

---

## Success Criteria

- `GET /api/admin/products/variants/[variantId]/cost-history` returns `401` without a valid session
- `POST /api/admin/products/[id]/variants` returns `403` for manager/staff roles
- `DELETE /api/admin/customers/[id]` returns `403` for manager/staff roles
- `DELETE /api/admin/suppliers/[id]` returns `403` for manager/staff roles
- All other routes continue to work as before
- No hardcoded role strings remain in the codebase
- All `getInternalUser()` calls in API routes pass the `request` parameter
