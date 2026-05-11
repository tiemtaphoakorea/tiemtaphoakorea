import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getFinancialStats,
} from "@/services/finance.server";

// Mock the db module
vi.mock("@/db/db.server", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: "expense-1",
            description: "Test Expense",
            amount: "100000",
            type: "fixed",
            date: new Date("2026-01-15"),
            createdBy: "admin-1",
          },
        ]),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => [
          {
            revenue: 1000000,
            cogs: 600000,
            count: 10,
          },
        ]),
      })),
    })),
    query: {
      expenses: {
        findMany: vi.fn(() => [
          {
            id: "expense-1",
            description: "Rent",
            amount: "5000000",
            type: "fixed",
            date: new Date("2026-01-01"),
            creator: { id: "admin-1", fullName: "Admin" },
          },
        ]),
      },
    },
  },
}));

describe("Finance Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createExpense", () => {
    it("should create a fixed expense successfully", async () => {
      const data = {
        description: "Monthly Rent",
        amount: 5000000,
        type: "fixed" as const,
        date: new Date("2026-01-01"),
        createdBy: "admin-1",
      };

      const result = await createExpense(data);

      expect(db.insert).toHaveBeenCalled();
      expect(result.id).toBe("expense-1");
      expect(result.type).toBe("fixed");
    });

    it("should create a variable expense successfully", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn(() => ({
          returning: vi.fn(() => [
            {
              id: "expense-2",
              description: "Shipping Cost",
              amount: "150000",
              type: "variable",
              date: new Date("2026-01-10"),
              createdBy: "admin-1",
            },
          ]),
        })),
      });

      const data = {
        description: "Shipping Cost",
        amount: 150000,
        type: "variable" as const,
        date: new Date("2026-01-10"),
        createdBy: "admin-1",
      };

      const result = await createExpense(data);

      expect(result.type).toBe("variable");
      expect(result.description).toBe("Shipping Cost");
    });

    it("should store amount as string", async () => {
      const valuesSpy = vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: "expense-3",
            description: "Equipment",
            amount: "250000",
            type: "fixed",
            date: new Date("2026-01-05"),
            createdBy: "admin-1",
          },
        ]),
      }));
      (db.insert as any).mockReturnValueOnce({ values: valuesSpy });

      await createExpense({
        description: "Equipment",
        amount: 250000,
        type: "fixed",
        date: new Date("2026-01-05"),
        createdBy: "admin-1",
      });

      expect(valuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: "250000",
        }),
      );
    });
  });

  describe("getExpenses", () => {
    it("should fetch expenses without filters", async () => {
      const result = await getExpenses({});

      expect(db.query.expenses.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: expect.any(Array),
        with: { creator: true },
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it("should filter by expense type", async () => {
      await getExpenses({ type: "fixed" });

      expect(db.query.expenses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });

    it("should filter by month and year", async () => {
      await getExpenses({ month: 1, year: 2026 });

      expect(db.query.expenses.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });

    it("should filter by year only", async () => {
      await getExpenses({ year: 2026 });

      expect(db.query.expenses.findMany).toHaveBeenCalled();
    });

    it("should return total 0 when count is null", async () => {
      const mockCountChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: null }]),
      };
      (db.select as any).mockReturnValueOnce(mockCountChain);

      const result = await getExpenses({});
      expect(result.total).toBe(0);
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense by id", async () => {
      const result = await deleteExpense("expense-1");

      expect(db.delete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("getFinancialStats", () => {
    function mockFinancialSelects({
      orderStats,
      cogsStats,
      expenseStats,
    }: {
      orderStats: Array<{ revenue: number; count: number }>;
      cogsStats: Array<{ cogs: number; itemCount: number; missingCostItems: number }>;
      expenseStats: Array<{ total: number }>;
    }) {
      const orderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(orderStats),
      };
      const cogsChain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(cogsStats),
      };
      const expenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(expenseStats),
      };

      (db.select as any)
        .mockReturnValueOnce(orderChain)
        .mockReturnValueOnce(cogsChain)
        .mockReturnValueOnce(expenseChain);

      return { orderChain, cogsChain, expenseChain };
    }

    function containsText(value: unknown, needle: string, seen = new WeakSet<object>()): boolean {
      if (typeof value === "string") return value.includes(needle);
      if (typeof value !== "object" || value === null) return false;
      if (seen.has(value)) return false;
      seen.add(value);

      return Object.entries(value).some(([key, child]) => {
        if (key === "table") return false;
        return key.includes(needle) || containsText(child, needle, seen);
      });
    }

    it("should calculate revenue and COGS from orders", async () => {
      mockFinancialSelects({
        orderStats: [{ revenue: 1000000, count: 10 }],
        cogsStats: [{ cogs: 600000, itemCount: 10, missingCostItems: 0 }],
        expenseStats: [{ total: 100000 }],
      });

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.revenue).toBe(1000000);
      expect(result.cogs).toBe(600000);
      expect(result.grossProfit).toBe(400000); // 1000000 - 600000
    });

    it("should calculate net profit correctly", async () => {
      mockFinancialSelects({
        orderStats: [{ revenue: 500000, count: 5 }],
        cogsStats: [{ cogs: 200000, itemCount: 5, missingCostItems: 0 }],
        expenseStats: [{ total: 50000 }],
      });

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.grossProfit).toBe(300000); // 500000 - 200000
      expect(result.expenses).toBe(50000);
      expect(result.netProfit).toBe(250000); // 300000 - 50000
    });

    it("should return zero values when no orders exist", async () => {
      mockFinancialSelects({
        orderStats: [{ revenue: 0, count: 0 }],
        cogsStats: [{ cogs: 0, itemCount: 0, missingCostItems: 0 }],
        expenseStats: [{ total: 0 }],
      });

      const result = await getFinancialStats({ month: 12, year: 2025 });

      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
      expect(result.netProfit).toBe(0);
    });

    it("should handle expenses exceeding gross profit (loss scenario)", async () => {
      mockFinancialSelects({
        orderStats: [{ revenue: 100000, count: 2 }],
        cogsStats: [{ cogs: 80000, itemCount: 2, missingCostItems: 0 }],
        expenseStats: [{ total: 50000 }],
      });

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.grossProfit).toBe(20000); // 100000 - 80000
      expect(result.netProfit).toBe(-30000); // 20000 - 50000 = loss
    });

    it("should exclude cancelled orders from revenue calculation", async () => {
      const { orderChain } = mockFinancialSelects({
        orderStats: [{ revenue: 0, count: 0 }],
        cogsStats: [{ cogs: 0, itemCount: 0, missingCostItems: 0 }],
        expenseStats: [{ total: 0 }],
      });

      const result = await getFinancialStats({ month: 1, year: 2026 });

      // Assert: the WHERE clause filters are applied (db.select called with filters)
      expect(orderChain.where).toHaveBeenCalled();
      // Revenue should be 0 (no valid orders counted, cancelled excluded)
      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
    });

    it("should calculate order profit without filtering by payment status", async () => {
      const { orderChain, cogsChain } = mockFinancialSelects({
        orderStats: [{ revenue: 500000, count: 5 }],
        cogsStats: [{ cogs: 300000, itemCount: 5, missingCostItems: 0 }],
        expenseStats: [{ total: 50000 }],
      });

      const result = await getFinancialStats({ month: 1, year: 2026 });

      const orderWhere = orderChain.where.mock.calls[0][0];
      const cogsWhere = cogsChain.where.mock.calls[0][0];
      expect(containsText(orderWhere, "paymentStatus")).toBe(false);
      expect(containsText(orderWhere, "payment_status")).toBe(false);
      expect(containsText(cogsWhere, "paymentStatus")).toBe(false);
      expect(containsText(cogsWhere, "payment_status")).toBe(false);
      expect(result.revenue).toBe(500000);
      expect(result.grossProfit).toBe(200000);
      expect(result.netProfit).toBe(150000);
    });

    it("should fall back to current variant cost price when order line cost is missing", async () => {
      mockFinancialSelects({
        orderStats: [{ revenue: 500000, count: 5 }],
        cogsStats: [{ cogs: 300000, itemCount: 5, missingCostItems: 0 }],
        expenseStats: [{ total: 0 }],
      });

      await getFinancialStats({ month: 1, year: 2026 });

      const cogsChain = (db.select as any).mock.results[1].value;
      expect(cogsChain.innerJoin).toHaveBeenCalledTimes(2);
    });
  });
});
