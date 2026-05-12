/**
 * Báo cáo doanh thu theo thời gian (sales/by-time).
 * Groups orders by day/week/month within the selected period.
 *
 * Time anchor: `orders.stockOutAt` (khi xuất kho — Sapo accrual style).
 * Eligibility: cancelled_at IS NULL AND fulfillmentStatus IN (stock_out, completed).
 *   → Đơn pending/confirmed CHƯA tính. Đảm bảo cross-check khớp với P&L.
 * Revenue = subtotal - discount (excludes shipping fee, same as `revenueExpr` in finance.server).
 * COGS = orders.totalCost (snapshot at stock-out).
 */

import { and, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { orders } from "../schema/orders";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { deltaPct, normalizeRange, previousPeriod, TRUNC_FMT } from "./report-shared.server";

export type SalesByTimeRow = {
  period: string;
  orderCount: number;
  revenue: number;
  cogs: number;
  profit: number;
  profitPct: number;
};

export type SalesByTimeReport = {
  data: SalesByTimeRow[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrderCount: number;
    aov: number;
    grossMarginPct: number;
  };
  compare: {
    totalRevenue: number | null;
    delta: { revenue: number | null; profit: number | null; orderCount: number | null };
  } | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  groupBy: "day" | "week" | "month";
};

async function fetchRows(start: Date, end: Date, groupBy: "day" | "week" | "month"): Promise<SalesByTimeRow[]> {
  const { trunc, format } = TRUNC_FMT[groupBy];
  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc(${trunc}, ${orders.stockOutAt}), ${format})`,
      orderCount: sql<number>`count(*)`.mapWith(Number),
      revenue: sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
      cogs: sql<number>`coalesce(sum(${orders.totalCost}::numeric), 0)`.mapWith(Number),
      profit: sql<number>`coalesce(sum(${orders.profit}::numeric), 0)`.mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        isNull(orders.cancelledAt),
        inArray(orders.fulfillmentStatus, [
          FULFILLMENT_STATUS.STOCK_OUT,
          FULFILLMENT_STATUS.COMPLETED,
        ]),
        gte(orders.stockOutAt, start),
        lte(orders.stockOutAt, end),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return rows.map((r) => ({
    ...r,
    profitPct: r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0,
  }));
}

function summarize(rows: SalesByTimeRow[]) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalOrderCount = rows.reduce((s, r) => s + r.orderCount, 0);
  return {
    totalRevenue,
    totalProfit,
    totalOrderCount,
    aov: totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0,
    grossMarginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  };
}

export async function getSalesByTimeReport(params: {
  startDate: Date;
  endDate: Date;
  groupBy?: "day" | "week" | "month";
  compare?: boolean;
}): Promise<SalesByTimeReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const groupBy = params.groupBy ?? "day";
  const shouldCompare = params.compare ?? false;

  const data = await fetchRows(start, end, groupBy);
  const summary = summarize(data);

  if (!shouldCompare) {
    return {
      data,
      summary,
      compare: null,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      previousPeriod: null,
      groupBy,
    };
  }

  const prev = previousPeriod(start, end);
  const prevData = await fetchRows(prev.start, prev.end, groupBy);
  const prevSummary = summarize(prevData);

  return {
    data,
    summary,
    compare: {
      totalRevenue: prevSummary.totalRevenue,
      delta: {
        revenue: deltaPct(summary.totalRevenue, prevSummary.totalRevenue),
        profit: deltaPct(summary.totalProfit, prevSummary.totalProfit),
        orderCount: deltaPct(summary.totalOrderCount, prevSummary.totalOrderCount),
      },
    },
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
    previousPeriod: { startDate: prev.start.toISOString(), endDate: prev.end.toISOString() },
    groupBy,
  };
}
