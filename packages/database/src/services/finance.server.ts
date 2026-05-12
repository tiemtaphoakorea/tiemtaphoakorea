import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { and, desc, eq, gte, inArray, isNull, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../schema/expenses";
import { orderItems, orders } from "../schema/orders";
import { productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import { supplierPayments } from "../schema/receipts";

// Revenue = subtotal - discount (excludes shippingFee, which is pass-through reimbursement).
// COGS = sum of order_items.line_cost snapshotted at stock-out.
const revenueExpr =
  sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(
    Number,
  );
const lineCostExpr = sql`coalesce("order_items"."line_cost"::numeric, 0)`;

const orderRevenueExpr = sql<number>`(${orders.subtotal}::numeric - ${orders.discount}::numeric)`;

function buildReportOrderConditions(startDate: Date | null, endDate: Date | null): SQL[] {
  const conds: SQL[] = [
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [FULFILLMENT_STATUS.STOCK_OUT, FULFILLMENT_STATUS.COMPLETED]),
  ];
  if (startDate && endDate) {
    conds.push(gte(orders.stockOutAt, startDate));
    conds.push(lte(orders.stockOutAt, endDate));
  }
  return conds;
}

function orderHasMissingCost(): SQL {
  return sql`EXISTS (
    SELECT 1
    FROM order_items oi_missing
    WHERE oi_missing.order_id = ${orders.id}
      AND COALESCE(oi_missing.line_cost::numeric, 0) <= 0
  )`;
}

function orderHasNoMissingCost(): SQL {
  return sql`NOT ${orderHasMissingCost()}`;
}

function lineHasMissingCost(): SQL {
  return sql`COALESCE(${orderItems.lineCost}::numeric, 0) <= 0`;
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
      date: sql<string>`DATE(${orders.stockOutAt})`,
      revenue: revenueExpr,
      cogs: sql<number>`coalesce(sum(
        (
          SELECT sum(${lineCostExpr})
          FROM "order_items"
          WHERE "order_items"."order_id" = "orders"."id"
        )
      ), 0)`.mapWith(Number),
      orderCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(and(...buildReportOrderConditions(start, end), orderHasNoMissingCost()))
    .groupBy(sql`DATE(${orders.stockOutAt})`)
    .orderBy(sql`DATE(${orders.stockOutAt})`);

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
  const eligibleOrderConditions = [...orderConditions, orderHasNoMissingCost()];

  const orderStats = await db
    .select({
      revenue: revenueExpr,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(and(...eligibleOrderConditions));

  // Official P&L uses stock-out snapshotted COGS and excludes orders with missing-cost lines.
  const cogsStats = await db
    .select({
      cogs: sql<number>`coalesce(sum(${lineCostExpr}), 0)`.mapWith(Number),
      itemCount: sql<number>`count(${orderItems.id})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(and(...eligibleOrderConditions));

  const missingCostItemStats = await db
    .select({
      count: sql<number>`count(${orderItems.id})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...orderConditions, lineHasMissingCost()));

  const missingCostOrders = await db
    .select({
      id: orders.id,
      revenue: orderRevenueExpr.mapWith(Number),
    })
    .from(orders)
    .where(and(...orderConditions, orderHasMissingCost()));

  const revenue = orderStats[0]?.revenue ?? 0;
  const cogs = cogsStats[0]?.cogs ?? 0;
  const grossProfit = revenue - cogs;
  const itemCount = cogsStats[0]?.itemCount ?? 0;
  const missingCostItems = missingCostItemStats[0]?.count ?? 0;
  const totalReportItems = itemCount + missingCostItems;
  const missingCostRate = totalReportItems > 0 ? missingCostItems / totalReportItems : 0;
  const missingCostOrderCount = missingCostOrders.length;
  const excludedRevenue = missingCostOrders.reduce((sum, row) => sum + row.revenue, 0);

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

  const supplierPaymentWhere =
    startDate && endDate
      ? and(gte(supplierPayments.paidAt, startDate), lte(supplierPayments.paidAt, endDate))
      : undefined;

  const supplierPaymentStats = await db
    .select({
      total: sql<number>`coalesce(sum(${supplierPayments.amount}), 0)`.mapWith(Number),
    })
    .from(supplierPayments)
    .where(supplierPaymentWhere);

  const supplierPayouts = supplierPaymentStats[0]?.total ?? 0;

  // 3. Net Profit. Supplier payouts are cash movement for purchases; COGS already accounts for
  // product cost, so do not subtract payouts again from profit.
  const netProfit = grossProfit - totalExpenses;

  return {
    revenue,
    cogs,
    grossProfit,
    expenses: totalExpenses,
    supplierPayouts,
    netProfit,
    orderCount: orderStats[0]?.count ?? 0,
    missingCostItems,
    missingCostRate,
    missingCostOrderCount,
    excludedRevenue,
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
      revenue: sql<number>`(${orders.subtotal}::numeric - ${orders.discount}::numeric)`.mapWith(
        Number,
      ),
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
    id: r.id,
    orderNumber: r.orderNumber,
    customerName: r.customerName,
    total: r.total,
    cogs: r.cogs,
    grossProfit: r.revenue - r.cogs,
  }));
}
