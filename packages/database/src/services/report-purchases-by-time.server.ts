/**
 * Báo cáo nhập hàng theo thời gian (by-time) — aggregated goods_receipts per period.
 * Source: goods_receipts WHERE status='completed' AND cancelled_at IS NULL.
 *
 * Time anchor: `COALESCE(received_at, created_at)` — ưu tiên ngày NCC giao thực tế, fallback
 * ngày tạo phiếu nếu chưa fill received_at. Sapo accrual style.
 */

import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf, TRUNC_FMT } from "./report-shared.server";

export type PurchasesByTimePeriodRow = {
  period: string;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
};

export type PurchasesByTimeReport = {
  rows: PurchasesByTimePeriodRow[];
  summary: {
    totalReceipts: number;
    totalQty: number;
    totalPayable: number;
    totalPaid: number;
    totalDebt: number;
  };
  groupBy: "day" | "week" | "month";
};

export async function getPurchasesByTimeReport(params: {
  startDate: Date;
  endDate: Date;
  groupBy?: "day" | "week" | "month";
}): Promise<PurchasesByTimeReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const groupBy = params.groupBy ?? "day";
  const { trunc, format } = TRUNC_FMT[groupBy];

  const result = await db.execute(sql`
    SELECT
      to_char(date_trunc(${trunc}, COALESCE(received_at, created_at)), ${format}) AS period,
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(total_qty), 0)::int AS total_qty,
      COALESCE(SUM(payable_amount::numeric), 0) AS payable_amount,
      COALESCE(SUM(paid_amount::numeric), 0) AS paid_amount,
      COALESCE(SUM(debt_amount::numeric), 0) AS debt_amount
    FROM goods_receipts
    WHERE status = 'completed'
      AND cancelled_at IS NULL
      AND COALESCE(received_at, created_at) >= ${start}
      AND COALESCE(received_at, created_at) <= ${end}
    GROUP BY 1
    ORDER BY 1
  `);

  const rows = rowsOf<Record<string, unknown>>(result).map((r) => ({
    period: r.period as string,
    receiptCount: Number(r.receipt_count ?? 0),
    totalQty: Number(r.total_qty ?? 0),
    payableAmount: Number(r.payable_amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    debtAmount: Number(r.debt_amount ?? 0),
  }));

  const summary = {
    totalReceipts: rows.reduce((s, r) => s + r.receiptCount, 0),
    totalQty: rows.reduce((s, r) => s + r.totalQty, 0),
    totalPayable: rows.reduce((s, r) => s + r.payableAmount, 0),
    totalPaid: rows.reduce((s, r) => s + r.paidAmount, 0),
    totalDebt: rows.reduce((s, r) => s + r.debtAmount, 0),
  };

  return { rows, summary, groupBy };
}
