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

describe("GET /api/admin/products/variants/[variantId]/cost-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);

    const { GET } = await import(
      "@/app/api/admin/products/variants/[variantId]/cost-history/route"
    );
    const request = createMockRequest({
      url: "http://localhost/api/admin/products/variants/v1/cost-history",
    });
    const response = await GET(request, { params: Promise.resolve({ variantId: "v1" }) });

    expect(response.status).toBe(401);
  });
});

describe("POST /api/admin/products/[id]/variants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);

    const { POST } = await import("@/app/api/admin/products/[id]/variants/route");
    const request = createMockRequest({
      method: "POST",
      url: "http://localhost/api/admin/products/p1/variants",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "p1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated as manager", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

    const { POST } = await import("@/app/api/admin/products/[id]/variants/route");
    const request = createMockRequest({
      method: "POST",
      url: "http://localhost/api/admin/products/p1/variants",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "p1" }) });

    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/admin/customers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/customers/c1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "c1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated as manager", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

    const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/customers/c1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "c1" }) });

    expect(response.status).toBe(403);
  });

  it("returns 403 when authenticated as staff", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(staffInternalUser);

    const { DELETE } = await import("@/app/api/admin/customers/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/customers/c1",
    });
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
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/suppliers/s1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 403 when authenticated as manager", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

    const { DELETE } = await import("@/app/api/admin/suppliers/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/suppliers/s1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

    expect(response.status).toBe(403);
  });

  it("returns 403 when authenticated as staff", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(staffInternalUser);

    const { DELETE } = await import("@/app/api/admin/suppliers/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/suppliers/s1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "s1" }) });

    expect(response.status).toBe(403);
  });
});

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
    const request = createMockRequest({
      method: "POST",
      url: "http://localhost/api/admin/expenses",
      body: { amount: 100, date: new Date().toISOString(), type: "fixed" },
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it("DELETE /expenses/[id] returns 403 for authenticated manager", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

    const { DELETE } = await import("@/app/api/admin/expenses/[id]/route");
    const request = createMockRequest({
      method: "DELETE",
      url: "http://localhost/api/admin/expenses/e1",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "e1" }) });

    expect(response.status).toBe(403);
  });

  it("GET /finance returns 403 for authenticated manager", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(managerInternalUser);

    const { GET } = await import("@/app/api/admin/finance/route");
    const request = createMockRequest({
      url: "http://localhost/api/admin/finance?month=1&year=2026",
    });
    const response = await GET(request);

    expect(response.status).toBe(403);
  });
});

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
