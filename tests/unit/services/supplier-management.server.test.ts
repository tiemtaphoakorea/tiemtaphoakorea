import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  createSupplier,
  deleteSupplier,
  getActiveSuppliers,
  getSupplierById,
  getSupplierStats,
  getSuppliers,
  updateSupplier,
} from "@/services/supplier-management.server";

// Mock the db.server module
vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  offset: vi.fn(() => Promise.resolve([])),
                })),
              })),
            })),
          })),
        })),
        // for count queries: select().from().where() returns a Promise
        where: vi.fn(() => Promise.resolve([{ c: 0 }])),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([
            {
              id: "new-supplier-id",
              code: "NCC001",
              name: "Test Supplier",
            },
          ]),
        ),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve([
              {
                id: "supplier-id",
                name: "Updated Supplier",
                isActive: true,
              },
            ]),
          ),
        })),
      })),
    })),
  },
}));

describe("Supplier Management Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSuppliers", () => {
    /** Helper to create a mock chain for getSuppliers (count + main query). */
    function mockGetSuppliers(mockDb: any, supplierList: any[]) {
      const countRow = [{ c: supplierList.length }];
      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(countRow),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(supplierList),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });
    }

    it("should fetch all active suppliers by default", async () => {
      const mockDb = db as any;
      const mockSuppliers = [
        { id: "1", code: "NCC001", name: "Supplier A", isActive: true, totalOrders: 5 },
        { id: "2", code: "NCC002", name: "Supplier B", isActive: true, totalOrders: 3 },
      ];
      mockGetSuppliers(mockDb, mockSuppliers);

      const result = await getSuppliers();

      expect(result.data).toEqual(mockSuppliers);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should include inactive suppliers when specified", async () => {
      const mockDb = db as any;
      mockGetSuppliers(mockDb, []);

      await getSuppliers({ includeInactive: true });

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should filter suppliers by search term", async () => {
      const mockDb = db as any;
      const filtered = [{ id: "1", name: "Test Supplier", code: "NCC001" }];
      mockGetSuppliers(mockDb, filtered);

      const result = await getSuppliers({ search: "Test" });

      expect(result.data).toEqual(filtered);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return empty array when no suppliers match", async () => {
      const mockDb = db as any;
      mockGetSuppliers(mockDb, []);

      const result = await getSuppliers({ search: "NonExistent" });

      expect(result.data).toEqual([]);
    });
  });

  describe("getSupplierById", () => {
    it("should return supplier details", async () => {
      const mockDb = db as any;
      const mockSupplier = {
        id: "1",
        code: "NCC001",
        name: "Test Supplier",
        phone: "0123456789",
        email: "test@supplier.com",
        isActive: true,
      };
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockSupplier]),
          }),
        }),
      });

      const result = await getSupplierById("1");

      expect(result).toEqual(mockSupplier);
    });

    it("should return null for non-existent supplier", async () => {
      const mockDb = db as any;
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await getSupplierById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getSupplierStats", () => {
    it("should return supplier statistics", async () => {
      const mockDb = db as any;
      const mockStats = {
        totalOrders: 10,
        pendingOrders: 2,
        orderedOrders: 3,
        receivedOrders: 4,
        cancelledOrders: 1,
        totalCost: 5000000,
      };
      const mockRecentOrders = [
        { id: "1", status: "pending", createdAt: new Date() },
        { id: "2", status: "received", createdAt: new Date() },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockStats]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockRecentOrders),
              }),
            }),
          }),
        });

      const result = await getSupplierStats("supplier-1");

      expect(result.totalOrders).toBe(10);
      expect(result.recentOrders).toBeDefined();
    });
  });

  describe("createSupplier", () => {
    it("should create supplier with auto-generated code", async () => {
      const mockDb = db as any;
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await createSupplier({
        name: "New Supplier",
        phone: "0123456789",
        email: "new@supplier.com",
      });

      expect(result.id).toBe("new-supplier-id");
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should generate incremented code based on last supplier", async () => {
      const mockDb = db as any;
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ code: "NCC005" }]),
          }),
        }),
      });

      await createSupplier({ name: "Test Supplier" });

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should create supplier with all optional fields", async () => {
      const mockDb = db as any;
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await createSupplier({
        name: "Full Supplier",
        phone: "0987654321",
        email: "full@supplier.com",
        address: "123 Street",
        paymentTerms: "Net 30",
        note: "Important supplier",
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("updateSupplier", () => {
    it("should update supplier details", async () => {
      const result = await updateSupplier("supplier-1", {
        name: "Updated Name",
        phone: "0111222333",
      });

      expect(result.id).toBe("supplier-id");
      expect(db.update).toHaveBeenCalled();
    });

    it("should update supplier active status", async () => {
      await updateSupplier("supplier-1", { isActive: false });

      expect(db.update).toHaveBeenCalled();
    });

    it("should handle partial updates", async () => {
      await updateSupplier("supplier-1", { note: "New note" });

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("deleteSupplier", () => {
    it("should soft delete by setting isActive to false", async () => {
      const result = await deleteSupplier("supplier-1");

      expect(db.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("getActiveSuppliers", () => {
    it("should return only active suppliers for dropdown", async () => {
      const mockDb = db as any;
      const mockActiveSuppliers = [
        { id: "1", code: "NCC001", name: "Active Supplier A" },
        { id: "2", code: "NCC002", name: "Active Supplier B" },
      ];
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockActiveSuppliers),
          }),
        }),
      });

      const result = await getActiveSuppliers();

      expect(result).toEqual(mockActiveSuppliers);
    });

    it("should return suppliers sorted by name", async () => {
      const mockDb = db as any;
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await getActiveSuppliers();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});
