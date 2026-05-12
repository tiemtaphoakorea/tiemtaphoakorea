/**
 * Báo cáo doanh thu theo sản phẩm/biến thể (sales/by-product).
 * Aggregates order_items joined to eligible orders (non-cancelled, shipped/completed).
 * Revenue = sum(line_total). COGS = sum(line_cost).
 *
 * Time anchor: `orders.stockOutAt`. Eligibility: `fulfillmentStatus IN (stock_out, completed)`.
 */

import { and, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { db } from "../db";
import { orderItems, orders } from "../schema/orders";
import { normalizeRange } from "./report-shared.server";

export type SalesByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  qty: number;
  revenue: number;
  cogs: number;
  profit: number;
  profitPct: number;
};

export type SalesByProductReport = {
  data: SalesByProductRow[];
  summary: {
    totalSkus: number;
    totalQty: number;
    totalRevenue: number;
    totalProfit: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

export async function getSalesByProductReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SalesByProductReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const searchFilter = params.search
    ? sql`(${orderItems.productName} ilike ${"%" + params.search + "%"} or ${orderItems.sku} ilike ${"%" + params.search + "%"})`
    : undefined;

  const conditions = and(
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [
      FULFILLMENT_STATUS.STOCK_OUT,
      FULFILLMENT_STATUS.COMPLETED,
    ]),
    gte(orders.stockOutAt, start),
    lte(orders.stockOutAt, end),
    searchFilter,
  );

  // Count distinct variants for pagination
  const countResult = await db
    .select({ c: sql<number>`count(distinct ${orderItems.variantId})`.mapWith(Number) })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(conditions);
  const total = countResult[0]?.c ?? 0;

  const rows = await db
    .select({
      variantId: orderItems.variantId,
      sku: orderItems.sku,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      qty: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${orderItems.lineTotal}::numeric), 0)`.mapWith(Number),
      cogs: sql<number>`coalesce(sum(${orderItems.lineCost}::numeric), 0)`.mapWith(Number),
      profit: sql<number>`coalesce(sum(${orderItems.lineProfit}::numeric), 0)`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(conditions)
    .groupBy(orderItems.variantId, orderItems.sku, orderItems.productName, orderItems.variantName)
    .orderBy(sql`revenue desc`)
    .limit(limit)
    .offset(offset);

  // Summary across all matching rows (not just page) — reuse count query scope
  const summaryResult = await db
    .select({
      totalSkus: sql<number>`count(distinct ${orderItems.variantId})`.mapWith(Number),
      totalQty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(Number),
      totalRevenue: sql<number>`coalesce(sum(${orderItems.lineTotal}::numeric), 0)`.mapWith(Number),
      totalProfit: sql<number>`coalesce(sum(${orderItems.lineProfit}::numeric), 0)`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(conditions);

  const s = summaryResult[0] ?? { totalSkus: 0, totalQty: 0, totalRevenue: 0, totalProfit: 0 };

  return {
    data: rows.map((r) => ({
      ...r,
      profitPct: r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0,
    })),
    summary: s,
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
