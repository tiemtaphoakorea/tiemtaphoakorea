import { PAYMENT_STATUS } from "@workspace/shared/constants";
import { and, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../schema/expenses";
import { orders } from "../schema/orders";
import { profiles } from "../schema/profiles";

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

export type DailyStatRow = {
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  orderCount: number;
};

export type DayOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  total: string | null;
};

export async function getDailyStats(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
      cogs: sql<number>`coalesce(sum(${orders.totalCost}), 0)`.mapWith(Number),
      orderCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
        eq(orders.paymentStatus, PAYMENT_STATUS.PAID),
      ),
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  const dailyData: DailyStatRow[] = rows.map((r) => ({
    date: r.date,
    revenue: r.revenue,
    cogs: r.cogs,
    grossProfit: r.revenue - r.cogs,
    orderCount: r.orderCount,
  }));

  const summary = {
    revenue: dailyData.reduce((s, r) => s + r.revenue, 0),
    cogs: dailyData.reduce((s, r) => s + r.cogs, 0),
    grossProfit: dailyData.reduce((s, r) => s + r.grossProfit, 0),
    orderCount: dailyData.reduce((s, r) => s + r.orderCount, 0),
  };

  return { dailyData, summary };
}

// --- Financial Reporting (P&L) ---

export async function getFinancialStats(params: {
  month?: number;
  year?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (params.startDate && params.endDate) {
    startDate = params.startDate;
    endDate = params.endDate;
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (params.month && params.year) {
    startDate = new Date(params.year, params.month - 1, 1);
    endDate = new Date(params.year, params.month, 0, 23, 59, 59, 999);
  }
  // No date params → lifetime/shop-wide stats

  const orderConditions: SQL[] = [eq(orders.paymentStatus, PAYMENT_STATUS.PAID)];
  if (startDate && endDate) {
    orderConditions.push(gte(orders.createdAt, startDate));
    orderConditions.push(lte(orders.createdAt, endDate));
  }

  const orderStats = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
      cogs: sql<number>`coalesce(sum(${orders.totalCost}), 0)`.mapWith(Number),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(and(...orderConditions));

  const revenue = orderStats[0]?.revenue ?? 0;
  const cogs = orderStats[0]?.cogs ?? 0;
  const grossProfit = revenue - cogs;

  // 2. Expenses
  const expenseWhere =
    startDate && endDate
      ? and(gte(expenses.date, startDate), lte(expenses.date, endDate))
      : undefined;

  const expenseStats = await db
    .select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`.mapWith(Number),
    })
    .from(expenses)
    .where(expenseWhere);

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

export async function getDayOrders(date: string): Promise<DayOrderRow[]> {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: profiles.fullName,
      total: orders.total,
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(
      and(
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
        eq(orders.paymentStatus, PAYMENT_STATUS.PAID),
      ),
    )
    .orderBy(desc(orders.createdAt));

  return rows;
}
