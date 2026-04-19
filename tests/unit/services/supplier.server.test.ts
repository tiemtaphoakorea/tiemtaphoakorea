import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db/db.server";
import {
  createSupplierOrders,
  deleteSupplierOrder,
  getSupplierOrderDetails,
  getSupplierOrders,
  updateSupplierOrderStatus,
} from "@/services/supplier.server";

// Helper for chainable mock
function createChainableMock(defaultValue: any = []): any {
  const chainable: any = {};
  const methods = [
    "from",
    "where",
    "innerJoin",
    "leftJoin",
    "groupBy",
    "orderBy",
    "limit",
    "offset",
    "and",
    "returning",
    "values",
    "set",
    "select",
    "delete",
  ];
  methods.forEach((method) => {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  });

  // biome-ignore lint/suspicious/noThenProperty: Intentionally making chainable mock thenable for async tests
  chainable.then = (resolve: any) => resolve(defaultValue);
  chainable.map = (fn: any) => defaultValue.map(fn);
  return chainable;
}

// Mock DB with transaction support (Drizzle chain: select().from().where().limit() or .for())
const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  for: vi.fn(),
  query: {
    supplierOrders: {
      findFirst: vi.fn(),
    },
    productVariants: {
      findFirst: vi.fn(),
    },
  },
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/db/db.server", () => ({
  db: {
    transaction: vi.fn((callback) => callback(mockTx)),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("supplier.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.select.mockReturnValue(mockTx);
    mockTx.from.mockReturnValue(mockTx);
    mockTx.where.mockReturnValue(mockTx);
    mockTx.limit.mockResolvedValue([]); // default: no variant rows (select().from().where().limit(1))
    mockTx.query.supplierOrders.findFirst.mockReset();
    mockTx.query.productVariants.findFirst.mockReset();
    mockTx.update.mockReset().mockReturnThis();
    mockTx.returning.mockReset();
    mockTx.delete.mockReset();
  });

  describe("updateSupplierOrderStatus", () => {
    it("should update status and set orderedAt when status is ordered", async () => {
      mockTx.for.mockResolvedValue([{ id: "so-1", status: "pending", variantId: "var-1" }]);

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "so-1", status: "ordered" }]),
        }),
      });
      mockTx.update.mockReturnValue({ set: mockSet });

      await updateSupplierOrderStatus("so-1", "ordered");

      expect(db.transaction).toHaveBeenCalled();
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.status).toBe("ordered");
      expect(setCall.orderedAt).toBeInstanceOf(Date);
    });

    it("should update status and set receivedAt when status is received", async () => {
      mockTx.for.mockResolvedValue([{ id: "so-1", status: "ordered", variantId: "var-1" }]);

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "so-1", status: "received" }]),
        }),
      });
      mockTx.update.mockReturnValue({ set: mockSet });
      mockTx.limit.mockResolvedValueOnce([{ id: "var-1", onHand: 10 }]);

      await updateSupplierOrderStatus("so-1", "received");

      expect(db.transaction).toHaveBeenCalled();
      // First set: stock; second set: order status
      expect(mockSet).toHaveBeenCalledTimes(2);
      const orderSetCall = mockSet.mock.calls[1][0];
      expect(orderSetCall.status).toBe("received");
      expect(orderSetCall.receivedAt).toBeInstanceOf(Date);
    });

    it("should update additional fields if provided", async () => {
      mockTx.for.mockResolvedValue([{ id: "so-1", status: "pending", variantId: "var-1" }]);

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "so-1" }]),
        }),
      });
      mockTx.update.mockReturnValue({ set: mockSet });

      const date = new Date("2025-01-01");
      await updateSupplierOrderStatus("so-1", "pending", {
        note: "test note",
        actualCostPrice: "50000",
        expectedDate: date,
      });

      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.note).toBe("test note");
      expect(setCall.actualCostPrice).toBe("50000");
      expect(setCall.expectedDate).toBe(date);
    });

    it("should throw error when supplier order not found", async () => {
      mockTx.for.mockResolvedValue([]);

      await expect(updateSupplierOrderStatus("non-existent", "ordered")).rejects.toThrow(
        "Supplier order not found",
      );
    });

    it("should update stock for in_stock variant on received status", async () => {
      mockTx.for.mockResolvedValue([
        {
          id: "so-1",
          status: "ordered",
          quantity: 5,
          variantId: "var-1",
        },
      ]);

      mockTx.limit.mockResolvedValueOnce([{ id: "var-1", onHand: 10 }]);

      const mockSetStock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "var-1" }]),
      });
      const mockSetOrder = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "so-1", status: "received" }]),
        }),
      });

      let callCount = 0;
      mockTx.update.mockImplementation(() => ({
        set: callCount++ === 0 ? mockSetStock : mockSetOrder,
      }));

      await updateSupplierOrderStatus("so-1", "received");

      expect(mockTx.select).toHaveBeenCalled();
      expect(mockSetStock).toHaveBeenCalledWith(
        expect.objectContaining({
          onHand: 15, // 10 + 5
        }),
      );
    });
  });

  describe("getSupplierOrders", () => {
    it("should fetch all supplier orders without filters", async () => {
      const mockResults = [
        {
          id: "so-1",
          status: "pending",
          quantity: 5,
          createdAt: new Date(),
          orderedAt: null,
          receivedAt: null,
          expectedDate: null,
          actualCostPrice: null,
          note: null,
          productName: "Product A",
          variantName: "Size M",
          variantSku: "SKU-A-M",
        },
      ];

      const chainable = createChainableMock(mockResults);
      (db.select as any).mockReturnValue(chainable);

      const result = await getSupplierOrders();

      expect(db.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "so-1",
        status: "pending",
        quantity: 5,
        item: {
          productName: "Product A",
          variantName: "Size M",
          sku: "SKU-A-M",
        },
      });
    });

    it("should filter by search term", async () => {
      const chainable = createChainableMock([]);
      (db.select as any).mockReturnValue(chainable);

      await getSupplierOrders({ search: "SKU-123" });

      expect(chainable.where).toHaveBeenCalled();
    });

    it("should filter by status", async () => {
      const chainable = createChainableMock([]);
      (db.select as any).mockReturnValue(chainable);

      await getSupplierOrders({ status: "ordered" });

      expect(chainable.where).toHaveBeenCalled();
    });

    it("should return item from product/variant join", async () => {
      const mockResults = [
        {
          id: "so-2",
          status: "pending",
          quantity: 10,
          createdAt: new Date(),
          orderedAt: null,
          receivedAt: null,
          expectedDate: null,
          actualCostPrice: null,
          note: null,
          productName: "Product B",
          variantName: "Default",
          variantSku: "SKU-B",
        },
      ];

      const chainable = createChainableMock(mockResults);
      (db.select as any).mockReturnValue(chainable);

      const result = await getSupplierOrders();

      expect(result[0].item).toMatchObject({
        productName: "Product B",
        variantName: "Default",
        sku: "SKU-B",
      });
    });
  });

  describe("getSupplierOrderDetails", () => {
    it("should return supplier order details", async () => {
      const mockResult = [
        {
          id: "so-1",
          status: "pending",
          quantity: 5,
          createdAt: new Date(),
          orderedAt: null,
          receivedAt: null,
          expectedDate: null,
          actualCostPrice: null,
          note: "note",
          productName: "Product A",
          variantName: "Size M",
          variantSku: "SKU-A-M",
        },
      ];

      const chainable = createChainableMock(mockResult);
      (db.select as any).mockReturnValue(chainable);

      const result = await getSupplierOrderDetails("so-1");

      expect(result).toMatchObject({
        id: "so-1",
        status: "pending",
        quantity: 5,
        item: {
          productName: "Product A",
          variantName: "Size M",
          sku: "SKU-A-M",
        },
      });
    });

    it("should return null when supplier order not found", async () => {
      const chainable = createChainableMock([]);
      (db.select as any).mockReturnValue(chainable);

      const result = await getSupplierOrderDetails("missing");
      expect(result).toBeNull();
    });
  });

  describe("createSupplierOrders", () => {
    it("should create supplier orders from items", async () => {
      const mockReturned = [
        { id: "so-1", status: "pending" },
        { id: "so-2", status: "pending" },
      ];

      const _chainable = createChainableMock(mockReturned);
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockReturned),
        }),
      });

      const result = await createSupplierOrders({
        items: [
          { variantId: "var-1", quantity: 5 },
          { variantId: "var-2", quantity: 10, note: "urgent" },
        ],
        createdBy: "admin-1",
      });

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockReturned);
    });

    it("should include supplierId when provided", async () => {
      const mockReturned = [{ id: "so-1", status: "pending" }];

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(mockReturned),
      });
      (db.insert as any).mockReturnValue({ values: mockValues });

      await createSupplierOrders({
        items: [
          {
            variantId: "var-1",
            quantity: 3,
            expectedDate: new Date("2026-01-10"),
          },
        ],
        createdBy: "admin-1",
        supplierId: "supplier-1",
      });

      expect(mockValues).toHaveBeenCalledWith([
        expect.objectContaining({
          variantId: "var-1",
          quantity: 3,
          supplierId: "supplier-1",
          status: "pending",
        }),
      ]);
    });
  });

  describe("deleteSupplierOrder", () => {
    it("should delete cancelled supplier order successfully", async () => {
      const mockResult = [{ id: "so-1", status: "cancelled" }];
      const chainable = createChainableMock(mockResult);
      (db.select as any).mockReturnValue(chainable);

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      });

      const result = await deleteSupplierOrder("so-1");

      expect(result.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });

    it("should throw error when trying to delete pending supplier order", async () => {
      const mockResult = [{ id: "so-1", status: "pending" }];
      const chainable = createChainableMock(mockResult);
      (db.select as any).mockReturnValue(chainable);

      await expect(deleteSupplierOrder("so-1")).rejects.toThrow(
        "Only cancelled orders can be deleted",
      );
    });

    it("should throw error when supplier order not found", async () => {
      const chainable = createChainableMock([]);
      (db.select as any).mockReturnValue(chainable);

      await expect(deleteSupplierOrder("missing")).rejects.toThrow("Supplier order not found");
    });
  });
});
