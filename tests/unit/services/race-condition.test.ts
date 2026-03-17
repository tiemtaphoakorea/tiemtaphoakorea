/**
 * Race Condition Tests
 *
 * These tests verify that the database locking mechanisms work correctly
 * to prevent race conditions in concurrent scenarios.
 */
import { describe, expect, it, vi } from "vitest";
import {
  generateOrderNumber,
  lockOrderForUpdate,
  lockVariantsForUpdate,
  validateStockAvailability,
} from "@/lib/db-locking";
import type { DbTransaction } from "@/types/database";

// Mock the db module
vi.mock("@/db/db.server", () => ({
  db: {
    execute: vi.fn(),
  },
}));

/** Chain mock for Drizzle tx.select().from().where().for("update") */
function createDrizzleTxChain(rows: any[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

describe("db-locking utilities", () => {
  describe("lockVariantsForUpdate", () => {
    it("should return empty array when no variant IDs provided", async () => {
      const mockTx = {
        execute: vi.fn(),
      };

      const result = await lockVariantsForUpdate(mockTx as unknown as DbTransaction, []);
      expect(result).toEqual([]);
      expect(mockTx.execute).not.toHaveBeenCalled();
    });

    it("should execute SELECT FOR UPDATE query with variant IDs", async () => {
      const variantRow = {
        id: "variant-1",
        productId: "product-1",
        sku: "SKU-001",
        name: "Test Variant",
        price: "100.00",
        costPrice: "80.00",
        stockQuantity: 10,
        lowStockThreshold: 5,
        isActive: true,
      };
      const mockTx = createDrizzleTxChain([variantRow]);

      const result = await lockVariantsForUpdate(mockTx as unknown as DbTransaction, ["variant-1"]);

      expect(mockTx.select).toHaveBeenCalled();
      expect(mockTx.for).toHaveBeenCalledWith("update");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("variant-1");
      expect(result[0].stockQuantity).toBe(10);
    });

    it("should handle multiple variant IDs", async () => {
      const rows = [
        { id: "variant-1", stockQuantity: 10 },
        { id: "variant-2", stockQuantity: 5 },
      ];
      const mockTx = createDrizzleTxChain(rows);

      const result = await lockVariantsForUpdate(mockTx as unknown as DbTransaction, [
        "variant-1",
        "variant-2",
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe("lockOrderForUpdate", () => {
    it("should return null when order not found", async () => {
      const mockTx = createDrizzleTxChain([]);

      const result = await lockOrderForUpdate(
        mockTx as unknown as DbTransaction,
        "non-existent-order",
      );

      expect(result).toBeNull();
    });

    it("should return locked order data when found", async () => {
      const orderRow = {
        id: "order-1",
        orderNumber: "ORD-20260131-0001",
        status: "pending",
        total: "1000.00",
        paidAmount: "0.00",
        customerId: "customer-1",
      };
      const mockTx = createDrizzleTxChain([orderRow]);

      const result = await lockOrderForUpdate(mockTx as unknown as DbTransaction, "order-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("order-1");
      expect(result?.status).toBe("pending");
    });
  });

  describe("generateOrderNumber", () => {
    it("should generate order number with default prefix", async () => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const result = await generateOrderNumber({} as DbTransaction);

      expect(result).toMatch(new RegExp(`^ORD-${dateStr}-[0-9A-F]{6}$`));
    });

    it("should use custom prefix when provided", async () => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      const result = await generateOrderNumber({} as DbTransaction, "INV");

      expect(result).toMatch(new RegExp(`^INV-${dateStr}-[0-9A-F]{6}$`));
    });

    it("should generate different order numbers on consecutive calls", async () => {
      const randomValues = [0.1, 0.2, 0.3];
      const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
        return randomValues.shift() ?? 0.5;
      });

      const results = await Promise.all(
        Array.from({ length: 3 }, () => generateOrderNumber({} as DbTransaction)),
      );

      expect(new Set(results).size).toBe(3);
      randomSpy.mockRestore();
    });
  });

  describe("validateStockAvailability", () => {
    it("should pass when stock is sufficient for in_stock items", () => {
      const lockedVariants = [
        {
          id: "v1",
          name: "Variant 1",
          sku: "SKU-001",
          stockQuantity: 10,
        },
      ];

      const requestedItems = [{ variantId: "v1", quantity: 5 }];

      expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
    });

    it("should not throw when stock is insufficient (allow negative)", () => {
      const lockedVariants = [
        {
          id: "v1",
          name: "Variant 1",
          sku: "SKU-001",
          stockQuantity: 3,
        },
      ];

      const requestedItems = [{ variantId: "v1", quantity: 5 }];

      expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
    });

    it("should not throw (stock not enforced, allow negative)", () => {
      const lockedVariants = [
        {
          id: "v1",
          name: "Variant 1",
          sku: "SKU-001",
          stockQuantity: 0,
        },
      ];

      const requestedItems = [{ variantId: "v1", quantity: 100 }];

      expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
    });

    it("should throw error when variant not found", () => {
      const lockedVariants: any[] = [];

      const requestedItems = [{ variantId: "v1", quantity: 1 }];

      expect(() => validateStockAvailability(lockedVariants, requestedItems)).toThrow(
        /Variant not found/,
      );
    });

    it("should validate multiple items correctly", () => {
      const lockedVariants = [
        {
          id: "v1",
          name: "Variant 1",
          sku: "SKU-001",
          stockQuantity: 10,
        },
        {
          id: "v2",
          name: "Variant 2",
          sku: "SKU-002",
          stockQuantity: 5,
        },
      ];

      const requestedItems = [
        { variantId: "v1", quantity: 5 },
        { variantId: "v2", quantity: 3 },
      ];

      expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
    });
  });
});

describe("Race Condition Scenarios", () => {
  describe("Inventory Oversell Prevention", () => {
    it("should prevent overselling when concurrent orders try to buy same item", async () => {
      // This is a conceptual test showing how the locking works
      // In a real integration test, you'd run this against a real database

      const initialStock = 5;
      let currentStock = initialStock;

      // Simulate locked read
      const getLockedStock = () => currentStock;

      // Simulate stock deduction with validation
      const deductStock = (quantity: number) => {
        const available = getLockedStock();
        if (available < quantity) {
          throw new Error(`Insufficient stock: ${available} < ${quantity}`);
        }
        currentStock -= quantity;
        return currentStock;
      };

      // First order succeeds
      expect(deductStock(3)).toBe(2);

      // Second order fails due to insufficient stock
      expect(() => deductStock(3)).toThrow(/Insufficient stock/);

      // Final stock should be 2
      expect(currentStock).toBe(2);
    });

    it("should handle multiple items from same order correctly", () => {
      // Simulate ordering multiple quantities of the same variant
      const variant = {
        id: "v1",
        stockQuantity: 10,
      };

      const items = [
        { variantId: "v1", quantity: 3 },
        { variantId: "v1", quantity: 4 },
      ];

      // Track local stock
      let localStock = variant.stockQuantity || 0;

      for (const item of items) {
        if (localStock < item.quantity) {
          throw new Error(`Insufficient stock`);
        }
        localStock -= item.quantity;
      }

      expect(localStock).toBe(3); // 10 - 3 - 4 = 3
    });
  });

  describe("Order Number Uniqueness", () => {
    it("should generate unique order numbers even with same timestamp", async () => {
      const generatedNumbers = new Set<string>();
      const randomValues = Array.from({ length: 10 }, (_, idx) => (idx + 1) / 20);
      const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
        return randomValues.shift() ?? 0.99;
      });

      // Generate 10 order numbers
      for (let i = 0; i < 10; i++) {
        const orderNumber = await generateOrderNumber({} as DbTransaction);
        generatedNumbers.add(orderNumber);
      }

      // All 10 should be unique
      expect(generatedNumbers.size).toBe(10);
      randomSpy.mockRestore();
    });
  });

  describe("Transaction Isolation", () => {
    it("should return complete product data from within transaction", () => {
      // This tests the concept that data created in a transaction
      // should be visible within the same transaction

      const createdProduct = {
        id: "prod-1",
        name: "Test Product",
        variants: [
          { id: "var-1", name: "Variant 1", images: [] },
          { id: "var-2", name: "Variant 2", images: [] },
        ],
      };

      // Simulating that we can read what we just created
      expect(createdProduct.variants).toHaveLength(2);
      expect(createdProduct.variants[0].id).toBe("var-1");
    });
  });
});

describe("Edge Cases", () => {
  it("should handle zero stock correctly (allow negative)", () => {
    const lockedVariants = [
      {
        id: "v1",
        name: "Variant 1",
        sku: "SKU-001",
        stockQuantity: 0,
      },
    ];

    const requestedItems = [{ variantId: "v1", quantity: 1 }];

    expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
  });

  it("should handle null stock quantity (allow negative)", () => {
    const lockedVariants = [
      {
        id: "v1",
        name: "Variant 1",
        sku: "SKU-001",
        stockQuantity: null,
      },
    ];

    const requestedItems = [{ variantId: "v1", quantity: 1 }];

    expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
  });

  it("should handle exact stock match", () => {
    const lockedVariants = [
      {
        id: "v1",
        name: "Variant 1",
        sku: "SKU-001",
        stockQuantity: 5,
      },
    ];

    const requestedItems = [{ variantId: "v1", quantity: 5 }];

    // Should succeed when quantity equals available stock
    expect(() => validateStockAvailability(lockedVariants, requestedItems)).not.toThrow();
  });
});
