/**
 * Báo cáo nhập hàng theo sản phẩm (by-product).
 * Source: goods_receipt_items JOIN goods_receipts (completed) JOIN product_variants JOIN products.
 *
 * Time anchor: `COALESCE(received_at, created_at)` (ngày NCC giao thực tế, fallback ngày tạo).
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type PurchasesByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  totalQty: number;
  lineTotal: number;
  avgUnitCost: number;
  currentCostPrice: number;
};

export type PurchasesByProductReport = {
  data: PurchasesByProductRow[];
  summary: {
    skuCount: number;
    totalQty: number;
    totalValue: number;
    avgCost: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getPurchasesByProductReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PurchasesByProductReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));

  const result = await db.execute(sql`
    SELECT
      gri.variant_id,
      pv.sku,
      p.name AS product_name,
      pv.name AS variant_name,
      SUM(gri.quantity)::int AS total_qty,
      COALESCE(SUM(gri.line_total::numeric), 0) AS line_total,
      COALESCE(AVG(gri.unit_cost::numeric), 0) AS avg_unit_cost,
      COALESCE(pv.cost_price::numeric, 0) AS current_cost_price
    FROM goods_receipt_items gri
    INNER JOIN goods_receipts r ON r.id = gri.receipt_id
    INNER JOIN product_variants pv ON pv.id = gri.variant_id
    INNER JOIN products p ON p.id = pv.product_id
    WHERE r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND COALESCE(r.received_at, r.created_at) >= ${start}
      AND COALESCE(r.received_at, r.created_at) <= ${end}
    GROUP BY gri.variant_id, pv.sku, p.name, pv.name, pv.cost_price
    ORDER BY line_total DESC
  `);

  let rows = rowsOf<Record<string, unknown>>(result).map((r) => ({
    variantId: r.variant_id as string,
    sku: r.sku as string,
    productName: r.product_name as string,
    variantName: r.variant_name as string,
    totalQty: Number(r.total_qty ?? 0),
    lineTotal: Number(r.line_total ?? 0),
    avgUnitCost: Number(r.avg_unit_cost ?? 0),
    currentCostPrice: Number(r.current_cost_price ?? 0),
  }));

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.sku.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.variantName.toLowerCase().includes(q),
    );
  }

  const summary = {
    skuCount: rows.length,
    totalQty: rows.reduce((s, r) => s + r.totalQty, 0),
    totalValue: rows.reduce((s, r) => s + r.lineTotal, 0),
    avgCost: rows.length > 0
      ? rows.reduce((s, r) => s + r.avgUnitCost, 0) / rows.length
      : 0,
  };

  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, page * limit);

  return { data: paged, summary, metadata: calculateMetadata(total, page, limit) };
}

export type ProductReceiptRow = {
  id: string;
  code: string;
  createdAt: Date;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

/** Drill-down: list receipts containing a specific variant in the period. */
export async function getPurchasesProductReceipts(params: {
  variantId: string;
  startDate: Date;
  endDate: Date;
}): Promise<ProductReceiptRow[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const result = await db.execute(sql`
    SELECT
      r.id,
      r.code,
      r.created_at,
      gri.quantity,
      gri.unit_cost,
      gri.line_total
    FROM goods_receipt_items gri
    INNER JOIN goods_receipts r ON r.id = gri.receipt_id
    WHERE gri.variant_id = ${params.variantId}
      AND r.status = 'completed'
      AND r.cancelled_at IS NULL
      AND r.created_at >= ${start}
      AND r.created_at <= ${end}
    ORDER BY COALESCE(r.received_at, r.created_at) DESC
  `);

  return rowsOf<Record<string, unknown>>(result).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    createdAt: new Date(r.created_at as string),
    quantity: Number(r.quantity ?? 0),
    unitCost: Number(r.unit_cost ?? 0),
    lineTotal: Number(r.line_total ?? 0),
  }));
}
