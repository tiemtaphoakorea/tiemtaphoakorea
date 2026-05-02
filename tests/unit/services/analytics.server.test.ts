import {
  ANALYTICS_GROWTH_RANDOM_OFFSET,
  ANALYTICS_GROWTH_RANDOM_RANGE,
} from "@workspace/shared/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import { getAnalyticsData } from "@/services/analytics.server";

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

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock with chainable support
    const mockDb = db as any;
    mockDb.select.mockImplementation(() => {
      return createChainableMock([{ totalRevenue: 0, totalOrders: 0, count: 0 }]);
    });
  });

  describe("getAnalyticsData", () => {
    it("should return analytics data with all required fields", async () => {
      const result = await getAnalyticsData();

      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("totalOrders");
      expect(result).toHaveProperty("totalCustomers");
      expect(result).toHaveProperty("conversionRate");
      expect(result).toHaveProperty("monthlyRevenue");
      expect(result).toHaveProperty("categorySales");
      expect(result).toHaveProperty("topProducts");
    });

    it("should return default values when database returns empty", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => {
        return createChainableMock([]);
      });

      const result = await getAnalyticsData();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.totalCustomers).toBe(0);
    });

    it("should return mocked conversion rate", async () => {
      const result = await getAnalyticsData();

      expect(result.conversionRate).toBe(3.45);
    });

    it("should return arrays for monthly revenue", async () => {
      const result = await getAnalyticsData();

      expect(Array.isArray(result.monthlyRevenue)).toBe(true);
    });

    it("should return arrays for category sales", async () => {
      const result = await getAnalyticsData();

      expect(Array.isArray(result.categorySales)).toBe(true);
    });

    it("should return arrays for top products", async () => {
      const result = await getAnalyticsData();

      expect(Array.isArray(result.topProducts)).toBe(true);
    });

    it("should handle null values from database", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => {
        return createChainableMock([{ totalRevenue: null, totalOrders: null, count: null }]);
      });

      const result = await getAnalyticsData();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
    });

    it("should query database for KPIs", async () => {
      const mockDb = db as any;

      await getAnalyticsData();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should handle main query error and return defaults", async () => {
      const mockDb = db as any;
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Make first call throw
      mockDb.select.mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const result = await getAnalyticsData();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.monthlyRevenue).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Analytics query failed:", expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("should handle monthly revenue query error gracefully", async () => {
      const mockDb = db as any;
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        if (callCount === 3) {
          // Third call is monthly revenue (after kpiQuery and customerQuery)
          throw new Error("Monthly query failed");
        }
        return createChainableMock([{ totalRevenue: 1000, totalOrders: 10, count: 5 }]);
      });

      const result = await getAnalyticsData();

      // Should still return data for other fields
      expect(result.monthlyRevenue).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Monthly revenue query failed:", expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("should map category colors and product growth values", async () => {
      const mockDb = db as any;
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      mockDb.select
        .mockImplementationOnce(() => createChainableMock([{ totalRevenue: 1000, totalOrders: 5 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 2 }]))
        .mockImplementationOnce(() =>
          createChainableMock([{ month: "Tháng 01", revenue: 500, orderCount: 2 }]),
        )
        .mockImplementationOnce(() =>
          createChainableMock([{ category: "Electronics", sales: 10, revenue: 500 }]),
        )
        .mockImplementationOnce(() =>
          createChainableMock([{ name: "Product A", sales: 5, revenue: 200 }]),
        );

      const result = await getAnalyticsData();

      expect(result.categorySales[0].color).toBe("hsl(var(--chart-1))");
      expect(result.categorySales[0].revenue).toBe(500);
      expect(result.topProducts[0].growth).toBe(ANALYTICS_GROWTH_RANDOM_OFFSET);
      expect(result.topProducts[0].growth).toBeLessThanOrEqual(
        ANALYTICS_GROWTH_RANDOM_OFFSET + ANALYTICS_GROWTH_RANDOM_RANGE,
      );

      randomSpy.mockRestore();
    });

    it("should handle null month values in monthly revenue", async () => {
      const mockDb = db as any;
      mockDb.select
        .mockImplementationOnce(() => createChainableMock([{ totalRevenue: 1000, totalOrders: 5 }]))
        .mockImplementationOnce(() => createChainableMock([{ count: 2 }]))
        .mockImplementationOnce(() =>
          createChainableMock([{ month: null, revenue: null, orderCount: null }]),
        )
        .mockImplementationOnce(() => createChainableMock([]))
        .mockImplementationOnce(() => createChainableMock([]));

      const result = await getAnalyticsData();
      expect(result.monthlyRevenue[0].month).toBe("N/A");
      expect(result.monthlyRevenue[0].revenue).toBe(0);
      expect(result.monthlyRevenue[0].orders).toBe(0);
    });
  });
});
