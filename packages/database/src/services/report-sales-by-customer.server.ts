/**
 * Báo cáo doanh thu theo khách hàng (sales/by-customer).
 * Groups eligible orders by customer within the period.
 * Revenue = subtotal - discount. "Số KH" = COUNT(DISTINCT customer_id).
 *
 * Time anchor: `orders.stockOutAt`. Eligibility: `fulfillmentStatus IN (stock_out, completed)`.
 */

import { and, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { db } from "../db";
import { orders } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { normalizeRange } from "./report-shared.server";

export type SalesByCustomerRow = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
  profit: number;
  profitPct: number;
  aov: number;
  lastOrderAt: string | null;
};

export type SalesByCustomerReport = {
  data: SalesByCustomerRow[];
  summary: {
    customerCount: number;
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    topCustomerName: string | null;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

export async function getSalesByCustomerReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SalesByCustomerReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const searchFilter = params.search
    ? sql`(${profiles.fullName} ilike ${"%" + params.search + "%"} or ${profiles.phone} ilike ${"%" + params.search + "%"} or ${profiles.customerCode} ilike ${"%" + params.search + "%"})`
    : undefined;

  const conditions = and(
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [
      FULFILLMENT_STATUS.STOCK_OUT,
      FULFILLMENT_STATUS.COMPLETED,
    ]),
    gte(orders.stockOutAt, start),
    lte(orders.stockOutAt, end),
    sql`${profiles.role} = 'customer'`,
    searchFilter,
  );

  const countResult = await db
    .select({ c: sql<number>`count(distinct ${orders.customerId})`.mapWith(Number) })
    .from(orders)
    .innerJoin(profiles, sql`${profiles.id} = ${orders.customerId}`)
    .where(conditions);
  const total = countResult[0]?.c ?? 0;

  const rows = await db
    .select({
      customerId: orders.customerId,
      customerName: profiles.fullName,
      customerPhone: profiles.phone,
      customerCode: profiles.customerCode,
      orderCount: sql<number>`count(*)`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
      profit: sql<number>`coalesce(sum(${orders.profit}::numeric), 0)`.mapWith(Number),
      aov: sql<number>`coalesce(avg(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
      lastOrderAt: sql<string | null>`max(${orders.stockOutAt})`,
    })
    .from(orders)
    .innerJoin(profiles, sql`${profiles.id} = ${orders.customerId}`)
    .where(conditions)
    .groupBy(
      orders.customerId,
      profiles.fullName,
      profiles.phone,
      profiles.customerCode,
    )
    .orderBy(sql`revenue desc`)
    .limit(limit)
    .offset(offset);

  const summaryResult = await db
    .select({
      customerCount: sql<number>`count(distinct ${orders.customerId})`.mapWith(Number),
      totalRevenue: sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(profiles, sql`${profiles.id} = ${orders.customerId}`)
    .where(conditions);

  const s = summaryResult[0] ?? { customerCount: 0, totalRevenue: 0 };
  const avgRevenuePerCustomer = s.customerCount > 0 ? s.totalRevenue / s.customerCount : 0;

  return {
    data: rows.map((r) => ({
      ...r,
      profitPct: r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0,
      lastOrderAt: r.lastOrderAt ? String(r.lastOrderAt) : null,
    })),
    summary: {
      customerCount: s.customerCount,
      totalRevenue: s.totalRevenue,
      avgRevenuePerCustomer,
      topCustomerName: rows[0]?.customerName ?? null,
    },
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
