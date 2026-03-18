# Authorization Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four categories of authorization bugs in the admin API routes: missing auth, hardcoded role strings, missing delete permission checks, and inconsistent `request` threading.

**Architecture:** All changes are in route handler files and one constants file. No new abstractions needed — the existing `getInternalUser(request)` + `ROLE` enum pattern is already correct in most routes; this plan propagates it to the outliers. The `HTTP_STATUS` constant map gets a new `FORBIDDEN: 403` entry used throughout. Route handler authorization tests live in a new dedicated file `tests/security/route-authorization.test.ts` to keep mocking setup isolated.

**Tech Stack:** Next.js 15 API routes, TypeScript, Vitest for unit/security tests

---

## Files Modified

| File | Change |
|---|---|
| `lib/http-status.ts` | Add `FORBIDDEN: 403` |
| `tests/unit/lib/http-status.test.ts` | Assert `HTTP_STATUS.FORBIDDEN === 403` |
| `app/api/admin/products/variants/[variantId]/cost-history/route.ts` | Add `getInternalUser(request)` guard |
| `app/api/admin/products/[id]/variants/route.ts` | Replace hardcoded `["owner","admin"]` with `ROLE.OWNER`; split 401/403 |
| `app/api/admin/customers/[id]/route.ts` | Add owner-only check to DELETE |
| `app/api/admin/suppliers/[id]/route.ts` | Add owner-only check to DELETE |
| `app/api/admin/customers/route.ts` | Pass `request` to `getInternalUser` |
| `app/api/admin/categories/route.ts` | Pass `request` to `getInternalUser` |
| `app/api/admin/suppliers/route.ts` | Pass `request` to `getInternalUser` |
| `app/api/admin/stats/route.ts` | Pass `request` to `getInternalUser` |
| `app/api/admin/chat/route.ts` | Pass `request` to `getInternalUser` |
| `app/api/admin/expenses/route.ts` | Pass `request` + split 401/403 |
| `app/api/admin/expenses/[id]/route.ts` | Pass `request` + split 401/403 |
| `app/api/admin/finance/route.ts` | Pass `request` + split 401/403 |
| `app/api/admin/analytics/route.ts` | Add `request: Request` to signature + pass to `getInternalUser` + split 401/403 |
| `app/api/admin/profile/route.ts` | Add `request: Request` to signature + pass to `getInternalUser` |
| `tests/security/route-authorization.test.ts` | New file: route-level auth tests |

---

## Mocking pattern used throughout tests

`vi.mock()` calls are hoisted by Vitest before module imports. They must appear at the **top level** of the test file — never inside functions or `it` blocks. To change mock return values per-test, use `vi.mocked(fn).mockResolvedValue(...)` inside `beforeEach` or `it` bodies.

The new test file `tests/security/route-authorization.test.ts` follows this structure:

```ts
// 1. Top-level vi.mock calls (hoisted)
vi.mock("@/lib/auth.server", () => ({ getInternalUser: vi.fn() }));
vi.mock("@/services/some.server", () => ({ someFunction: vi.fn() }));

// 2. Import mocked functions AFTER vi.mock declarations
import { getInternalUser } from "@/lib/auth.server";

// 3. Inside describe blocks, set return values in beforeEach
beforeEach(() => {
  vi.mocked(getInternalUser).mockResolvedValue({ ...managerData });
});
```

---

## Task 1: Add `FORBIDDEN` to `HTTP_STATUS`

**Files:**
- Modify: `lib/http-status.ts`
- Modify: `tests/unit/lib/http-status.test.ts`

- [ ] **Step 1: Write the failing test**

  In `tests/unit/lib/http-status.test.ts`, add inside the existing `describe` block:

  ```ts
  it("should expose FORBIDDEN status code", () => {
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npx vitest run tests/unit/lib/http-status.test.ts
  ```

  Expected: FAIL — `HTTP_STATUS.FORBIDDEN` is `undefined`.

- [ ] **Step 3: Add `FORBIDDEN` to the constant map**

  In `lib/http-status.ts`, update the `HTTP_STATUS` object:

  ```ts
  export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  } as const;
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  npx vitest run tests/unit/lib/http-status.test.ts
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add lib/http-status.ts tests/unit/lib/http-status.test.ts
  git commit -m "feat: add FORBIDDEN (403) to HTTP_STATUS constants"
  ```

---

## Task 2: Create the route authorization test file (scaffold)

Before writing individual tests, create the test file with all top-level mocks in place. This avoids hoisting issues — all `vi.mock` calls live here from the start.

**Files:**
- Create: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Create the test file**

  Create `tests/security/route-authorization.test.ts` with the following content:

  ```ts
  /**
   * Route-Level Authorization Tests
   *
   * Tests that route handlers enforce correct HTTP status codes:
   * - 401 Unauthorized: request has no valid session
   * - 403 Forbidden: request is authenticated but role is insufficient
   */

  import { beforeEach, describe, expect, it, vi } from "vitest";
  import { createMockRequest, MOCK_PROFILES } from "./helpers/security-helpers";

  // ─── Top-level mocks (hoisted by Vitest before any imports) ───────────────

  vi.mock("@/lib/auth.server", () => ({
    getInternalUser: vi.fn(),
    INTERNAL_ROLES: ["owner", "manager", "staff"],
  }));

  // Service mocks — return safe defaults so handlers reach the auth check
  vi.mock("@/services/product.server", () => ({
    getCostPriceHistory: vi.fn().mockResolvedValue([]),
  }));

  vi.mock("@/services/customer.server", () => ({
    deleteCustomer: vi.fn().mockResolvedValue(true),
    getCustomerDetails: vi.fn().mockResolvedValue(null),
    updateCustomer: vi.fn().mockResolvedValue({}),
    getCustomers: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    createCustomer: vi.fn().mockResolvedValue({}),
  }));

  vi.mock("@/services/supplier-management.server", () => ({
    deleteSupplier: vi.fn().mockResolvedValue(undefined),
    getSupplierById: vi.fn().mockResolvedValue(null),
    updateSupplier: vi.fn().mockResolvedValue({}),
    getSuppliers: vi.fn().mockResolvedValue({ suppliers: [] }),
    getActiveSuppliers: vi.fn().mockResolvedValue([]),
    createSupplier: vi.fn().mockResolvedValue({}),
  }));

  vi.mock("@/services/finance.server", () => ({
    getExpenses: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    createExpense: vi.fn().mockResolvedValue({}),
    deleteExpense: vi.fn().mockResolvedValue(undefined),
    getFinancialStats: vi.fn().mockResolvedValue({}),
  }));

  vi.mock("@/services/analytics.server", () => ({
    getAnalyticsData: vi.fn().mockResolvedValue({}),
  }));

  vi.mock("@/db/db.server", () => ({
    db: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "variant-1" }]),
        }),
      }),
    },
  }));

  vi.mock("@/db/schema/products", () => ({
    productVariants: {},
    costPriceHistory: {},
  }));

  vi.mock("@/services/category.server", () => ({
    getCategories: vi.fn().mockResolvedValue([]),
    getFlatCategories: vi.fn().mockResolvedValue([]),
    createCategory: vi.fn().mockResolvedValue({}),
    generateCategorySlug: vi.fn().mockResolvedValue("slug"),
  }));

  vi.mock("@/services/dashboard.server", () => ({
    getDashboardStats: vi.fn().mockResolvedValue({}),
    getKPIStats: vi.fn().mockResolvedValue({}),
    getRecentOrders: vi.fn().mockResolvedValue([]),
    getTopProducts: vi.fn().mockResolvedValue([]),
  }));

  vi.mock("@/services/chat.server", () => ({
    getChatMessages: vi.fn().mockResolvedValue([]),
    getChatRooms: vi.fn().mockResolvedValue([]),
    markMessagesAsRead: vi.fn().mockResolvedValue(undefined),
  }));

  // ─── Import mocked functions after vi.mock declarations ───────────────────

  import { getInternalUser } from "@/lib/auth.server";

  // ─── Shared mock data ─────────────────────────────────────────────────────

  const managerInternalUser = {
    user: { id: MOCK_PROFILES.manager.id, username: "manager", role: "manager" },
    profile: { ...MOCK_PROFILES.manager } as any,
  };

  const staffInternalUser = {
    user: { id: MOCK_PROFILES.staff.id, username: "staff", role: "staff" },
    profile: { ...MOCK_PROFILES.staff } as any,
  };

  // Tests are added in subsequent tasks below
  ```

- [ ] **Step 2: Run to confirm file loads without errors**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: No test failures (0 tests collected, no errors).

- [ ] **Step 3: Commit**

  ```bash
  git add tests/security/route-authorization.test.ts
  git commit -m "test: scaffold route-authorization test file with top-level mocks"
  ```

---

## Task 3: Fix 1 — Add auth to cost-history endpoint

**Files:**
- Modify: `app/api/admin/products/variants/[variantId]/cost-history/route.ts`
- Modify: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Add the failing test to the test file**

  Append to `tests/security/route-authorization.test.ts` (before the end of the file):

  ```ts
  describe("GET /api/admin/products/variants/[variantId]/cost-history", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(null);

      const { GET } = await import(
        "@/app/api/admin/products/variants/[variantId]/cost-history/route"
      );
      const request = createMockRequest({ url: "http://localhost/api/admin/products/variants/v1/cost-history" });
      const response = await GET(request, { params: Promise.resolve({ variantId: "v1" }) });

      expect(response.status).toBe(401);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: FAIL — current route has no auth guard, returns 200.

- [ ] **Step 3: Update cost-history route**

  Replace the entire content of `app/api/admin/products/variants/[variantId]/cost-history/route.ts`:

  ```ts
  import { NextResponse } from "next/server";
  import { getInternalUser } from "@/lib/auth.server";
  import { HTTP_STATUS } from "@/lib/http-status";
  import { getCostPriceHistory } from "@/services/product.server";

  export async function GET(
    request: Request,
    { params }: { params: Promise<{ variantId: string }> },
  ) {
    const internalUser = await getInternalUser(request);
    if (!internalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const { variantId } = await params;
    const history = await getCostPriceHistory(variantId);
    return NextResponse.json({ history });
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/admin/products/variants/[variantId]/cost-history/route.ts tests/security/route-authorization.test.ts
  git commit -m "fix: require auth on cost-history endpoint"
  ```

---

## Task 4: Fix 2 — Replace hardcoded role strings in variants route

**Files:**
- Modify: `app/api/admin/products/[id]/variants/route.ts`
- Modify: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Add the failing test**

  Append to `tests/security/route-authorization.test.ts`:

  ```ts
  describe("POST /api/admin/products/[id]/variants", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(null);

      const { POST } = await import("@/app/api/admin/products/[id]/variants/route");
      const request = createMockRequest({ method: "POST", url: "http://localhost/api/admin/products/p1/variants" });
      const response = await POST(request, { params: Promise.resolve({ id: "p1" }) });

      expect(response.status).toBe(401);
    });

    it("returns 403 when authenticated as manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { POST } = await import("@/app/api/admin/products/[id]/variants/route");
      const request = createMockRequest({ method: "POST", url: "http://localhost/api/admin/products/p1/variants" });
      const response = await POST(request, { params: Promise.resolve({ id: "p1" }) });

      expect(response.status).toBe(403);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: FAIL — current code returns 401 for both cases (combined check, no 403).

- [ ] **Step 3: Update the variants route**

  In `app/api/admin/products/[id]/variants/route.ts`, update the imports and replace the combined auth check:

  ```ts
  // Full updated imports (top of file):
  import { NextResponse } from "next/server";
  import { db } from "@/db/db.server";
  import { costPriceHistory, productVariants } from "@/db/schema/products";
  import { getInternalUser } from "@/lib/auth.server";
  import { ROLE } from "@/lib/constants";
  import { HTTP_STATUS } from "@/lib/http-status";
  import type { IdRouteParams } from "@/types/api";
  ```

  Replace lines 9–12 (the combined auth check) with:

  ```ts
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/admin/products/[id]/variants/route.ts tests/security/route-authorization.test.ts
  git commit -m "fix: replace hardcoded role strings with ROLE.OWNER in variants route"
  ```

---

## Task 5: Fix 3 — Owner-only DELETE for customers and suppliers

**Files:**
- Modify: `app/api/admin/customers/[id]/route.ts`
- Modify: `app/api/admin/suppliers/[id]/route.ts`
- Modify: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Add the failing tests**

  Append to `tests/security/route-authorization.test.ts`:

  ```ts
  describe("DELETE /api/admin/customers/[id]", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/customers/c1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "c1" }) });

      expect(response.status).toBe(401);
    });

    it("returns 403 when authenticated as manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/customers/c1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "c1" }) });

      expect(response.status).toBe(403);
    });

    it("returns 403 when authenticated as staff", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(staffInternalUser);

      const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/customers/c1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "c1" }) });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/admin/suppliers/[id]", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns 401 when unauthenticated", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(null);

      const { DELETE } = await import("@/app/api/admin/suppliers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/suppliers/s1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

      expect(response.status).toBe(401);
    });

    it("returns 403 when authenticated as manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { DELETE } = await import("@/app/api/admin/suppliers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/suppliers/s1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

      expect(response.status).toBe(403);
    });

    it("returns 403 when authenticated as staff", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(staffInternalUser);

      const { DELETE } = await import("@/app/api/admin/suppliers/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/suppliers/s1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

      expect(response.status).toBe(403);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: FAIL — the manager tests return 200 (no role check on DELETE currently).

- [ ] **Step 3: Update `customers/[id]/route.ts`**

  Add `ROLE` to imports:

  ```ts
  import { ROLE } from "@/lib/constants";
  ```

  Replace the DELETE handler's auth block (currently lines 53–57):

  ```ts
  export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
    const user = await getInternalUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }
    if (user.profile.role !== ROLE.OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
    }

    try {
      const { id } = await params;
      const deleted = await deleteCustomer(id);
      if (!deleted) {
        return NextResponse.json({ error: "Customer not found" }, { status: HTTP_STATUS.NOT_FOUND });
      }
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete customer:", error);
      return NextResponse.json(
        { error: "Đã có lỗi xảy ra khi xóa khách hàng." },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }
  ```

- [ ] **Step 4: Update `suppliers/[id]/route.ts`**

  Add `ROLE` to imports:

  ```ts
  import { ROLE } from "@/lib/constants";
  ```

  Replace the DELETE handler's auth block (currently lines 62–66):

  ```ts
  export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
    const user = await getInternalUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }
    if (user.profile.role !== ROLE.OWNER) {
      return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
    }

    try {
      const { id } = await params;
      await deleteSupplier(id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete supplier:", error);
      return NextResponse.json(
        { success: false, error: "Đã có lỗi xảy ra khi xóa nhà cung cấp." },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }
  ```

- [ ] **Step 5: Run tests to verify they pass**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: PASS

- [ ] **Step 6: Commit**

  ```bash
  git add app/api/admin/customers/[id]/route.ts app/api/admin/suppliers/[id]/route.ts tests/security/route-authorization.test.ts
  git commit -m "fix: restrict customer and supplier DELETE to owner role"
  ```

---

## Task 6: Fix 4a — Thread `request` through auth-only routes

These five routes only need `getInternalUser(request)` — no role-check changes, no behavior difference in test environments (the test suite already mocks `getInternalUser` by return value, not by cookie store). **TDD is waived for this task** because the change is a consistency fix with no observable behavior difference in tests: `getInternalUser(request)` and `getInternalUser()` both return `null` in a test environment where the mock isn't configured. The fix matters at runtime where `getInternalUser()` without `request` falls back to Next.js server `cookies()`, which is unavailable in API route handlers.

**Files:**
- Modify: `app/api/admin/customers/route.ts`
- Modify: `app/api/admin/categories/route.ts`
- Modify: `app/api/admin/suppliers/route.ts`
- Modify: `app/api/admin/stats/route.ts`
- Modify: `app/api/admin/chat/route.ts`

- [ ] **Step 1: Update all five files — replace `getInternalUser()` with `getInternalUser(request)`**

  In each file, find every occurrence of `getInternalUser()` (no argument) and replace with `getInternalUser(request)`. The `request` parameter already exists in all five handler signatures — no signature changes needed.

  Files and their handlers:
  - `customers/route.ts`: GET handler (line 7), POST handler (line 31)
  - `categories/route.ts`: GET handler (line 11), POST handler (line 38)
  - `suppliers/route.ts`: GET handler (line 10), POST handler (line 40)
  - `stats/route.ts`: GET handler (line 11)
  - `chat/route.ts`: GET handler (line 6)

- [ ] **Step 2: Run full test suite to confirm no regressions**

  ```bash
  npx vitest run
  ```

  Expected: All tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add app/api/admin/customers/route.ts app/api/admin/categories/route.ts app/api/admin/suppliers/route.ts app/api/admin/stats/route.ts app/api/admin/chat/route.ts
  git commit -m "fix: pass request to getInternalUser in auth-only routes"
  ```

---

## Task 7: Fix 4b — Thread `request` + split 401/403 in owner-only routes

`expenses/route.ts`, `expenses/[id]/route.ts`, and `finance/route.ts` all collapse unauthenticated and wrong-role cases into a single `401`. Split them and pass `request`.

Note: All three files already import `ROLE` and `HTTP_STATUS` — no import changes needed.

**Files:**
- Modify: `app/api/admin/expenses/route.ts`
- Modify: `app/api/admin/expenses/[id]/route.ts`
- Modify: `app/api/admin/finance/route.ts`
- Modify: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Add the failing tests**

  Append to `tests/security/route-authorization.test.ts`:

  ```ts
  describe("Expenses and Finance 401/403 split", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("GET /expenses returns 403 for authenticated manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { GET } = await import("@/app/api/admin/expenses/route");
      const request = createMockRequest({ url: "http://localhost/api/admin/expenses" });
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("POST /expenses returns 403 for authenticated manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { POST } = await import("@/app/api/admin/expenses/route");
      const request = createMockRequest({ method: "POST", url: "http://localhost/api/admin/expenses", body: { amount: 100, date: new Date().toISOString(), type: "fixed" } });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it("DELETE /expenses/[id] returns 403 for authenticated manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { DELETE } = await import("@/app/api/admin/expenses/[id]/route");
      const request = createMockRequest({ method: "DELETE", url: "http://localhost/api/admin/expenses/e1" });
      const response = await DELETE(request, { params: Promise.resolve({ id: "e1" }) });

      expect(response.status).toBe(403);
    });

    it("GET /finance returns 403 for authenticated manager", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

      const { GET } = await import("@/app/api/admin/finance/route");
      const request = createMockRequest({ url: "http://localhost/api/admin/finance?month=1&year=2026" });
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: FAIL — all four currently return `401` for a manager because `getInternalUser()` without `request` returns `null` in tests (cookie store unavailable), so the combined `!user || role !== ROLE.OWNER` returns 401 via the null-user path. After the fix, the manager will be authenticated and hit the role-check path, returning 403.

- [ ] **Step 3: Update `app/api/admin/expenses/route.ts`**

  In the GET handler, replace the combined check:

  ```ts
  // Before (lines 9–16):
  const user = await getInternalUser();
  if (!user || user.profile.role !== ROLE.OWNER) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  ```

  ```ts
  // After:
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }
  ```

  Apply the same split to the POST handler (lines 52–59), replacing `getInternalUser()` with `getInternalUser(request)` and splitting the combined check.

- [ ] **Step 4: Update `app/api/admin/expenses/[id]/route.ts`**

  Replace lines 9–13:

  ```ts
  // After:
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }
  ```

- [ ] **Step 5: Update `app/api/admin/finance/route.ts`**

  Replace lines 8–12:

  ```ts
  // After:
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }
  ```

- [ ] **Step 6: Run tests to verify they pass**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: PASS

- [ ] **Step 7: Commit**

  ```bash
  git add app/api/admin/expenses/route.ts app/api/admin/expenses/[id]/route.ts app/api/admin/finance/route.ts tests/security/route-authorization.test.ts
  git commit -m "fix: split 401/403 and pass request in expenses and finance routes"
  ```

---

## Task 8: Fix 4c — Thread `request` + split 401/403 in analytics route

**Files:**
- Modify: `app/api/admin/analytics/route.ts`
- Modify: `tests/security/route-authorization.test.ts`

- [ ] **Step 1: Add the failing test**

  Append to `tests/security/route-authorization.test.ts`:

  ```ts
  describe("GET /api/admin/analytics", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns 403 (not 401) when authenticated as staff", async () => {
      vi.mocked(getInternalUser).mockResolvedValue(staffInternalUser);

      const { GET } = await import("@/app/api/admin/analytics/route");
      const request = createMockRequest({ url: "http://localhost/api/admin/analytics" });
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: FAIL — current code returns 401 for staff (combined check, no `request` arg so user is null).

- [ ] **Step 3: Update `app/api/admin/analytics/route.ts`**

  Replace the entire file:

  ```ts
  import { NextResponse } from "next/server";
  import { getInternalUser } from "@/lib/auth.server";
  import { ROLE } from "@/lib/constants";
  import { HTTP_STATUS } from "@/lib/http-status";
  import { getAnalyticsData } from "@/services/analytics.server";

  export async function GET(request: Request) {
    const internalUser = await getInternalUser(request);
    if (!internalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }
    if (![ROLE.OWNER, ROLE.MANAGER].includes(internalUser.profile.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
    }

    try {
      const data = await getAnalyticsData();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      return NextResponse.json(
        { error: "Đã có lỗi xảy ra khi tải dữ liệu báo cáo." },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  npx vitest run tests/security/route-authorization.test.ts
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add app/api/admin/analytics/route.ts tests/security/route-authorization.test.ts
  git commit -m "fix: split 401/403 and pass request in analytics route"
  ```

---

## Task 9: Fix 4d — Add `request` signature to profile route

The profile route handler is declared `async function GET()` with no parameter. Add `request: Request` to the signature and pass it to `getInternalUser`. No behavior change in tests — TDD waived for the same reasons as Task 6.

**Files:**
- Modify: `app/api/admin/profile/route.ts`

- [ ] **Step 1: Update `app/api/admin/profile/route.ts`**

  Replace the entire file:

  ```ts
  import { NextResponse } from "next/server";
  import { getInternalUser } from "@/lib/auth.server";
  import { HTTP_STATUS } from "@/lib/http-status";

  export async function GET(request: Request) {
    const result = await getInternalUser(request);

    if (!result) {
      return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    try {
      return NextResponse.json({ profile: result.profile });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return NextResponse.json(
        { error: "Đã có lỗi xảy ra khi tải thông tin cá nhân." },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  }
  ```

- [ ] **Step 2: Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: All tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add app/api/admin/profile/route.ts
  git commit -m "fix: add request parameter to profile route GET handler"
  ```

---

## Task 10: Final verification

- [ ] **Step 1: Run full test suite**

  ```bash
  npx vitest run
  ```

  Expected: All tests pass with no failures.

- [ ] **Step 2: TypeScript compilation check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: No errors.

- [ ] **Step 3: Verify no hardcoded role strings remain in auth checks**

  ```bash
  grep -rn 'includes("owner")\|includes("admin")\|=== "owner"\|=== "admin"\|=== "manager"\|=== "staff"' app/api/admin/ --include="*.ts"
  ```

  Expected: No matches — all role comparisons should use the `ROLE` enum.

- [ ] **Step 4: Verify all `getInternalUser` calls pass request**

  ```bash
  grep -rn "getInternalUser()" app/api/admin/ --include="*.ts"
  ```

  Expected: No matches — all calls should be `getInternalUser(request)`.
