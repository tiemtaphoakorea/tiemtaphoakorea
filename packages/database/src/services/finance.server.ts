import { ORDER_STATUS } from "@repo/shared/constants";
import { and, desc, eq, gte, inArray, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../schema/expenses";
import { orders } from "../schema/orders";

export type CreateExpenseData = {
  description: string;
  amount: number;
  type: "fixed" | "variable";
  date: Date;
  createdBy: string;
};

// --- Expense Management ---

export async function createExpense(data: CreateExpenseData) {
  const [newExpense] = await db
    .insert(expenses)
    .values({
      description: data.description,
      amount: data.amount.toString(),
      type: data.type,
      date: data.date,
      createdBy: data.createdBy,
    })
    .returning();
  return newExpense;
}

export async function getExpenses(params: {
  month?: number;
  year?: number;
  type?: "fixed" | "variable";
  offset?: number;
  limit?: number;
}) {
  const { month, year, type, offset, limit } = params;

  const conditions: SQL[] = [];

  if (type) conditions.push(eq(expenses.type, type));

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    conditions.push(and(gte(expenses.date, startDate), lte(expenses.date, endDate))!);
  } else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    conditions.push(and(gte(expenses.date, startDate), lte(expenses.date, endDate))!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(expenses)
    .where(where);

  const data = await db.query.expenses.findMany({
    where,
    orderBy: [desc(expenses.date)],
    limit,
    offset,
    with: {
      creator: true,
    },
  });

  return {
    data,
    total: totalCount?.count ?? 0,
  };
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  return { success: true };
}

// --- Financial Reporting (P&L) ---

export async function getFinancialStats(params: {
  month?: number;
  year?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  let startDate: Date;
  let endDate: Date;

  if (params.startDate && params.endDate) {
    startDate = params.startDate;
    endDate = params.endDate;
    // Set time to start and end of day respectively if not provided/defaults
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (params.month && params.year) {
    startDate = new Date(params.year, params.month - 1, 1);
    endDate = new Date(params.year, params.month, 0, 23, 59, 59, 999);
  } else {
    throw new Error("Invalid date parameters: provide either month/year or startDate/endDate");
  }

  // 1. Revenue & COGS (From Paid/Delivered Orders)
  // Logic: Revenue is recognized when order is 'paid' or 'delivered' or just use all orders?
  // Conservative approach: 'paid' or 'delivered' to avoid counting cancelled or pending-unpaid.
  // Actually, standard retail usually counts 'paid' orders.
  // Let's filter by status: paid, delivered, shipping.

  // Note: We should filter by order `createdAt` or `paidAt`?
  // P&L usually follows accrual basis (when order created) or cash basis (when paid).
  // Given retail, let's use `createdAt` for simplicity of matching Expenses in that month,
  // but only count valid orders (not cancelled).

  const orderStats = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
      cogs: sql<number>`coalesce(sum(${orders.totalCost}), 0)`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        inArray(orders.status, [
          ORDER_STATUS.PAID,
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.SHIPPING,
          ORDER_STATUS.DELIVERED,
        ]),
      ),
    );

  const revenue = orderStats[0]?.revenue ?? 0;
  const cogs = orderStats[0]?.cogs ?? 0;
  const grossProfit = revenue - cogs;

  // 2. Expenses
  const expenseStats = await db
    .select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`.mapWith(Number),
    })
    .from(expenses)
    .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)));

  const totalExpenses = expenseStats[0]?.total ?? 0;

  // 3. Net Profit
  const netProfit = grossProfit - totalExpenses;

  return {
    revenue,
    cogs,
    grossProfit,
    expenses: totalExpenses,
    netProfit,
    orderCount: orderStats[0]?.count ?? 0,
  };
}
