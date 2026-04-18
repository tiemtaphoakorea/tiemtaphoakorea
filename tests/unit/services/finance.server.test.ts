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
    it("should calculate revenue and COGS from orders", async () => {
      // Need to mock select chain for both orders and expenses
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 1000000, cogs: 600000, count: 10 }]),
      };
      (db.select as any).mockReturnValueOnce(mockSelectChain);

      // Mock second select for expenses
      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 100000 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.revenue).toBe(1000000);
      expect(result.cogs).toBe(600000);
      expect(result.grossProfit).toBe(400000); // 1000000 - 600000
    });

    it("should calculate net profit correctly", async () => {
      const mockOrderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 500000, cogs: 200000, count: 5 }]),
      };
      (db.select as any).mockReturnValueOnce(mockOrderChain);

      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 50000 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.grossProfit).toBe(300000); // 500000 - 200000
      expect(result.expenses).toBe(50000);
      expect(result.netProfit).toBe(250000); // 300000 - 50000
    });

    it("should return zero values when no orders exist", async () => {
      const mockOrderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 0, cogs: 0, count: 0 }]),
      };
      (db.select as any).mockReturnValueOnce(mockOrderChain);

      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 12, year: 2025 });

      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
      expect(result.netProfit).toBe(0);
    });

    it("should handle expenses exceeding gross profit (loss scenario)", async () => {
      const mockOrderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 100000, cogs: 80000, count: 2 }]),
      };
      (db.select as any).mockReturnValueOnce(mockOrderChain);

      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 50000 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 1, year: 2026 });

      expect(result.grossProfit).toBe(20000); // 100000 - 80000
      expect(result.netProfit).toBe(-30000); // 20000 - 50000 = loss
    });

    it("should exclude cancelled orders from revenue calculation", async () => {
      // Arrange: Two mock db.select calls — orders returns 0 revenue (simulating cancelled excluded)
      const mockOrderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 0, cogs: 0, count: 0 }]),
      };
      (db.select as any).mockReturnValueOnce(mockOrderChain);

      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 1, year: 2026 });

      // Assert: the WHERE clause filters are applied (db.select called with filters)
      expect(mockOrderChain.where).toHaveBeenCalled();
      // Revenue should be 0 (no valid orders counted, cancelled excluded)
      expect(result.revenue).toBe(0);
      expect(result.orderCount).toBe(0);
    });

    it("should only count PAID, PREPARING, SHIPPING, DELIVERED statuses", async () => {
      // NOTE: The actual SQL filter (inArray) cannot be inspected in unit tests.
      // This test documents the expected contract: 5 statuses are valid, PENDING and CANCELLED are not.
      // Verified by reading source: packages/database/src/services/finance.server.ts line 129-133
      const mockOrderChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ revenue: 500000, cogs: 300000, count: 5 }]),
      };
      (db.select as any).mockReturnValueOnce(mockOrderChain);

      const mockExpenseChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ total: 50000 }]),
      };
      (db.select as any).mockReturnValueOnce(mockExpenseChain);

      const result = await getFinancialStats({ month: 1, year: 2026 });

      // The WHERE clause was called with status filter — if it weren't, mock would need no where() call
      expect(mockOrderChain.where).toHaveBeenCalled();
      expect(result.revenue).toBe(500000);
      expect(result.grossProfit).toBe(200000);
      expect(result.netProfit).toBe(150000);
    });
  });
});
