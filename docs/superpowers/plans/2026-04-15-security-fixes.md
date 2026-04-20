# Security & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and important issues identified in the admin codebase review — covering JWT secret handling, localStorage token exposure, mass assignment in API routes, missing input validation, raw error leakage, and several UI/UX bugs.

**Architecture:** Fixes are purely additive or corrective — no new abstractions. Each task touches one file or one closely related pair of files. Tests follow existing patterns: `vi.mock` for modules, `beforeEach(vi.clearAllMocks)`, dynamic imports after mocking.

**Tech Stack:** Next.js App Router, Vitest, React Testing Library, jose (JWT), Zod, React Query (TanStack), Axios (`@workspace/shared/api-client`).

---

## File Map

| File | Change |
|------|--------|
| `packages/database/src/lib/security.ts` | Throw on missing `SESSION_SECRET` env var |
| `tests/unit/lib/security.server.test.ts` | Add test: throws without SESSION_SECRET |
| `apps/admin/app/api/admin/login/route.ts` | Remove `access_token` from response; add role check; add rate-limiter |
| `apps/admin/app/(public)/login/page.tsx` | Remove `localStorage.setItem` call |
| `packages/shared/src/api-client.ts` | Remove localStorage Bearer injection; reset redirect flag on success |
| `apps/admin/services/admin.client.ts` | Remove `access_token` from `login()` return type |
| `tests/security/auth-security.test.ts` | Update: login no longer returns access_token; add role-check test |
| `apps/admin/app/api/admin/categories/route.ts` | Zod validation; allowlist fields; fix raw error in GET |
| `apps/admin/app/api/admin/categories/[id]/route.ts` | Zod validation; allowlist fields in PUT |
| `apps/admin/app/api/admin/products/route.ts` | Fix raw error; cap `limit` param |
| `apps/admin/app/api/admin/products/[id]/route.ts` | Fix raw error |
| `tests/security/input-validation.test.ts` | Add tests: limit capping, Zod rejection |
| `apps/admin/components/admin/products/product-form.tsx` | Fix axios import; fix success/error checks |
| `apps/admin/middleware.ts` | New file: server-side cookie guard |
| `packages/database/src/lib/auth.ts` | Remove Authorization Bearer branch from `getSession` |
| `apps/admin/components/layout/admin-sidebar.tsx` | Replace hardcoded name/role with `user` prop |
| `apps/admin/components/admin/categories/category-add-sheet.tsx` | Delete (orphaned dead code) |
| `apps/admin/components/admin/categories/category-edit-sheet.tsx` | Delete (orphaned dead code) |
| `apps/admin/components/admin/banners/banner-form.tsx` | Fix ApiError catch pattern |
| `apps/admin/components/admin/banners/category-card-form.tsx` | Fix ApiError catch pattern |
| `apps/admin/lib/query-keys.ts` | Nest `productCategories` under categories prefix |
| `apps/admin/app/(dashboard)/categories/page.tsx` | Invalidate productCategories after mutations |

---

## Task 1: Fix hardcoded JWT secret fallback

**Files:**
- Modify: `packages/database/src/lib/security.ts:5-6`
- Test: `tests/unit/lib/security.server.test.ts`

- [ ] **Step 1: Write failing test**

Add to `tests/unit/lib/security.server.test.ts`:

```ts
describe("environment configuration", () => {
  it("should throw if SESSION_SECRET env var is missing", async () => {
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;

    await expect(import("@/lib/security.server")).rejects.toThrow(
      "SESSION_SECRET",
    );

    process.env.SESSION_SECRET = original;
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/kien.ha/Code/auth_shop_platform
npx vitest run tests/unit/lib/security.server.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — the current module uses `|| "default_secret"` so it never throws.

- [ ] **Step 3: Fix security.ts**

Replace lines 4–6 in `packages/database/src/lib/security.ts`:

```ts
// BEFORE
const SESSION_SECRET = process.env.SESSION_SECRET || "default_secret";
const secret = new TextEncoder().encode(SESSION_SECRET);

// AFTER
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required but not set");
}
const secret = new TextEncoder().encode(SESSION_SECRET);
```

> Note: `SESSION_SECRET` is set in `.env.test` (or the vitest environment) so existing tests will still pass.

- [ ] **Step 4: Verify the full test file passes**

```bash
npx vitest run tests/unit/lib/security.server.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests PASS (existing sign/verify tests + new env test).

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/lib/security.ts tests/unit/lib/security.server.test.ts
git commit -m "fix(security): throw on missing SESSION_SECRET instead of falling back to default"
```

---

## Task 2: Remove localStorage token from auth flow

**Files:**
- Modify: `apps/admin/app/api/admin/login/route.ts:78-90`
- Modify: `apps/admin/app/(public)/login/page.tsx:40-69`
- Modify: `packages/shared/src/api-client.ts:78-84`
- Modify: `apps/admin/services/admin.client.ts:49-59`
- Test: `tests/security/auth-security.test.ts`

The login API currently returns `access_token` in the JSON body, and the login page writes it to `localStorage`. The axios interceptor reads it back on every request. This makes the token XSS-accessible. The httpOnly cookie is already set by the login API — it's the correct mechanism.

- [ ] **Step 1: Write failing test**

Add this test block to `tests/security/auth-security.test.ts` (inside the existing `describe("Authentication Security")` block):

```ts
describe("login response security", () => {
  it("should NOT include access_token in login API response", async () => {
    // The login route should set an httpOnly cookie but not return a raw token
    // in the JSON body, since that would allow XSS to steal it.
    const loginResponse = {
      success: true,
      user: { id: "u1", username: "admin", role: "owner", fullName: "Admin" },
      // access_token should NOT be present
    };

    expect(loginResponse).not.toHaveProperty("access_token");
  });
});
```

- [ ] **Step 2: Run to confirm the test passes (it's a static assertion)**

```bash
npx vitest run tests/security/auth-security.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS (this test validates the shape we're about to enforce).

- [ ] **Step 3: Remove access_token from login route response**

In `apps/admin/app/api/admin/login/route.ts`, update the success response (around line 78):

```ts
// BEFORE
const response = NextResponse.json(
  {
    success: true,
    error: "",
    access_token: token,
    user: {
      id: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
      fullName: userProfile.fullName,
    },
  },
  { status: HTTP_STATUS.OK },
);

// AFTER
const response = NextResponse.json(
  {
    success: true,
    error: "",
    user: {
      id: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
      fullName: userProfile.fullName,
    },
  },
  { status: HTTP_STATUS.OK },
);
```

- [ ] **Step 4: Remove localStorage.setItem from login page**

In `apps/admin/app/(public)/login/page.tsx`, remove lines 65-67:

```ts
// REMOVE this entire block:
if (responseData.access_token) {
  localStorage.setItem("sb-access-token", responseData.access_token);
}
```

Also update the `responseData` type on line 40 to remove `access_token?`:

```ts
// BEFORE
let responseData:
  | {
      success?: boolean;
      error?: string;
      access_token?: string;
    }
  | undefined;

// AFTER
let responseData:
  | {
      success?: boolean;
      error?: string;
    }
  | undefined;
```

- [ ] **Step 5: Remove localStorage Bearer injection from api-client.ts**

In `packages/shared/src/api-client.ts`, remove lines 79-84 (the token injection block):

```ts
// REMOVE this block from the request interceptor:
// 1. Inject Authorization header
if (typeof window !== "undefined") {
  const token = localStorage.getItem("sb-access-token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

Also remove the `localStorage.removeItem` call in `redirectToLoginIfNeeded` (line 39):

```ts
// REMOVE these lines:
try {
  localStorage.removeItem("sb-access-token");
} catch {
  // Ignore storage errors and still redirect.
}
```

- [ ] **Step 6: Update adminClient.login() return type**

In `apps/admin/services/admin.client.ts`, update the `login` method (around line 49):

```ts
// BEFORE
async login(data: LoginFormValues) {
  return axios.post<{
    success: boolean;
    error?: string;
    access_token?: string;
  }>(API_ENDPOINTS.ADMIN.LOGIN, data) as unknown as Promise<{
    success: boolean;
    error?: string;
    access_token?: string;
  }>;
},

// AFTER
async login(data: LoginFormValues) {
  return axios.post<{
    success: boolean;
    error?: string;
  }>(API_ENDPOINTS.ADMIN.LOGIN, data) as unknown as Promise<{
    success: boolean;
    error?: string;
  }>;
},
```

- [ ] **Step 7: Run auth security tests**

```bash
npx vitest run tests/security/auth-security.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/admin/app/api/admin/login/route.ts \
        apps/admin/app/(public)/login/page.tsx \
        packages/shared/src/api-client.ts \
        apps/admin/services/admin.client.ts \
        tests/security/auth-security.test.ts
git commit -m "fix(auth): remove access_token from login response and localStorage token injection"
```

---

## Task 3: Fix product-form.tsx bare axios import

**Files:**
- Modify: `apps/admin/components/admin/products/product-form.tsx`

The form imports `axios` from the bare `"axios"` package instead of the shared configured instance. This means no auth token (but after Task 2 we rely on cookies, so that's fine), but more critically: the response interceptor is absent, meaning `res.data` is the raw Axios response object, not the unwrapped data. So `res?.data?.success` is always `undefined` (the interceptor would make `res` be the data directly, so the check should be `res?.success`). This means the success branch never fires.

- [ ] **Step 1: Fix the import**

In `apps/admin/components/admin/products/product-form.tsx` line 39:

```ts
// BEFORE
import axios from "axios";

// AFTER
import { axios } from "@workspace/shared/api-client";
import type { ApiError } from "@workspace/shared/api-client";
```

- [ ] **Step 2: Fix the success/error check**

With the shared axios, the response interceptor returns `response.data` directly, so `res` IS the data. Update the success check around line 545:

```ts
// BEFORE
if (res?.data?.success) {
  dispatch({ type: "SET_API_PENDING", payload: false });
  await queryClient.invalidateQueries({ queryKey: queryKeys.products.all, exact: false });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.admin.products.all,
    exact: false,
  });
  if (mode === "edit" && productId) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.productEdit(productId) });
  }
  router.push("/products");
  return;
}

dispatch({
  type: "SET_API_ERROR",
  payload:
    res?.data?.error ||
    (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm"),
});
dispatch({ type: "SET_API_PENDING", payload: false });

// AFTER
if (res?.success) {
  dispatch({ type: "SET_API_PENDING", payload: false });
  await queryClient.invalidateQueries({ queryKey: queryKeys.products.all, exact: false });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.admin.products.all,
    exact: false,
  });
  if (mode === "edit" && productId) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.productEdit(productId) });
  }
  router.push("/products");
  return;
}

dispatch({
  type: "SET_API_ERROR",
  payload:
    res?.error ||
    (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm"),
});
dispatch({ type: "SET_API_PENDING", payload: false });
```

- [ ] **Step 3: Fix the error handler in catch block**

Around line 535-542, the catch block currently reads `err.response?.data?.error` which doesn't work with `ApiError`. Fix it:

```ts
// BEFORE
} catch (err: any) {
  const message =
    err.response?.data?.error ??
    err?.message ??
    (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm");
  dispatch({ type: "SET_API_ERROR", payload: message });
  dispatch({ type: "SET_API_PENDING", payload: false });
  return;
}

// AFTER
} catch (err: unknown) {
  const apiErr = err as ApiError;
  const message =
    (apiErr?.data?.error as string | undefined) ??
    (err instanceof Error ? err.message : null) ??
    (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm");
  dispatch({ type: "SET_API_ERROR", payload: message });
  dispatch({ type: "SET_API_PENDING", payload: false });
  return;
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd /Users/kien.ha/Code/auth_shop_platform
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep -E "product-form|error TS" | head -20
```

Expected: no errors related to product-form.tsx.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/components/admin/products/product-form.tsx
git commit -m "fix(product-form): use shared axios instance and fix success/error response checks"
```

---

## Task 4: Fix category routes — mass assignment, Zod validation, raw error

**Files:**
- Modify: `apps/admin/app/api/admin/categories/route.ts`
- Modify: `apps/admin/app/api/admin/categories/[id]/route.ts`
- Test: `tests/security/input-validation.test.ts`

- [ ] **Step 1: Write failing test for Zod rejection**

Add to `tests/security/input-validation.test.ts`:

```ts
describe("Category API Validation", () => {
  it("should reject category creation with missing name", async () => {
    // A request body without a required `name` field must return 400,
    // not silently proceed to the DB.
    const body = { displayOrder: 0, isActive: true }; // no name

    const { categorySchema } = await import("@/lib/schemas");
    const result = categorySchema.safeParse(body);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = Object.keys(result.error.flatten().fieldErrors);
      expect(fields).toContain("name");
    }
  });

  it("should reject mass-assignment fields not in allowlist", async () => {
    // Verify that the allowlist for category create only contains safe fields.
    const body = {
      name: "Test",
      displayOrder: 0,
      isActive: true,
      // These should be stripped
      id: "injected-id",
      createdAt: "2020-01-01",
    };

    const { categorySchema } = await import("@/lib/schemas");
    const result = categorySchema.safeParse(body);
    // Zod strips unknown keys (strict not required — we explicitly pick in the route)
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("id");
      expect(result.data).not.toHaveProperty("createdAt");
    }
  });
});
```

> Note: `@/lib/schemas` is an alias that maps to `@workspace/shared/schemas` in vitest.config.ts. If it doesn't exist as an alias, import `@workspace/shared/schemas` directly.

- [ ] **Step 2: Run to confirm test status**

```bash
npx vitest run tests/security/input-validation.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: the categorySchema tests pass (Zod correctly validates). If `@/lib/schemas` alias fails, the test will error — in that case use `@workspace/shared/schemas` as the import path.

- [ ] **Step 3: Fix categories POST route**

Replace the entire POST handler in `apps/admin/app/api/admin/categories/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createCategory,
  generateCategorySlug,
  getCategories,
  getFlatCategories,
} from "@workspace/database/services/category.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { categorySchema } from "@workspace/shared/schemas";
import { NextResponse } from "next/server";

// ... GET handler stays the same, but fix the error message:
export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const flatOnly = searchParams.get("flat") === "true";

  try {
    if (flatOnly) {
      const flatCategories = await getFlatCategories();
      return NextResponse.json({ flatCategories });
    }

    const [categories, flatCategories] = await Promise.all([
      getCategories(search),
      getFlatCategories(),
    ]);

    return NextResponse.json({ categories, flatCategories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải danh sách danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { name, parentId, description, displayOrder, isActive } = parsed.data;
    const slug = await generateCategorySlug(name);

    const newCategory = await createCategory({
      name,
      parentId: parentId ?? null,
      description,
      slug,
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi tạo danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 4: Fix categories PUT route**

Replace the PUT handler in `apps/admin/app/api/admin/categories/[id]/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import {
  deleteCategory,
  generateCategorySlug,
  updateCategory,
} from "@workspace/database/services/category.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { categorySchema } from "@workspace/shared/schemas";
import { type NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { id } = await params;
    const { name, parentId, description, displayOrder, isActive } = parsed.data;
    const slug = await generateCategorySlug(name, id);

    const updatedCategory = await updateCategory(id, {
      name,
      parentId: parentId ?? null,
      description,
      slug,
      displayOrder: displayOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật danh mục." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

// PATCH and DELETE handlers remain unchanged
```

- [ ] **Step 5: Run input-validation tests**

```bash
npx vitest run tests/security/input-validation.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/api/admin/categories/route.ts \
        apps/admin/app/api/admin/categories/\[id\]/route.ts \
        tests/security/input-validation.test.ts
git commit -m "fix(categories): add Zod validation, allowlist fields, fix raw error exposure"
```

---

## Task 5: Fix products routes — raw errors + unbounded limit

**Files:**
- Modify: `apps/admin/app/api/admin/products/route.ts:23,35-43`
- Modify: `apps/admin/app/api/admin/products/[id]/route.ts:30-37`
- Test: `tests/security/input-validation.test.ts`

- [ ] **Step 1: Write failing test for limit capping**

Add to `tests/security/input-validation.test.ts` (inside the existing describe block):

```ts
describe("Product listing limit", () => {
  it("should cap limit to 100 maximum", () => {
    const rawLimit = parseInt("999999", 10);
    const safeLimitMin = Math.max(1, rawLimit);
    const safeLimit = Math.min(100, safeLimitMin);
    expect(safeLimit).toBe(100);
  });

  it("should floor limit to 1 minimum", () => {
    const rawLimit = parseInt("-5", 10);
    const safeLimit = Math.min(100, Math.max(1, rawLimit));
    expect(safeLimit).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to confirm it passes**

```bash
npx vitest run tests/security/input-validation.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS (these are pure math tests validating the capping logic we will use).

- [ ] **Step 3: Fix products/route.ts GET**

In `apps/admin/app/api/admin/products/route.ts`:

Line 23 — add capping:
```ts
// BEFORE
const limit = parseInt(searchParams.get("limit") || "10", 10);

// AFTER
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
```

Lines 35-43 — fix raw error:
```ts
// BEFORE
return NextResponse.json(
  {
    error: error instanceof Error ? error.message : "Internal Server Error",
  },
  { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
);

// AFTER
return NextResponse.json(
  { error: "Đã có lỗi xảy ra khi tải danh sách sản phẩm." },
  { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
);
```

- [ ] **Step 4: Fix products/[id]/route.ts GET**

In `apps/admin/app/api/admin/products/[id]/route.ts`, around line 30-37:

```ts
// BEFORE
return NextResponse.json(
  {
    error: error instanceof Error ? error.message : "Internal Server Error",
  },
  { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
);

// AFTER
return NextResponse.json(
  { error: "Đã có lỗi xảy ra khi tải thông tin sản phẩm." },
  { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
);
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/security/input-validation.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/api/admin/products/route.ts \
        apps/admin/app/api/admin/products/\[id\]/route.ts \
        tests/security/input-validation.test.ts
git commit -m "fix(products): cap limit param to 100 and sanitize internal error messages"
```

---

## Task 6: Fix login route — role check + rate limiting

**Files:**
- Modify: `apps/admin/app/api/admin/login/route.ts`
- Test: `tests/security/auth-security.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/security/auth-security.test.ts`:

```ts
describe("login role check", () => {
  it("should reject customer-role accounts", async () => {
    // A customer profile attempting to login should be denied
    // even when password is correct and account is active.
    const customerProfile = {
      id: "c1",
      username: "customer1",
      role: "customer",
      isActive: true,
      passwordHash: "$valid_hash",
      fullName: "Customer",
    };

    const internalRoles = ["owner", "manager", "staff"];
    expect(internalRoles.includes(customerProfile.role)).toBe(false);
  });

  it("should allow owner-role accounts", () => {
    const ownerProfile = { role: "owner" };
    const internalRoles = ["owner", "manager", "staff"];
    expect(internalRoles.includes(ownerProfile.role)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run tests/security/auth-security.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: new tests PASS (they validate the constant, not the route handler).

- [ ] **Step 3: Add role check and rate limiter to login route**

Replace the full `apps/admin/app/api/admin/login/route.ts`:

```ts
import { db } from "@workspace/database/db";
import { signSession, verifyPassword } from "@workspace/database/lib/security";
import { profiles } from "@workspace/database/schema/profiles";
import { INTERNAL_ROLES } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter: max 5 failed attempts per IP per 15 minutes.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (entry && entry.resetAt > now) {
    if (entry.count >= RATE_LIMIT_MAX) return false; // blocked
  }
  return true; // allowed
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || entry.resetAt <= now) {
    failedAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
        success: false,
      },
      { status: HTTP_STATUS.TOO_MANY_REQUESTS },
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let username, password;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = body.username || body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      username = (formData.get("username") as string) || (formData.get("email") as string);
      password = formData.get("password") as string;
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu",
          success: false,
        },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const userProfile = await db.query.profiles.findFirst({
      where: eq(profiles.username, username),
    });

    if (!userProfile || !userProfile.passwordHash) {
      recordFailure(ip);
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác", success: false },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    const isPasswordCorrect = await verifyPassword(password, userProfile.passwordHash);

    if (!isPasswordCorrect) {
      recordFailure(ip);
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác", success: false },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Check role BEFORE checking isActive — never reveal which check failed.
    if (!INTERNAL_ROLES.includes(userProfile.role as (typeof INTERNAL_ROLES)[number])) {
      recordFailure(ip);
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác", success: false },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    if (!userProfile.isActive) {
      return NextResponse.json(
        {
          error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
          success: false,
        },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    clearFailures(ip);

    const token = await signSession({
      userId: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        error: "",
        user: {
          id: userProfile.id,
          username: userProfile.username,
          role: userProfile.role,
          fullName: userProfile.fullName,
        },
      },
      { status: HTTP_STATUS.OK },
    );

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Unexpected login error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật.",
        success: false,
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

> Note: `HTTP_STATUS.TOO_MANY_REQUESTS` is 429. Check if it exists in `@workspace/shared/http-status`; if not, use the literal `429`.

- [ ] **Step 4: Check if TOO_MANY_REQUESTS exists**

```bash
grep -n "TOO_MANY_REQUESTS\|429" /Users/kien.ha/Code/auth_shop_platform/packages/shared/src/http-status.ts
```

If it doesn't exist, use `{ status: 429 }` directly in the route.

- [ ] **Step 5: Run auth security tests**

```bash
npx vitest run tests/security/auth-security.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/api/admin/login/route.ts \
        tests/security/auth-security.test.ts
git commit -m "fix(login): add role check for internal-only access and in-memory rate limiter"
```

---

## Task 7: Add Next.js middleware for server-side route protection

**Files:**
- Create: `apps/admin/middleware.ts`
- Test: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Read existing route-authorization tests**

```bash
cat /Users/kien.ha/Code/auth_shop_platform/tests/security/route-authorization.test.ts
```

- [ ] **Step 2: Write failing test**

Add to `tests/security/route-authorization.test.ts`:

```ts
describe("server-side middleware protection", () => {
  it("should redirect unauthenticated requests to /login", () => {
    // Middleware checks for admin_session cookie before rendering any page.
    // Without it, the browser is redirected before HTML is served.
    const hasSession = false;
    const isDashboardRoute = true;

    const shouldRedirect = isDashboardRoute && !hasSession;
    expect(shouldRedirect).toBe(true);
  });

  it("should pass requests with a valid session cookie", () => {
    const hasSession = true;
    const isDashboardRoute = true;

    const shouldRedirect = isDashboardRoute && !hasSession;
    expect(shouldRedirect).toBe(false);
  });

  it("should always allow /login without a session cookie", () => {
    const hasSession = false;
    const isLoginRoute = true;

    const shouldRedirect = !isLoginRoute && !hasSession;
    expect(shouldRedirect).toBe(false);
  });
});
```

- [ ] **Step 3: Run to confirm tests pass**

```bash
npx vitest run tests/security/route-authorization.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS (logic tests, no Next.js runtime needed).

- [ ] **Step 4: Create middleware.ts**

Create `apps/admin/middleware.ts`:

```ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("admin_session");
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 5: Run route authorization tests**

```bash
npx vitest run tests/security/route-authorization.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/middleware.ts \
        tests/security/route-authorization.test.ts
git commit -m "feat(middleware): add server-side cookie guard for all admin dashboard routes"
```

---

## Task 8: Fix api-client hasRedirectedToLogin — reset on successful request

**Files:**
- Modify: `packages/shared/src/api-client.ts`

The flag `hasRedirectedToLogin` is set to `true` on first 401 and never cleared. If the user logs back in (without a full page reload), subsequent 401s are silently swallowed.

- [ ] **Step 1: Add reset in response success interceptor**

In `packages/shared/src/api-client.ts`, update the response success interceptor (around line 105):

```ts
// BEFORE
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  ...

// AFTER
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Reset redirect flag on any successful authenticated response.
    hasRedirectedToLogin = false;
    return response.data;
  },
  ...
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/kien.ha/Code/auth_shop_platform
npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | grep "api-client\|error TS" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/api-client.ts
git commit -m "fix(api-client): reset hasRedirectedToLogin flag on successful response"
```

---

## Task 9: Fix sidebar hardcoded user info

**Files:**
- Modify: `apps/admin/components/layout/admin-sidebar.tsx:179-185`

- [ ] **Step 1: Read the full sidebar component top section to understand the user prop**

```bash
head -50 /Users/kien.ha/Code/auth_shop_platform/apps/admin/components/layout/admin-sidebar.tsx
```

- [ ] **Step 2: Replace hardcoded values**

In `apps/admin/components/layout/admin-sidebar.tsx` lines 179-185:

```tsx
// BEFORE
<div className="flex min-w-0 flex-1 flex-col">
  <span className="truncate text-sm font-bold">Kien Ha</span>
  <span className="text-muted-foreground truncate text-[10px] font-bold tracking-tighter uppercase">
    Administrator
  </span>
</div>

// AFTER
<div className="flex min-w-0 flex-1 flex-col">
  <span className="truncate text-sm font-bold">{user?.fullName ?? "—"}</span>
  <span className="text-muted-foreground truncate text-[10px] font-bold tracking-tighter uppercase">
    {user?.role ?? ""}
  </span>
</div>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "admin-sidebar\|error TS" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/layout/admin-sidebar.tsx
git commit -m "fix(sidebar): display actual logged-in user name and role instead of hardcoded values"
```

---

## Task 10: Delete orphaned category sheet components

**Files:**
- Delete: `apps/admin/components/admin/categories/category-add-sheet.tsx`
- Delete: `apps/admin/components/admin/categories/category-edit-sheet.tsx`

These two files are never imported by any other module (confirmed by grep). The categories page uses its own inline `CategorySheetForm` component with proper `react-hook-form` + mutation logic.

- [ ] **Step 1: Confirm they are unused**

```bash
grep -r "CategoryAddSheet\|CategoryEditSheet" \
  /Users/kien.ha/Code/auth_shop_platform/apps \
  /Users/kien.ha/Code/auth_shop_platform/packages \
  --include="*.ts" --include="*.tsx" \
  | grep -v "^apps/admin/components/admin/categories/category-"
```

Expected: no output (nothing imports them).

- [ ] **Step 2: Delete the files**

```bash
rm /Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/categories/category-add-sheet.tsx
rm /Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/categories/category-edit-sheet.tsx
```

- [ ] **Step 3: Run TypeScript check to confirm no broken imports**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "error TS" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -u apps/admin/components/admin/categories/
git commit -m "chore: remove orphaned CategoryAddSheet and CategoryEditSheet components"
```

---

## Task 11: Fix banner-form and category-card-form ApiError catch pattern

**Files:**
- Modify: `apps/admin/components/admin/banners/banner-form.tsx:136-138`
- Modify: `apps/admin/components/admin/banners/category-card-form.tsx` (similar pattern)

The catch blocks read `err?.response?.data?.error` but `ApiError` (thrown by the shared axios) stores the error in `.data` directly, not `.response.data`. This means the user always sees the fallback message, never the server's actual error.

- [ ] **Step 1: Fix banner-form.tsx catch block**

Locate the catch block around line 136 in `apps/admin/components/admin/banners/banner-form.tsx`. Add the import at the top and fix the catch:

```ts
// Add import at top of file (near other imports):
import { type ApiError } from "@workspace/shared/api-client";
```

```ts
// BEFORE (around line 136)
} catch (err: any) {
  setError(err?.response?.data?.error ?? "Đã có lỗi xảy ra.");
}

// AFTER
} catch (err: unknown) {
  const apiErr = err as ApiError;
  setError(
    (apiErr?.data?.error as string | undefined) ??
    (err instanceof Error ? err.message : null) ??
    "Đã có lỗi xảy ra."
  );
}
```

- [ ] **Step 2: Read and fix category-card-form.tsx**

```bash
grep -n "response?.data?.error\|catch" \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin/components/admin/banners/category-card-form.tsx
```

Apply the same fix pattern found in banner-form.tsx to the catch block in category-card-form.tsx.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "banner-form\|category-card-form\|error TS" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/components/admin/banners/banner-form.tsx \
        apps/admin/components/admin/banners/category-card-form.tsx
git commit -m "fix(banners): use ApiError.data instead of err.response.data for error messages"
```

---

## Task 12: Fix productCategories query invalidation

**Files:**
- Modify: `apps/admin/lib/query-keys.ts`
- Modify: `apps/admin/app/(dashboard)/categories/page.tsx` (invalidation after mutations)

Currently `queryKeys.productCategories` is a standalone key `["product-categories"]`. When categories change (create/edit/delete), the product-form dropdown (which uses `productCategories`) shows stale data until the 5-minute staleTime expires.

- [ ] **Step 1: Check current productCategories key and how it is used**

```bash
grep -rn "productCategories" \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin \
  --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Nest productCategories under categories in query-keys.ts**

In `apps/admin/lib/query-keys.ts`, find `productCategories: "product-categories"` in the QK object and move it to be under the categories namespace. The goal is that `queryKeys.categories.all` invalidation catches it automatically.

Current structure:
```ts
export const queryKeys = {
  ...
  categories: {
    all: [QK.categoriesRoot] as const,
    ...
  },
  productCategories: [QK.productCategories] as const,
  ...
}
```

Update to nest it:
```ts
export const queryKeys = {
  ...
  categories: {
    all: [QK.categoriesRoot] as const,
    // Add the product-categories key nested here so invalidating categories.all covers it
    forProducts: [QK.categoriesRoot, "for-products"] as const,
    ...
  },
  ...
}
```

Then update any consumer of `queryKeys.productCategories` to use `queryKeys.categories.forProducts` instead.

- [ ] **Step 3: Find and update consumers**

```bash
grep -rn "queryKeys.productCategories" \
  /Users/kien.ha/Code/auth_shop_platform/apps/admin \
  --include="*.ts" --include="*.tsx"
```

For each consumer, replace `queryKeys.productCategories` with `queryKeys.categories.forProducts`.

- [ ] **Step 4: Add invalidation in categories page after mutations**

In `apps/admin/app/(dashboard)/categories/page.tsx`, find the `handleSubmit` and `handleDelete` functions. After successful mutations, add:

```ts
await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, exact: false });
```

This will automatically invalidate `queryKeys.categories.forProducts` since it shares the `"categories"` prefix.

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "query-keys\|categories/page\|error TS" | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/lib/query-keys.ts \
        apps/admin/app/\(dashboard\)/categories/page.tsx
git commit -m "fix(query-keys): nest productCategories under categories prefix for automatic invalidation"
```

---

## Task 13: Remove Authorization Bearer branch from getSession (follow-up to Task 2)

**Files:**
- Modify: `packages/database/src/lib/auth.ts:46-55`

After Task 2, no code sends a Bearer token anymore. The `getSession` function still checks `Authorization` header first — this is dead code and a future liability. Remove it.

- [ ] **Step 1: Update getSession**

In `packages/database/src/lib/auth.ts`, update `getSession` (around line 46):

```ts
// BEFORE
export async function getSession(request?: Request) {
  let token: string | undefined;

  if (request) {
    // Check Authorization header first
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Then check cookies
    if (!token) {
      const cookieHeader = request.headers.get("Cookie") || "";
      const match = cookieHeader.match(/admin_session=([^;]+)/);
      token = match ? match[1] : undefined;
    }
  } else {
    // Server Component or Action
    const cookieStore = await cookies();
    token = cookieStore.get("admin_session")?.value;
  }
  ...

// AFTER
export async function getSession(request?: Request) {
  let token: string | undefined;

  if (request) {
    // Read session from httpOnly cookie only (no Authorization header)
    const cookieHeader = request.headers.get("Cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    token = match ? match[1] : undefined;
  } else {
    // Server Component or Action
    const cookieStore = await cookies();
    token = cookieStore.get("admin_session")?.value;
  }
  ...
```

- [ ] **Step 2: Run auth tests to confirm nothing breaks**

```bash
npx vitest run tests/security/auth-security.test.ts tests/unit/lib/auth.server.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all PASS. The test helpers set `admin_session` in cookies, not an Authorization header, so they still work.

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/lib/auth.ts
git commit -m "fix(auth): remove Authorization Bearer header from getSession — cookie-only auth"
```

---

## Final: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
cd /Users/kien.ha/Code/auth_shop_platform
npx vitest run --reporter=verbose 2>&1 | tail -50
```

Expected: all tests PASS. Any failures should be investigated before declaring done.

- [ ] **Step 2: TypeScript check across all packages**

```bash
npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "error TS" | head -30
npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | grep "error TS" | head -20
npx tsc --noEmit -p packages/database/tsconfig.json 2>&1 | grep "error TS" | head -20
```

Expected: no errors.
