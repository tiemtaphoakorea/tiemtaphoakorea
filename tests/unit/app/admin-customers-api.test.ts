import { BusinessError } from "@workspace/shared/http-status";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInternalUser, requireRole } = vi.hoisted(() => ({
  getInternalUser: vi.fn(),
  requireRole: vi.fn(),
}));

const customerService = vi.hoisted(() => ({
  createCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  getCustomerDetails: vi.fn(),
  getCustomers: vi.fn(),
  updateCustomer: vi.fn(),
}));

vi.mock("@workspace/database/lib/auth", () => ({
  getInternalUser,
  requireRole,
}));

vi.mock("@workspace/database/services/customer.server", () => customerService);
vi.mock("@/services/customer.server", () => customerService);

const mockUser = {
  user: { id: "u1", username: "admin", role: "owner" },
  profile: { id: "u1", role: "owner", isActive: true },
};

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/customers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    getInternalUser.mockResolvedValue(null);
    const { GET } = await import("../../../apps/admin/app/api/admin/customers/route");

    const res = await GET(makeRequest("GET", "http://localhost/api/admin/customers"));

    expect(res.status).toBe(401);
  });

  it("passes search, status, customer type, and pagination to the service", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    customerService.getCustomers.mockResolvedValue({
      data: [],
      metadata: { total: 0, page: 2, limit: 25, totalPages: 0 },
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/customers/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/customers?search=0900000001&status=active&customerType=retail&page=2&limit=25",
      ),
    );

    expect(res.status).toBe(200);
    expect(customerService.getCustomers).toHaveBeenCalledWith({
      search: "0900000001",
      status: "active",
      customerType: "retail",
      page: 2,
      limit: 25,
    });
  });
});

describe("POST /api/admin/customers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a customer with the submitted form fields", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    const payload = {
      fullName: "Nguyen Van A",
      phone: "0900000001",
      address: "123 Le Loi",
      customerType: "retail",
    };
    customerService.createCustomer.mockResolvedValue({ profile: { id: "customer-1" } });
    const { POST } = await import("../../../apps/admin/app/api/admin/customers/route");

    const res = await POST(makeRequest("POST", "http://localhost/api/admin/customers", payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(customerService.createCustomer).toHaveBeenCalledWith(payload);
  });

  it("returns 409 for duplicate customer phone numbers", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    customerService.createCustomer.mockRejectedValue(
      new BusinessError("Số điện thoại đã tồn tại."),
    );
    const { POST } = await import("../../../apps/admin/app/api/admin/customers/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/customers", {
        fullName: "Duplicate",
        phone: "0900000001",
        customerType: "retail",
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ success: false, error: "Số điện thoại đã tồn tại." });
  });
});

describe("PUT /api/admin/customers/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("drops blank string fields before updating saved customer data", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    customerService.updateCustomer.mockResolvedValue({
      id: "customer-1",
      fullName: "Nguyen Van B",
    });
    const { PUT } = await import("../../../apps/admin/app/api/admin/customers/[id]/route");

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/admin/customers/customer-1", {
        fullName: "Nguyen Van B",
        phone: "   ",
        address: "",
        customerType: "wholesale",
      }),
      { params: Promise.resolve({ id: "customer-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(customerService.updateCustomer).toHaveBeenCalledWith("customer-1", {
      fullName: "Nguyen Van B",
      customerType: "wholesale",
    });
  });

  it("returns 409 when the updated phone duplicates another customer", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    customerService.updateCustomer.mockRejectedValue(
      new BusinessError("Số điện thoại đã tồn tại."),
    );
    const { PUT } = await import("../../../apps/admin/app/api/admin/customers/[id]/route");

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/admin/customers/customer-1", {
        phone: "0900000001",
      }),
      { params: Promise.resolve({ id: "customer-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ success: false, error: "Số điện thoại đã tồn tại." });
  });
});

describe("GET /api/admin/customers/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns customer detail data when authenticated", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    customerService.getCustomerDetails.mockResolvedValue({
      id: "customer-1",
      fullName: "Nguyen Van A",
      orders: [],
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/customers/[id]/route");

    const res = await GET(makeRequest("GET", "http://localhost/api/admin/customers/customer-1"), {
      params: Promise.resolve({ id: "customer-1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.customer.fullName).toBe("Nguyen Van A");
    expect(customerService.getCustomerDetails).toHaveBeenCalledWith("customer-1");
  });
});

describe("PATCH /api/admin/customers/[id]/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates customer active state when the payload is valid", async () => {
    requireRole.mockResolvedValue(mockUser);
    customerService.updateCustomer.mockResolvedValue({ id: "customer-1", isActive: false });
    const { PATCH } = await import("../../../apps/admin/app/api/admin/customers/[id]/status/route");

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/admin/customers/customer-1/status", {
        isActive: false,
      }),
      { params: Promise.resolve({ id: "customer-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(customerService.updateCustomer).toHaveBeenCalledWith("customer-1", {
      isActive: false,
    });
  });

  it("rejects non-boolean active state changes", async () => {
    requireRole.mockResolvedValue(mockUser);
    const { PATCH } = await import("../../../apps/admin/app/api/admin/customers/[id]/status/route");

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/admin/customers/customer-1/status", {
        isActive: "false",
      }),
      { params: Promise.resolve({ id: "customer-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("isActive must be a boolean");
    expect(customerService.updateCustomer).not.toHaveBeenCalled();
  });
});
