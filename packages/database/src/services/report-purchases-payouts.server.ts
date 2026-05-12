/**
 * Báo cáo chi trả NCC theo phương thức thanh toán (payouts-by-method).
 * Source: supplier_payments WHERE paid_at BETWEEN start AND end.
 * COALESCE method → 'unknown' for legacy null rows (column is NOT NULL now but defensive).
 */

import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type PayoutsByMethodRow = {
  method: string;
  txCount: number;
  totalAmount: number;
  pct: number;
  avgAmount: number;
};

export type PayoutsByMethodReport = {
  rows: PayoutsByMethodRow[];
  summary: {
    totalAmount: number;
    txCount: number;
    avgAmount: number;
    topMethod: string | null;
  };
};

export async function getPayoutsByMethodReport(params: {
  startDate: Date;
  endDate: Date;
}): Promise<PayoutsByMethodReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const result = await db.execute(sql`
    SELECT
      COALESCE(method::text, 'unknown') AS method,
      COUNT(*)::int AS tx_count,
      COALESCE(SUM(amount::numeric), 0) AS total_amount
    FROM supplier_payments
    WHERE paid_at >= ${start}
      AND paid_at <= ${end}
    GROUP BY COALESCE(method::text, 'unknown')
    ORDER BY total_amount DESC
  `);

  const rawRows = rowsOf<Record<string, unknown>>(result).map((r) => ({
    method: r.method as string,
    txCount: Number(r.tx_count ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
  }));

  const grandTotal = rawRows.reduce((s, r) => s + r.totalAmount, 0);
  const grandTxCount = rawRows.reduce((s, r) => s + r.txCount, 0);

  const rows: PayoutsByMethodRow[] = rawRows.map((r) => ({
    method: r.method,
    txCount: r.txCount,
    totalAmount: r.totalAmount,
    pct: grandTotal > 0 ? (r.totalAmount / grandTotal) * 100 : 0,
    avgAmount: r.txCount > 0 ? r.totalAmount / r.txCount : 0,
  }));

  return {
    rows,
    summary: {
      totalAmount: grandTotal,
      txCount: grandTxCount,
      avgAmount: grandTxCount > 0 ? grandTotal / grandTxCount : 0,
      topMethod: rows[0]?.method ?? null,
    },
  };
}

export type PayoutTransactionRow = {
  id: string;
  code: string;
  supplierName: string | null;
  method: string;
  amount: number;
  paidAt: Date;
  note: string | null;
};

/** Drill-down: list raw supplier_payments rows for a given method in the period. */
export async function getPayoutTransactionsByMethod(params: {
  method: string;
  startDate: Date;
  endDate: Date;
}): Promise<PayoutTransactionRow[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const result = await db.execute(sql`
    SELECT
      sp.id,
      sp.code,
      s.name AS supplier_name,
      COALESCE(sp.method::text, 'unknown') AS method,
      sp.amount,
      sp.paid_at,
      sp.note
    FROM supplier_payments sp
    LEFT JOIN suppliers s ON s.id = sp.supplier_id
    WHERE COALESCE(sp.method::text, 'unknown') = ${params.method}
      AND sp.paid_at >= ${start}
      AND sp.paid_at <= ${end}
    ORDER BY sp.paid_at DESC
  `);

  return rowsOf<Record<string, unknown>>(result).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    supplierName: (r.supplier_name as string) ?? null,
    method: r.method as string,
    amount: Number(r.amount ?? 0),
    paidAt: new Date(r.paid_at as string),
    note: (r.note as string) ?? null,
  }));
}
