import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, payments } from "../schema/orders";
import { profiles } from "../schema/profiles";

type DebtSummaryOpts = {
  search?: string;
  minAgeDays?: number;
  page?: number;
  limit?: number;
};

export async function getDebtSummary({
  search = "",
  minAgeDays,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
}: DebtSummaryOpts = {}) {
  const offset = (page - 1) * limit;

  const conditions = [
    eq(orders.fulfillmentStatus, FULFILLMENT_STATUS.STOCK_OUT),
    sql`${orders.paymentStatus} != 'paid'`,
  ];

  if (search) {
    conditions.push(
      or(ilike(profiles.fullName, `%${search}%`), ilike(profiles.phone, `%${search}%`))!,
    );
  }

  const subquery = db
    .select({
      customerId: orders.customerId,
      unpaidOrders: sql<number>`count(*)`.mapWith(Number).as("unpaid_orders"),
      debt: sql<string>`sum(${orders.total}::numeric - coalesce(${orders.paidAmount}, '0')::numeric)`.as(
        "debt",
      ),
      oldestDebtDate: sql<Date>`min(${orders.stockOutAt})`.as("oldest_debt_date"),
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...conditions))
    .groupBy(orders.customerId)
    .as("debt_summary");

  let query = db
    .select({
      customerId: subquery.customerId,
      unpaidOrders: subquery.unpaidOrders,
      debt: subquery.debt,
      oldestDebtDate: subquery.oldestDebtDate,
      customerName: profiles.fullName,
      customerPhone: profiles.phone,
    })
    .from(subquery)
    .innerJoin(profiles, eq(subquery.customerId, profiles.id))
    .$dynamic();

  if (minAgeDays != null) {
    const cutoff = new Date(Date.now() - minAgeDays * 24 * 60 * 60 * 1000);
    query = query.where(sql`${subquery.oldestDebtDate} <= ${cutoff}`);
  }

  const rows = await query.orderBy(sql`${subquery.oldestDebtDate} ASC`).limit(limit).offset(offset);

  // Count total customers with debt
  const [countRow] = await db
    .select({ c: sql<number>`count(distinct ${orders.customerId})`.mapWith(Number) })
    .from(orders)
    .where(and(...conditions));

  return { data: rows, metadata: calculateMetadata(Number(countRow?.c ?? 0), page, limit) };
}

export async function getCustomerDebt(customerId: string) {
  const [customer] = await db.select().from(profiles).where(eq(profiles.id, customerId)).limit(1);
  if (!customer) return null;

  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const unpaidOrders = allOrders.filter(
    (o) =>
      o.fulfillmentStatus === FULFILLMENT_STATUS.STOCK_OUT &&
      o.paymentStatus !== PAYMENT_STATUS.PAID,
  );

  const totalDebt = unpaidOrders.reduce(
    (sum, o) => sum + (Number(o.total ?? 0) - Number(o.paidAmount ?? 0)),
    0,
  );

  const paymentHistory = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      method: payments.method,
      referenceCode: payments.referenceCode,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(payments.createdAt));

  return {
    customer,
    totalDebt,
    unpaidOrders,
    paymentHistory,
    allOrders,
  };
}
