/**
 * Báo cáo thu tiền theo thời gian (sales/payments-by-time).
 * Groups payment transactions by day/week/month with breakdown by method.
 * Only payments on non-cancelled orders are included.
 */

import { and, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, payments } from "../schema/orders";
import { deltaPct, normalizeRange, previousPeriod, TRUNC_FMT } from "./report-shared.server";

export type PaymentsByTimeRow = {
  period: string;
  txCount: number;
  cashTotal: number;
  bankTotal: number;
  cardTotal: number;
  total: number;
  orderCount: number;
};

export type PaymentsByTimeReport = {
  data: PaymentsByTimeRow[];
  summary: {
    totalAmount: number;
    totalTx: number;
    avgPerDay: number;
    peakPeriod: string | null;
  };
  compare: {
    totalAmount: number | null;
    delta: { totalAmount: number | null; totalTx: number | null };
  } | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  groupBy: "day" | "week" | "month";
};

async function fetchRows(
  start: Date,
  end: Date,
  groupBy: "day" | "week" | "month",
): Promise<PaymentsByTimeRow[]> {
  const { trunc, format } = TRUNC_FMT[groupBy];

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc(${trunc}, ${payments.createdAt}), ${format})`,
      txCount: sql<number>`count(*)`.mapWith(Number),
      cashTotal: sql<number>`coalesce(sum(case when ${payments.method} = 'cash' then ${payments.amount}::numeric else 0 end), 0)`.mapWith(Number),
      bankTotal: sql<number>`coalesce(sum(case when ${payments.method} = 'bank_transfer' then ${payments.amount}::numeric else 0 end), 0)`.mapWith(Number),
      cardTotal: sql<number>`coalesce(sum(case when ${payments.method} = 'card' then ${payments.amount}::numeric else 0 end), 0)`.mapWith(Number),
      total: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)`.mapWith(Number),
      orderCount: sql<number>`count(distinct ${payments.orderId})`.mapWith(Number),
    })
    .from(payments)
    .innerJoin(orders, sql`${orders.id} = ${payments.orderId}`)
    .where(
      and(
        isNull(orders.cancelledAt),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end),
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return rows;
}

export async function getPaymentsByTimeReport(params: {
  startDate: Date;
  endDate: Date;
  groupBy?: "day" | "week" | "month";
  compare?: boolean;
}): Promise<PaymentsByTimeReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const groupBy = params.groupBy ?? "day";
  const shouldCompare = params.compare ?? false;

  const data = await fetchRows(start, end, groupBy);
  const totalAmount = data.reduce((s, r) => s + r.total, 0);
  const totalTx = data.reduce((s, r) => s + r.txCount, 0);
  const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  const peakRow = [...data].sort((a, b) => b.total - a.total)[0] ?? null;

  if (!shouldCompare) {
    return {
      data,
      summary: {
        totalAmount,
        totalTx,
        avgPerDay: totalAmount / durationDays,
        peakPeriod: peakRow?.period ?? null,
      },
      compare: null,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      previousPeriod: null,
      groupBy,
    };
  }

  const prev = previousPeriod(start, end);
  const prevData = await fetchRows(prev.start, prev.end, groupBy);
  const prevTotal = prevData.reduce((s, r) => s + r.total, 0);
  const prevTx = prevData.reduce((s, r) => s + r.txCount, 0);

  return {
    data,
    summary: {
      totalAmount,
      totalTx,
      avgPerDay: totalAmount / durationDays,
      peakPeriod: peakRow?.period ?? null,
    },
    compare: {
      totalAmount: prevTotal,
      delta: {
        totalAmount: deltaPct(totalAmount, prevTotal),
        totalTx: deltaPct(totalTx, prevTx),
      },
    },
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
    previousPeriod: { startDate: prev.start.toISOString(), endDate: prev.end.toISOString() },
    groupBy,
  };
}
