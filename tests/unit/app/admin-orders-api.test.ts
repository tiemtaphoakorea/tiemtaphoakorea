import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInternalUser } = vi.hoisted(() => ({
  getInternalUser: vi.fn(),
}));

const orderService = vi.hoisted(() => ({
  cancelOrder: vi.fn(),
  completeOrder: vi.fn(),
  createOrder: vi.fn(),
  deleteOrder: vi.fn(),
  getOrderDetails: vi.fn(),
  getOrders: vi.fn(),
  recordPayment: vi.fn(),
  stockOut: vi.fn(),
  updateOrder: vi.fn(),
  updateOrderItems: vi.fn(),
}));

const idempotency = vi.hoisted(() => ({
  beginIdempotency: vi.fn(),
  beginOrderIdempotency: vi.fn(),
}));

vi.mock("@workspace/database/lib/auth", () => ({ getInternalUser }));
vi.mock("@workspace/database/services/order.server", () => orderService);
vi.mock("@/services/order.server", () => orderService);
vi.mock("@/lib/idempotency", () => ({ beginIdempotency: idempotency.beginIdempotency }));
vi.mock("@/lib/order-idempotency", () => ({
  beginOrderIdempotency: idempotency.beginOrderIdempotency,
}));

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

function idem() {
  return { finalize: vi.fn() };
}

describe("GET /api/admin/orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes search, valid statuses, debt, customer, and pagination filters", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    orderService.getOrders.mockResolvedValue({
      data: [],
      metadata: { total: 0, page: 2, limit: 25, totalPages: 0 },
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/orders/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/orders?search=0900000001&paymentStatus=paid&fulfillmentStatus=stock_out&debtOnly=true&customerId=customer-1&page=2&limit=25",
      ),
    );

    expect(res.status).toBe(200);
    expect(orderService.getOrders).toHaveBeenCalledWith({
      search: "0900000001",
      paymentStatus: "paid",
      fulfillmentStatus: "stock_out",
      debtOnly: true,
      customerId: "customer-1",
      page: 2,
      limit: 25,
    });
  });
});

describe("POST /api/admin/orders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects empty item lists", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginIdempotency.mockResolvedValue(idem());
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders", {
        customerId: "customer-1",
        items: [],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing items");
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it("normalizes create-order form fields before calling the service", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginIdempotency.mockResolvedValue(idem());
    orderService.createOrder.mockResolvedValue({ order: { id: "order-1" } });
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders", {
        customerName: "Nguyen Van A",
        customerPhone: " 0900000001 ",
        items: [{ variantId: "variant-1", quantity: "2", customPrice: "90000" }],
        shippingFee: "15000",
        deliveryPreference: "ship",
        clientToken: "token-1",
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(orderService.createOrder).toHaveBeenCalledWith({
      customerId: { name: "Nguyen Van A", phone: "0900000001" },
      items: [{ variantId: "variant-1", quantity: 2, customPrice: 90000 }],
      note: undefined,
      userId: "u1",
      deliveryPreference: "ship",
      shippingName: undefined,
      shippingPhone: undefined,
      shippingAddress: undefined,
      shippingFee: 15000,
      autoCreatePurchaseOrder: true,
    });
  });
});

describe("POST /api/admin/orders/[id]/payments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid payment amount before recording payment", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginIdempotency.mockResolvedValue(idem());
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/[id]/payments/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders/order-1/payments", {
        amount: 0,
        method: PAYMENT_METHOD.CASH,
      }),
      { params: Promise.resolve({ id: "order-1" }) },
    );

    expect(res.status).toBe(400);
    expect(orderService.recordPayment).not.toHaveBeenCalled();
  });

  it("records a valid payment with parsed amount and staff id", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginIdempotency.mockResolvedValue(idem());
    orderService.recordPayment.mockResolvedValue({ success: true });
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/[id]/payments/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders/order-1/payments", {
        amount: "100000",
        method: PAYMENT_METHOD.CASH,
        referenceCode: "REF-1",
        note: "paid",
      }),
      { params: Promise.resolve({ id: "order-1" }) },
    );

    expect(res.status).toBe(200);
    expect(orderService.recordPayment).toHaveBeenCalledWith({
      orderId: "order-1",
      amount: 100000,
      method: PAYMENT_METHOD.CASH,
      referenceCode: "REF-1",
      note: "paid",
      userId: "u1",
    });
  });
});

describe("order fulfillment action APIs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stocks out an order with idempotency and staff metadata", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginOrderIdempotency.mockResolvedValue(idem());
    orderService.stockOut.mockResolvedValue({ id: "order-1", fulfillmentStatus: "stock_out" });
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/[id]/stock-out/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders/order-1/stock-out", {
        note: "xuất kho",
        clientToken: "token-1",
      }),
      { params: Promise.resolve({ id: "order-1" }) },
    );

    expect(res.status).toBe(200);
    expect(idempotency.beginOrderIdempotency).toHaveBeenCalledWith({
      clientToken: "token-1",
      orderId: "order-1",
      action: "stock_out",
      payload: { note: "xuất kho" },
    });
    expect(orderService.stockOut).toHaveBeenCalledWith({
      orderId: "order-1",
      userId: "u1",
      note: "xuất kho",
    });
  });

  it("returns 400 for invalid complete transitions", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginOrderIdempotency.mockResolvedValue(idem());
    orderService.completeOrder.mockRejectedValue(new Error("Invalid transition: pending"));
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/[id]/complete/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders/order-1/complete", {}),
      { params: Promise.resolve({ id: "order-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid transition: pending");
  });

  it("returns 400 when cancelling after stock out", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    idempotency.beginOrderIdempotency.mockResolvedValue(idem());
    orderService.cancelOrder.mockRejectedValue(new Error("Cannot cancel after stock_out"));
    const { POST } = await import("../../../apps/admin/app/api/admin/orders/[id]/cancel/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/orders/order-1/cancel", {}),
      { params: Promise.resolve({ id: "order-1" }) },
    );

    expect(res.status).toBe(400);
  });
});
