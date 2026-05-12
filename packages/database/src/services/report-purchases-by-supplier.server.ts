/**
 * Báo cáo nhập hàng theo nhà cung cấp (by-supplier).
 * Source: goods_receipts JOIN suppliers WHERE status='completed' AND cancelled_at IS NULL.
 *
 * Time anchor: `COALESCE(received_at, created_at)` (ngày NCC giao thực tế, fallback ngày tạo).
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf, sqlTimestamp } from "./report-shared.server";

export type PurchasesBySupplierRow = {
  supplierId: string | null;
  supplierName: string | null;
  supplierCode: string | null;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
  avgPerReceipt: number;
};

export type PurchasesBySupplierReport = {
  data: PurchasesBySupplierRow[];
  summary: {
    supplierCount: number;
    totalReceipts: number;
    totalPayable: number;
    topSupplierName: string | null;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getPurchasesBySupplierReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PurchasesBySupplierReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const result = await db.execute(sql`
    SELECT
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.code AS supplier_code,
      COUNT(r.id)::int AS receipt_count,
      COALESCE(SUM(r.total_qty), 0)::int AS total_qty,
      COALESCE(SUM(r.payable_amount::numeric), 0) AS payable_amount,
      COALESCE(SUM(r.paid_amount::numeric), 0) AS paid_amount,
      COALESCE(SUM(r.debt_amount::numeric), 0) AS debt_amount
    FROM goods_receipts r
    LEFT JOIN suppliers s ON s.id = r.supplier_id
    WHERE r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND COALESCE(r.received_at, r.created_at) >= ${startSql}
      AND COALESCE(r.received_at, r.created_at) <= ${endSql}
    GROUP BY s.id, s.name, s.code
    ORDER BY payable_amount DESC
  `);

  let rows = rowsOf<Record<string, unknown>>(result).map((r) => {
    const payable = Number(r.payable_amount ?? 0);
    const count = Number(r.receipt_count ?? 0);
    return {
      supplierId: (r.supplier_id as string) ?? null,
      supplierName: (r.supplier_name as string) ?? null,
      supplierCode: (r.supplier_code as string) ?? null,
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
    rows = rows.filter(
      (r) => r.supplierName?.toLowerCase().includes(q) || r.supplierCode?.toLowerCase().includes(q),
    );
  }

  const summary = {
    supplierCount: rows.length,
    totalReceipts: rows.reduce((s, r) => s + r.receiptCount, 0),
    totalPayable: rows.reduce((s, r) => s + r.payableAmount, 0),
    topSupplierName: rows[0]?.supplierName ?? null,
  };

  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, page * limit);

  return { data: paged, summary, metadata: calculateMetadata(total, page, limit) };
}

export type SupplierReceiptRow = {
  id: string;
  code: string;
  createdAt: Date;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
};

/** Drill-down: list receipts for a given supplier in the period. */
export async function getPurchasesSupplierReceipts(params: {
  supplierId: string;
  startDate: Date;
  endDate: Date;
}): Promise<SupplierReceiptRow[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const result = await db.execute(sql`
    SELECT id, code, created_at, payable_amount, paid_amount, debt_amount, status
    FROM goods_receipts
    WHERE supplier_id = ${params.supplierId}
      AND status = 'completed'
      AND cancelled_at IS NULL
      AND COALESCE(received_at, created_at) >= ${startSql}
      AND COALESCE(received_at, created_at) <= ${endSql}
    ORDER BY COALESCE(received_at, created_at) DESC
  `);

  return rowsOf<Record<string, unknown>>(result).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    createdAt: new Date(r.created_at as string),
    payableAmount: Number(r.payable_amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    debtAmount: Number(r.debt_amount ?? 0),
    status: r.status as string,
  }));
}
