/**
 * Báo cáo doanh thu theo nhân viên (sales/by-staff).
 * Groups orders by the staff member who created them (orders.created_by → profiles).
 * Revenue = subtotal - discount. Staff with null created_by → "Chưa rõ NV".
 *
 * Time anchor: `orders.stockOutAt` (Sapo accrual). Only `fulfillmentStatus IN (stock_out, completed)`.
 */

import { and, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { db } from "../db";
import { orders } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { normalizeRange } from "./report-shared.server";

export type SalesByStaffRow = {
  staffId: string | null;
  staffName: string;
  orderCount: number;
  revenue: number;
  profit: number;
  profitPct: number;
  aov: number;
};

export type SalesByStaffReport = {
  data: SalesByStaffRow[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrderCount: number;
    staffCount: number;
    topStaffName: string | null;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

export async function getSalesByStaffReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<SalesByStaffReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const searchFilter = params.search
    ? sql`ilike(coalesce(${profiles.fullName}, 'Chưa rõ NV'), ${"%" + params.search + "%"})`
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

  // Aggregate using a CTE-style subquery via raw execute for summary + paginated data
  const aggRows = await db
    .select({
      staffId: orders.createdBy,
      staffName: sql<string>`coalesce(${profiles.fullName}, 'Chưa rõ NV')`,
      orderCount: sql<number>`count(*)`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
      profit: sql<number>`coalesce(sum(${orders.profit}::numeric), 0)`.mapWith(Number),
    })
    .from(orders)
    .leftJoin(profiles, sql`${profiles.id} = ${orders.createdBy}`)
    .where(conditions)
    .groupBy(orders.createdBy, profiles.fullName)
    .orderBy(sql`revenue desc`);

  const total = aggRows.length;
  const pagedRows = aggRows.slice(offset, offset + limit);

  const data: SalesByStaffRow[] = pagedRows.map((r) => ({
    staffId: r.staffId,
    staffName: r.staffName,
    orderCount: r.orderCount,
    revenue: r.revenue,
    profit: r.profit,
    profitPct: r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0,
    aov: r.orderCount > 0 ? r.revenue / r.orderCount : 0,
  }));

  // Summary from all rows (not just current page)
  const totalRevenue = aggRows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = aggRows.reduce((s, r) => s + r.profit, 0);
  const totalOrderCount = aggRows.reduce((s, r) => s + r.orderCount, 0);
  const topRow = aggRows[0] ?? null; // already sorted by revenue desc

  return {
    data,
    summary: {
      totalRevenue,
      totalProfit,
      totalOrderCount,
      staffCount: total,
      topStaffName: topRow?.staffName ?? null,
    },
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
