import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInternalUser } = vi.hoisted(() => ({
  getInternalUser: vi.fn(),
}));

const inventoryService = vi.hoisted(() => ({
  adjustInventory: vi.fn(),
  getInventoryDailySummary: vi.fn(),
  getInventoryMovements: vi.fn(),
  getOpeningStock: vi.fn(),
  updateOpeningStock: vi.fn(),
}));

const purchaseService = vi.hoisted(() => ({
  confirmPurchaseOrder: vi.fn(),
  createPurchaseOrder: vi.fn(),
  listPurchaseOrders: vi.fn(),
}));

const receiptService = vi.hoisted(() => ({
  completeGoodsReceipt: vi.fn(),
  createGoodsReceipt: vi.fn(),
  listGoodsReceipts: vi.fn(),
}));

const actionIdempotency = vi.hoisted(() => ({
  beginActionIdempotency: vi.fn(),
}));

vi.mock("@workspace/database/lib/auth", () => ({ getInternalUser }));
vi.mock("@workspace/database/services/inventory.server", () => inventoryService);
vi.mock("@workspace/database/services/purchase-order.server", () => purchaseService);
vi.mock("@workspace/database/services/goods-receipt.server", () => receiptService);
vi.mock("@/services/inventory.server", () => inventoryService);
vi.mock("@/services/purchase-order.server", () => purchaseService);
vi.mock("@/services/goods-receipt.server", () => receiptService);
vi.mock("@/lib/action-idempotency", () => ({
  beginActionIdempotency: actionIdempotency.beginActionIdempotency,
}));

const ownerUser = {
  user: { id: "u1", username: "admin", role: "owner" },
  profile: { id: "u1", role: "owner", isActive: true },
};

const staffUser = {
  user: { id: "u2", username: "staff", role: "staff" },
  profile: { id: "u2", role: "staff", isActive: true },
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

describe("GET /api/admin/inventory/movements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes movement filters, valid type, dates, and pagination to the service", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    inventoryService.getInventoryMovements.mockResolvedValue({
      data: [],
      metadata: { total: 0, page: 2, limit: 50, totalPages: 0 },
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/inventory/movements/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/inventory/movements?variantId=variant-1&type=supplier_receipt&search=SKU-1&startDate=2026-05-01&endDate=2026-05-12&page=2&limit=50",
      ),
    );

    expect(res.status).toBe(200);
    expect(inventoryService.getInventoryMovements).toHaveBeenCalledWith({
      variantId: "variant-1",
      type: "supplier_receipt",
      search: "SKU-1",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-12"),
      page: 2,
      limit: 50,
    });
  });

  it("ignores invalid movement types and caps page size at 100", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    inventoryService.getInventoryMovements.mockResolvedValue({
      data: [],
      metadata: { total: 0, page: 1, limit: 100, totalPages: 0 },
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/inventory/movements/route");

    await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/inventory/movements?type=bad&page=-1&limit=999",
      ),
    );

    expect(inventoryService.getInventoryMovements).toHaveBeenCalledWith(
      expect.objectContaining({ type: undefined, page: 1, limit: 100 }),
    );
  });
});

describe("POST /api/admin/inventory/movements/adjust", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects zero quantity manual adjustments", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    const { POST } = await import(
      "../../../apps/admin/app/api/admin/inventory/movements/adjust/route"
    );

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/inventory/movements/adjust", {
        variantId: "variant-1",
        quantity: 0,
      }),
    );

    expect(res.status).toBe(400);
    expect(inventoryService.adjustInventory).not.toHaveBeenCalled();
  });

  it("creates a manual inventory adjustment with the current staff id", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    inventoryService.adjustInventory.mockResolvedValue({ id: "movement-1" });
    const { POST } = await import(
      "../../../apps/admin/app/api/admin/inventory/movements/adjust/route"
    );

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/inventory/movements/adjust", {
        variantId: "variant-1",
        quantity: 5,
        note: "kiểm kho",
      }),
    );

    expect(res.status).toBe(201);
    expect(inventoryService.adjustInventory).toHaveBeenCalledWith({
      variantId: "variant-1",
      quantity: 5,
      note: "kiểm kho",
      userId: "u1",
    });
  });
});

describe("PATCH /api/admin/inventory/opening-stock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forbids non-manager users from changing opening stock", async () => {
    getInternalUser.mockResolvedValue(staffUser);
    const { PATCH } = await import(
      "../../../apps/admin/app/api/admin/inventory/opening-stock/route"
    );

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/admin/inventory/opening-stock", {
        variantId: "variant-1",
        newQuantity: 10,
      }),
    );

    expect(res.status).toBe(403);
    expect(inventoryService.updateOpeningStock).not.toHaveBeenCalled();
  });

  it("updates opening stock for owner or manager with validated quantity", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    inventoryService.updateOpeningStock.mockResolvedValue({ newOnHand: 10 });
    const { PATCH } = await import(
      "../../../apps/admin/app/api/admin/inventory/opening-stock/route"
    );

    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/admin/inventory/opening-stock", {
        variantId: "variant-1",
        newQuantity: 10,
      }),
    );

    expect(res.status).toBe(200);
    expect(inventoryService.updateOpeningStock).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: "variant-1",
        newQuantity: 10,
        userId: "u1",
      }),
    );
  });
});

describe("purchase and receipt APIs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters purchase orders by search, status, supplier, and pagination", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    purchaseService.listPurchaseOrders.mockResolvedValue({ data: [], metadata: {} });
    const { GET } = await import("../../../apps/admin/app/api/admin/purchases/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/purchases?search=PO-1&status=confirmed&supplierId=supplier-1&page=2&limit=30",
      ),
    );

    expect(res.status).toBe(200);
    expect(purchaseService.listPurchaseOrders).toHaveBeenCalledWith({
      search: "PO-1",
      status: "confirmed",
      supplierId: "supplier-1",
      page: 2,
      limit: 30,
    });
  });

  it("rejects purchase orders without items", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    const { POST } = await import("../../../apps/admin/app/api/admin/purchases/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/purchases", {
        supplierId: "supplier-1",
        items: [],
      }),
    );

    expect(res.status).toBe(400);
    expect(purchaseService.createPurchaseOrder).not.toHaveBeenCalled();
  });

  it("confirms purchase orders only for allowed roles", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    actionIdempotency.beginActionIdempotency.mockResolvedValue(idem());
    purchaseService.confirmPurchaseOrder.mockResolvedValue({ id: "purchase-1" });
    const { POST } = await import("../../../apps/admin/app/api/admin/purchases/[id]/confirm/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/purchases/purchase-1/confirm", {
        clientToken: "token-1",
      }),
      { params: Promise.resolve({ id: "purchase-1" }) },
    );

    expect(res.status).toBe(200);
    expect(purchaseService.confirmPurchaseOrder).toHaveBeenCalledWith("purchase-1", "u1");
  });

  it("filters goods receipts by search, status, payment status, supplier, and pagination", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    receiptService.listGoodsReceipts.mockResolvedValue({ data: [], metadata: {} });
    const { GET } = await import("../../../apps/admin/app/api/admin/receipts/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/receipts?search=GR-1&status=completed&paymentStatus=paid&supplierId=supplier-1&page=2&limit=30",
      ),
    );

    expect(res.status).toBe(200);
    expect(receiptService.listGoodsReceipts).toHaveBeenCalledWith({
      search: "GR-1",
      status: "completed",
      paymentStatus: "paid",
      supplierId: "supplier-1",
      page: 2,
      limit: 30,
    });
  });

  it("completes a goods receipt with idempotency and staff metadata", async () => {
    getInternalUser.mockResolvedValue(ownerUser);
    actionIdempotency.beginActionIdempotency.mockResolvedValue(idem());
    receiptService.completeGoodsReceipt.mockResolvedValue({ id: "receipt-1" });
    const { POST } = await import("../../../apps/admin/app/api/admin/receipts/[id]/complete/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/receipts/receipt-1/complete", {
        clientToken: "token-1",
      }),
      { params: Promise.resolve({ id: "receipt-1" }) },
    );

    expect(res.status).toBe(200);
    expect(receiptService.completeGoodsReceipt).toHaveBeenCalledWith("receipt-1", "u1");
  });
});
