# Authorization Fixes Design

**Date:** 2026-03-18
**Status:** Approved

## Overview

Four categories of authorization bugs exist in the admin API routes. This spec covers the fixes, plus a prerequisite constant addition.

---

## Prerequisite: Add `FORBIDDEN` to `HTTP_STATUS`

**File:** `lib/http-status.ts`

`HTTP_STATUS.FORBIDDEN` (403) is missing from the constant map. Add it before implementing any role-check changes:

```ts
FORBIDDEN: 403,
```

This constant is used throughout Fix 2, Fix 3, and the 401/403 cleanup in Fix 4 routes.

---

## Fix 1: Missing auth on cost-history endpoint

**File:** `app/api/admin/products/variants/[variantId]/cost-history/route.ts`

The `GET` handler has no authentication check, making cost price history publicly accessible.

**Fix:** Add `getInternalUser(request)` guard at the top of the handler. Return `401` (`HTTP_STATUS.UNAUTHORIZED`) if user is null. Any authenticated internal user (owner/manager/staff) may read cost history.

---

## Fix 2: Hardcoded role strings in variants route

**File:** `app/api/admin/products/[id]/variants/route.ts`

The `POST` handler checks `["owner", "admin"]` as hardcoded strings. The role `"admin"` does not exist in this system (making it dead code), and the check bypasses the `ROLE` enum.

**Fix:** Replace the hardcoded array with `ROLE.OWNER`. Manager and staff were always blocked by this check; the refactor does not change behavior. Apply the standard two-check guard:

```ts
if (!internalUser) return NextResponse.json(..., { status: HTTP_STATUS.UNAUTHORIZED })
if (internalUser.profile.role !== ROLE.OWNER) return NextResponse.json(..., { status: HTTP_STATUS.FORBIDDEN })
```

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

**Implementation pattern:** In owner-only delete handlers, apply the two-check guard:

```ts
if (!internalUser) return NextResponse.json(..., { status: HTTP_STATUS.UNAUTHORIZED })
if (internalUser.profile.role !== ROLE.OWNER) return NextResponse.json(..., { status: HTTP_STATUS.FORBIDDEN })
```

All other HTTP methods (GET, POST, PUT, PATCH) on these routes remain accessible to all internal users.

---

## Fix 4: Pass `request` to `getInternalUser()` consistently + split 401/403

The 401/403 split applies to **all** role-restricted handlers, not just DELETE. Routes that currently return a single combined `401` for both unauthenticated and wrong-role cases must be split.

**Affected routes — `request` threading only (no role-check change):**
- `app/api/admin/customers/route.ts` (GET, POST)
- `app/api/admin/categories/route.ts` (GET, POST)
- `app/api/admin/suppliers/route.ts` (GET, POST)
- `app/api/admin/stats/route.ts` (GET)
- `app/api/admin/chat/route.ts` (GET)

**Affected routes — `request` threading + 401/403 split:**
- `app/api/admin/expenses/route.ts` (GET, POST) — currently returns combined 401; split to 401 (no user) / 403 (wrong role)
- `app/api/admin/expenses/[id]/route.ts` (DELETE) — same
- `app/api/admin/finance/route.ts` (GET) — same
- `app/api/admin/analytics/route.ts` (GET) — multi-role check (`OWNER` or `MANAGER`); split to 401 (no user) / 403 (wrong role), keeping the multi-role condition:
  ```ts
  if (!internalUser) return ... 401
  if (![ROLE.OWNER, ROLE.MANAGER].includes(internalUser.profile.role as any)) return ... 403
  ```

**Affected routes — signature change required:**
- `app/api/admin/profile/route.ts` (GET) — handler declared `async function GET()` with no argument; add `request: Request` to the signature, then pass it to `getInternalUser(request)`

---

## Success Criteria

- `HTTP_STATUS.FORBIDDEN` (403) exists in `lib/http-status.ts`
- `GET /api/admin/products/variants/[variantId]/cost-history` returns `401` without a valid session
- `POST /api/admin/products/[id]/variants` returns `401` for unauthenticated, `403` for manager/staff
- `DELETE /api/admin/customers/[id]` returns `401` for unauthenticated, `403` for manager/staff
- `DELETE /api/admin/suppliers/[id]` returns `401` for unauthenticated, `403` for manager/staff
- Role-restricted non-DELETE routes (`finance`, `expenses`, `analytics`) return `403` for authenticated wrong-role requests (not `401`)
- No hardcoded role strings remain in the codebase
- All `getInternalUser()` calls in API routes pass the `request` parameter
- TypeScript compilation passes with no errors
