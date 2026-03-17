import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  getDashboardStats,
  getKPIStats,
  getRecentActivities,
  getRecentOrders,
  getRecentPayments,
  getTopProducts,
} from "@/services/dashboard.server";

// Create a self-referential chainable mock
function createChainableMock(defaultValue: any = []): any {
  const chainable: any = {};
  const methods = ["from", "where", "innerJoin", "leftJoin", "groupBy", "orderBy", "limit", "and"];

  methods.forEach((method) => {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  });

  // Make it thenable for await
  // biome-ignore lint/suspicious/noThenProperty: Intentionally making chainable mock thenable for async tests
  chainable.then = (resolve: any) => resolve(defaultValue);

  return chainable;
}

// Mock the db.server module
vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock with chainable support
    const mockDb = db as any;
    mockDb.select.mockImplementation(() => {
      return createChainableMock([{ total: 0, count: 0 }]);
    });
  });

  describe("getDashboardStats", () => {
    it("should return all dashboard statistics", async () => {
      const result = await getDashboardStats();

      expect(result).toHaveProperty("todayRevenue");
      expect(result).toHaveProperty("todayOrdersCount");
      expect(result).toHaveProperty("todayCustomersCount");
      expect(result).toHaveProperty("pendingOrdersCount");
      expect(result).toHaveProperty("outOfStockCount");
      expect(result).toHaveProperty("lowStockCount");
      expect(result).toHaveProperty("recentOrders");
      expect(result).toHaveProperty("topProducts");
      expect(result).toHaveProperty("recentActivities");
      expect(result).toHaveProperty("recentPayments");
    });

    it("should return 0 for todayRevenue when no orders", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => {
        return createChainableMock([{ total: null, count: 0 }]);
      });

      const result = await getDashboardStats();

      expect(result.todayRevenue).toBe(0);
    });

    it("should handle default values for all stats", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => {
        return createChainableMock([{}]);
      });

      const result = await getDashboardStats();

      expect(result.todayRevenue).toBe(0);
      expect(result.todayOrdersCount).toBe(0);
      expect(result.pendingOrdersCount).toBe(0);
    });

    it("should return arrays for list data", async () => {
      const result = await getDashboardStats();

      expect(Array.isArray(result.recentOrders)).toBe(true);
      expect(Array.isArray(result.topProducts)).toBe(true);
      expect(Array.isArray(result.recentActivities)).toBe(true);
      expect(Array.isArray(result.recentPayments)).toBe(true);
    });

    it("should query database for revenue data", async () => {
      const mockDb = db as any;

      await getDashboardStats();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle stock counts correctly", async () => {
      const result = await getDashboardStats();

      expect(typeof result.outOfStockCount).toBe("number");
      expect(typeof result.lowStockCount).toBe("number");
    });
  });

  describe("getKPIStats", () => {
    it("should return KPI stats with proper defaults", async () => {
      const mockDb = db as any;
      mockDb.select
        .mockImplementationOnce(() => createChainableMock([{ total: 1000 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 2 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 1 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 3 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 4 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 5 }]));

      const result = await getKPIStats();

      expect(result.todayRevenue).toBe(1000);
      expect(result.todayOrdersCount).toBe(2);
      expect(result.todayCustomersCount).toBe(1);
      expect(result.pendingOrdersCount).toBe(3);
      expect(result.outOfStockCount).toBe(4);
      expect(result.lowStockCount).toBe(5);
    });
  });

  describe("getRecentOrders", () => {
    it("should return recent orders list", async () => {
      const mockDb = db as any;
      const mockOrders = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          total: "100000",
          status: "pending",
          createdAt: new Date(),
          customerName: "John Doe",
        },
      ];
      mockDb.select.mockImplementationOnce(() => createChainableMock(mockOrders));

      const result = await getRecentOrders(5);
      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe("ORD-001");
    });
  });

  describe("getTopProducts", () => {
    it("should return top products list", async () => {
      const mockDb = db as any;
      const mockProducts = [{ id: "prod-1", name: "Product A", totalQuantity: 10 }];
      mockDb.select.mockImplementationOnce(() => createChainableMock(mockProducts));

      const result = await getTopProducts(5);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Product A");
    });
  });

  describe("getRecentActivities", () => {
    it("should return recent activities list", async () => {
      const mockDb = db as any;
      const mockActivities = [
        {
          id: "act-1",
          orderNumber: "ORD-001",
          status: "paid",
          note: "Payment received",
          createdAt: new Date(),
          creatorName: "Admin",
        },
      ];
      mockDb.select.mockImplementationOnce(() => createChainableMock(mockActivities));

      const result = await getRecentActivities(5);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("paid");
    });
  });

  describe("getRecentPayments", () => {
    it("should return recent payments list", async () => {
      const mockDb = db as any;
      const mockPayments = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          total: "100000",
          paidAt: new Date(),
          customerName: "John Doe",
        },
      ];
      mockDb.select.mockImplementationOnce(() => createChainableMock(mockPayments));

      const result = await getRecentPayments(5);
      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe("ORD-001");
    });
  });
});
