/**
 * Báo cáo nhập hàng theo nhân viên (by-staff).
 * Source: goods_receipts LEFT JOIN profiles ON profiles.id = goods_receipts.created_by.
 * NULL created_by → "Chưa rõ NV" bucket.
 *
 * Time anchor: `COALESCE(received_at, created_at)` (ngày NCC giao thực tế, fallback ngày tạo).
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf, sqlTimestamp } from "./report-shared.server";

export type PurchasesByStaffRow = {
  staffId: string | null;
  staffName: string;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
  avgPerReceipt: number;
};

export type PurchasesByStaffReport = {
  data: PurchasesByStaffRow[];
  summary: {
    staffCount: number;
    totalReceipts: number;
    totalPayable: number;
    topStaffName: string | null;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getPurchasesByStaffReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PurchasesByStaffReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const result = await db.execute(sql`
    SELECT
      r.created_by AS staff_id,
      COALESCE(pr.full_name, 'Chưa rõ NV') AS staff_name,
      COUNT(r.id)::int AS receipt_count,
      COALESCE(SUM(r.total_qty), 0)::int AS total_qty,
      COALESCE(SUM(r.payable_amount::numeric), 0) AS payable_amount,
      COALESCE(SUM(r.paid_amount::numeric), 0) AS paid_amount,
      COALESCE(SUM(r.debt_amount::numeric), 0) AS debt_amount
    FROM goods_receipts r
    LEFT JOIN profiles pr ON pr.id = r.created_by
    WHERE r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND COALESCE(r.received_at, r.created_at) >= ${startSql}
      AND COALESCE(r.received_at, r.created_at) <= ${endSql}
    GROUP BY r.created_by, pr.full_name
    ORDER BY payable_amount DESC
  `);

  let rows = rowsOf<Record<string, unknown>>(result).map((r) => {
    const payable = Number(r.payable_amount ?? 0);
    const count = Number(r.receipt_count ?? 0);
    return {
      staffId: (r.staff_id as string) ?? null,
      staffName: (r.staff_name as string) ?? "Chưa rõ NV",
      receiptCount: count,
      totalQty: Number(r.total_qty ?? 0),
      payableAmount: payable,
      paidAmount: Number(r.paid_amount ?? 0),
      debtAmount: Number(r.debt_amount ?? 0),
      avgPerReceipt: count > 0 ? payable / count : 0,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.staffName.toLowerCase().includes(q));
  }

  const summary = {
    staffCount: rows.length,
    totalReceipts: rows.reduce((s, r) => s + r.receiptCount, 0),
    totalPayable: rows.reduce((s, r) => s + r.payableAmount, 0),
    topStaffName: rows[0]?.staffName ?? null,
  };

  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, page * limit);

  return { data: paged, summary, metadata: calculateMetadata(total, page, limit) };
}

export type StaffReceiptRow = {
  id: string;
  code: string;
  createdAt: Date;
  supplierName: string | null;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
};

/** Drill-down: list receipts created by a specific staff member in the period. */
export async function getPurchasesStaffReceipts(params: {
  staffId: string;
  startDate: Date;
  endDate: Date;
}): Promise<StaffReceiptRow[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const result = await db.execute(sql`
    SELECT
      r.id,
      r.code,
      r.created_at,
      s.name AS supplier_name,
      r.payable_amount,
      r.paid_amount,
      r.debt_amount
    FROM goods_receipts r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    WHERE r.created_by = ${params.staffId}
      AND r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND r.created_at >= ${startSql}
      AND r.created_at <= ${endSql}
    ORDER BY COALESCE(r.received_at, r.created_at) DESC
  `);

  return rowsOf<Record<string, unknown>>(result).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    createdAt: new Date(r.created_at as string),
    supplierName: (r.supplier_name as string) ?? null,
    payableAmount: Number(r.payable_amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    debtAmount: Number(r.debt_amount ?? 0),
  }));
}

/** Special case: list receipts with NULL created_by (Chưa rõ NV bucket). */
export async function getPurchasesUnknownStaffReceipts(params: {
  startDate: Date;
  endDate: Date;
}): Promise<StaffReceiptRow[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const result = await db.execute(sql`
    SELECT
      r.id,
      r.code,
      r.created_at,
      s.name AS supplier_name,
      r.payable_amount,
      r.paid_amount,
      r.debt_amount
    FROM goods_receipts r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    WHERE r.created_by IS NULL
      AND r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND r.created_at >= ${startSql}
      AND r.created_at <= ${endSql}
    ORDER BY COALESCE(r.received_at, r.created_at) DESC
  `);

  return rowsOf<Record<string, unknown>>(result).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    createdAt: new Date(r.created_at as string),
    supplierName: (r.supplier_name as string) ?? null,
    payableAmount: Number(r.payable_amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    debtAmount: Number(r.debt_amount ?? 0),
  }));
}
