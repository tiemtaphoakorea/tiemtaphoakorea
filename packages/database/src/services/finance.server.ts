import { and, desc, eq, gte, isNull, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../schema/expenses";
import { orderItems, orders } from "../schema/orders";
import { productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";

// Revenue = subtotal - discount (excludes shippingFee, which is pass-through reimbursement).
// COGS = sum of order_items.line_cost (snapshot at sale time, not the stale orders.total_cost column).
const revenueExpr =
  sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(
    Number,
  );
const lineCostExpr = sql`coalesce(
  nullif("order_items"."line_cost"::numeric, 0),
  coalesce("product_variants"."cost_price"::numeric, 0) * "order_items"."quantity"
)`;

function buildReportOrderConditions(startDate: Date | null, endDate: Date | null): SQL[] {
  const conds: SQL[] = [isNull(orders.cancelledAt)];
  if (startDate && endDate) {
    conds.push(gte(orders.createdAt, startDate));
    conds.push(lte(orders.createdAt, endDate));
  }
  return conds;
}

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
  cogs: number;
  grossProfit: number;
};

export async function getDailyStats(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // COGS pulled from order_items.line_cost (snapshot at sale) per-day.
  const rows = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: revenueExpr,
      cogs: sql<number>`coalesce(sum(
        (
          SELECT sum(${lineCostExpr})
          FROM "order_items"
          INNER JOIN "product_variants" ON "product_variants"."id" = "order_items"."variant_id"
          WHERE "order_items"."order_id" = "orders"."id"
        )
      ), 0)`.mapWith(Number),
      orderCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(and(...buildReportOrderConditions(start, end)))
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

  const orderConditions = buildReportOrderConditions(startDate, endDate);

  const orderStats = await db
    .select({
      revenue: revenueExpr,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(and(...orderConditions));

  // Prefer sale-time line_cost; fallback to current variant cost when old/negative-stock orders have no snapshot.
  // Also count items missing cost so the UI can warn about under-reported COGS.
  const cogsStats = await db
    .select({
      cogs: sql<number>`coalesce(sum(${lineCostExpr}), 0)`.mapWith(Number),
      itemCount: sql<number>`count(${orderItems.id})`.mapWith(Number),
      missingCostItems: sql<number>`count(${orderItems.id}) FILTER (
        WHERE (${orderItems.lineCost}::numeric = 0 OR ${orderItems.lineCost} IS NULL)
          AND (${productVariants.costPrice}::numeric = 0 OR ${productVariants.costPrice} IS NULL)
      )`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(and(...orderConditions));

  const revenue = orderStats[0]?.revenue ?? 0;
  const cogs = cogsStats[0]?.cogs ?? 0;
  const grossProfit = revenue - cogs;
  const itemCount = cogsStats[0]?.itemCount ?? 0;
  const missingCostItems = cogsStats[0]?.missingCostItems ?? 0;
  const missingCostRate = itemCount > 0 ? missingCostItems / itemCount : 0;

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
    missingCostItems,
    missingCostRate,
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
      cogs: sql<number>`coalesce((
        SELECT sum(${lineCostExpr})
        FROM "order_items"
        INNER JOIN "product_variants" ON "product_variants"."id" = "order_items"."variant_id"
        WHERE "order_items"."order_id" = "orders"."id"
      ), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...buildReportOrderConditions(start, end)))
    .orderBy(desc(orders.createdAt));

  return rows.map((r) => ({
    ...r,
    grossProfit: Number(r.total ?? 0) - r.cogs,
  }));
}
