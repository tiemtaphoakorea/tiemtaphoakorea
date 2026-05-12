/**
 * Báo cáo công nợ nhà cung cấp — opening + increase − decrease = closing.
 *  - Opening = pre-period payable from receipts − pre-period supplier_payments
 *  - Increase = goods_receipts.payable_amount in period (status='completed', not cancelled)
 *  - Decrease = supplier_payments.amount in period
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { goodsReceipts, supplierPayments } from "../schema/receipts";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type SupplierDebtRow = {
  supplierId: string;
  supplierName: string | null;
  supplierCode: string | null;
  supplierPhone: string | null;
  openingDebt: number;
  debtIncrease: number;
  debtDecrease: number;
  closingDebt: number;
};

export type SupplierDebtsReport = {
  data: SupplierDebtRow[];
  summary: {
    openingDebt: number;
    debtIncrease: number;
    debtDecrease: number;
    closingDebt: number;
    supplierCount: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getSupplierDebtsReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
  includeZero?: boolean;
}): Promise<SupplierDebtsReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const includeZero = params.includeZero ?? false;

  const aggregates = await db.execute(sql`
    WITH all_suppliers AS (
      SELECT id, code, name, phone FROM suppliers
    ),
    pre_receipt AS (
      -- Snapshot at period start: include receipts created before start AND not yet cancelled at start.
      -- Cancellation after start nets via in-period queries; cancellation before start excludes entirely.
      SELECT supplier_id,
             COALESCE(SUM(payable_amount::numeric), 0) AS pre_payable
      FROM goods_receipts
      WHERE status = 'completed'
        AND created_at < ${start}
        AND (cancelled_at IS NULL OR cancelled_at >= ${start})
      GROUP BY supplier_id
    ),
    pre_pay AS (
      SELECT supplier_id,
             COALESCE(SUM(amount::numeric), 0) AS pre_paid
      FROM supplier_payments
      WHERE paid_at < ${start}
      GROUP BY supplier_id
    ),
    in_receipt AS (
      SELECT supplier_id,
             COALESCE(SUM(payable_amount::numeric), 0) AS in_payable
      FROM goods_receipts
      WHERE status = 'completed'
        AND created_at >= ${start} AND created_at <= ${end}
        AND cancelled_at IS NULL
      GROUP BY supplier_id
    ),
    in_pay AS (
      SELECT supplier_id,
             COALESCE(SUM(amount::numeric), 0) AS in_paid
      FROM supplier_payments
      WHERE paid_at >= ${start} AND paid_at <= ${end}
      GROUP BY supplier_id
    )
    SELECT
      s.id AS supplier_id,
      s.code AS supplier_code,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      COALESCE(pr.pre_payable, 0) - COALESCE(pp.pre_paid, 0) AS opening_debt,
      COALESCE(ir.in_payable, 0) AS debt_increase,
      COALESCE(ip.in_paid, 0) AS debt_decrease,
      COALESCE(pr.pre_payable, 0) - COALESCE(pp.pre_paid, 0)
        + COALESCE(ir.in_payable, 0) - COALESCE(ip.in_paid, 0) AS closing_debt
    FROM all_suppliers s
    LEFT JOIN pre_receipt pr ON pr.supplier_id = s.id
    LEFT JOIN pre_pay pp ON pp.supplier_id = s.id
    LEFT JOIN in_receipt ir ON ir.supplier_id = s.id
    LEFT JOIN in_pay ip ON ip.supplier_id = s.id
    WHERE (
      COALESCE(pr.pre_payable, 0) - COALESCE(pp.pre_paid, 0) <> 0
      OR COALESCE(ir.in_payable, 0) <> 0
      OR COALESCE(ip.in_paid, 0) <> 0
    )
  `);

  let rows = rowsOf<Record<string, unknown>>(aggregates).map((r) => ({
    supplierId: r.supplier_id as string,
    supplierName: (r.supplier_name as string) ?? null,
    supplierCode: (r.supplier_code as string) ?? null,
    supplierPhone: (r.supplier_phone as string) ?? null,
    openingDebt: Number(r.opening_debt ?? 0),
    debtIncrease: Number(r.debt_increase ?? 0),
    debtDecrease: Number(r.debt_decrease ?? 0),
    closingDebt: Number(r.closing_debt ?? 0),
  }));

  if (!includeZero) {
    rows = rows.filter((r) => r.closingDebt !== 0);
  }

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.supplierName?.toLowerCase().includes(q) ||
        r.supplierCode?.toLowerCase().includes(q) ||
        r.supplierPhone?.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => b.closingDebt - a.closingDebt);

  const summary = {
    openingDebt: rows.reduce((s, r) => s + r.openingDebt, 0),
    debtIncrease: rows.reduce((s, r) => s + r.debtIncrease, 0),
    debtDecrease: rows.reduce((s, r) => s + r.debtDecrease, 0),
    closingDebt: rows.reduce((s, r) => s + r.closingDebt, 0),
    supplierCount: rows.length,
  };

  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, page * limit);

  return {
    data: paged,
    summary,
    metadata: calculateMetadata(total, page, limit),
  };
}

export type SupplierDebtTransaction = {
  id: string;
  date: Date;
  kind: "receipt" | "payment";
  reference: string;
  amount: number;
  note: string | null;
};

export async function getSupplierDebtTransactions(params: {
  supplierId: string;
  startDate: Date;
  endDate: Date;
}): Promise<{ increases: SupplierDebtTransaction[]; decreases: SupplierDebtTransaction[] }> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const receiptRows = await db
    .select({
      id: goodsReceipts.id,
      date: goodsReceipts.createdAt,
      code: goodsReceipts.code,
      payable: goodsReceipts.payableAmount,
      note: goodsReceipts.note,
    })
    .from(goodsReceipts)
    .where(
      and(
        eq(goodsReceipts.supplierId, params.supplierId),
        eq(goodsReceipts.status, "completed"),
        isNull(goodsReceipts.cancelledAt),
        gte(goodsReceipts.createdAt, start),
        lte(goodsReceipts.createdAt, end),
      ),
    )
    .orderBy(desc(goodsReceipts.createdAt));

  const paymentRows = await db
    .select({
      id: supplierPayments.id,
      date: supplierPayments.paidAt,
      code: supplierPayments.code,
      amount: supplierPayments.amount,
      note: supplierPayments.note,
    })
    .from(supplierPayments)
    .where(
      and(
        eq(supplierPayments.supplierId, params.supplierId),
        gte(supplierPayments.paidAt, start),
        lte(supplierPayments.paidAt, end),
      ),
    )
    .orderBy(desc(supplierPayments.paidAt));

  return {
    increases: receiptRows.map((r) => ({
      id: r.id,
      date: r.date,
      kind: "receipt" as const,
      reference: r.code,
      amount: Number(r.payable ?? 0),
      note: r.note,
    })),
    decreases: paymentRows.map((r) => ({
      id: r.id,
      date: r.date,
      kind: "payment" as const,
      reference: r.code,
      amount: Number(r.amount ?? 0),
      note: r.note,
    })),
  };
}
