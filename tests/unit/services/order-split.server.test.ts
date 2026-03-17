import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSplitOrders } from "@/services/order-split.server";
import type { DbTransaction } from "@/types/database";

// Mock dependencies
const mockTx = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  where: vi.fn(),
  from: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  set: vi.fn(),
  execute: vi.fn().mockResolvedValue({ rows: [] }),
};

describe("createSplitOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.select.mockReturnThis();
    mockTx.from.mockReturnThis();
    mockTx.where.mockResolvedValue([{ count: 0 }]); // For order number generation
    mockTx.insert.mockReturnThis();
    mockTx.values.mockReturnThis();
    mockTx.update.mockReturnThis();
    mockTx.set.mockReturnThis(); // Valid for update
  });

  it("should create parent order and sub-orders correctly", async () => {
    // Setup inputs
    const data = {
      customerId: "cust-1",
      items: [
        { variantId: "v1", quantity: 1 },
        { variantId: "v2", quantity: 1 },
      ],
      userId: "admin-1",
      deliveryPreference: "ship_available_first" as const,
    };

    const inStockItems = [{ variantId: "v1", quantity: 1 }];
    const preOrderItems = [{ variantId: "v2", quantity: 1 }];

    const variantMap = new Map();
    variantMap.set("v1", {
      id: "v1",
      name: "In Stock Item",
      price: 100,
      costPrice: 50,
      stockQuantity: 10,
      sku: "SKU1",
    });
    variantMap.set("v2", {
      id: "v2",
      name: "Backorder Item",
      price: 200,
      costPrice: 100,
      stockQuantity: 0,
      sku: "SKU2",
    });

    // Mock parent order creation
    mockTx.returning.mockResolvedValueOnce([
      { id: "parent-order-id", orderNumber: "ORD-TEST-001" },
    ]);

    // Mock sub-order creations (first call for in_stock, second for pre_order)
    // Note: returning() is called for each insert (parent, sub1, item1, hist1, sub2, item2, supp2, hist2)
    // We need to chain mockResolvedValueOnce carefully or just use a generic mock implementation if complex.
    // For simplicity, let's just spy on calls mostly.

    mockTx.returning
      .mockResolvedValueOnce([{ id: "parent-order-id", orderNumber: "ORD-TEST-001" }]) // Parent
      .mockResolvedValueOnce([{ id: "sub-order-1", orderNumber: "ORD-TEST-001-A" }]) // Sub 1
      .mockResolvedValueOnce([{ id: "item-1" }]) // Item 1
      .mockResolvedValueOnce([{ id: "sub-order-2", orderNumber: "ORD-TEST-001-B" }]) // Sub 2
      .mockResolvedValueOnce([{ id: "item-2" }]); // Item 2

    // Execute
    await createSplitOrders(
      mockTx as unknown as DbTransaction,
      data,
      inStockItems,
      preOrderItems,
      variantMap,
    );

    // Verify Parent Order Creation
    expect(mockTx.insert).toHaveBeenCalledTimes(8); // parent + sub1 + item1 + hist1 + sub2 + item2 + supp2 + hist2
    // Wait:
    // 1. Parent orders insert
    // 2. Sub1 orders insert
    // 3. Sub1 orderItems insert
    // 4. Sub1 history insert
    // 5. Sub2 orders insert
    // 6. Sub2 orderItems insert
    // 7. Sub2 supplierOrders insert
    // 8. Sub2 history insert
    // Total 8 inserts? Let's check logic.
    // supplierOrders uses `tx.insert(supplierOrders).values(...)` which might return?

    // Check Parent values
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "cust-1",
        status: "preparing",
        deliveryPreference: "ship_available_first",
      }),
    );

    // Check Sub-Order 1 (In Stock)
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        parentOrderId: "parent-order-id",
        splitType: "in_stock",
        status: "pending",
      }),
    );

    // Check Stock Deduction for In Stock Item
    expect(mockTx.update).toHaveBeenCalled(); // Should update productVariants
  });
});
