/**
 * Báo cáo thu tiền theo phương thức thanh toán (sales/payments-by-method).
 * Groups payments by method (cash | bank_transfer | card) for non-cancelled orders.
 */

import { and, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, payments } from "../schema/orders";
import { normalizeRange } from "./report-shared.server";

export type PaymentsByMethodRow = {
  method: string;
  txCount: number;
  total: number;
  pct: number;
  avgPerTx: number;
};

export type PaymentsByMethodReport = {
  data: PaymentsByMethodRow[];
  summary: {
    totalAmount: number;
    totalTx: number;
    avgPerTx: number;
    topMethod: string | null;
  };
  period: { startDate: string; endDate: string };
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
};

export async function getPaymentsByMethodReport(params: {
  startDate: Date;
  endDate: Date;
}): Promise<PaymentsByMethodReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const rows = await db
    .select({
      method: payments.method,
      txCount: sql<number>`count(*)`.mapWith(Number),
      total: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)`.mapWith(Number),
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
    .groupBy(payments.method)
    .orderBy(sql`total desc`);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandTx = rows.reduce((s, r) => s + r.txCount, 0);

  const data: PaymentsByMethodRow[] = rows.map((r) => ({
    method: METHOD_LABELS[r.method] ?? r.method,
    txCount: r.txCount,
    total: r.total,
    pct: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
    avgPerTx: r.txCount > 0 ? r.total / r.txCount : 0,
  }));

  return {
    data,
    summary: {
      totalAmount: grandTotal,
      totalTx: grandTx,
      avgPerTx: grandTx > 0 ? grandTotal / grandTx : 0,
      topMethod: data[0]?.method ?? null,
    },
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
