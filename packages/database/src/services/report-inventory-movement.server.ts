/**
 * Báo cáo 5.3 — Xuất-nhập-tồn theo kỳ (so sánh kỳ trước).
 *
 * Aggregate per-variant with CTE:
 *   - opening = on_hand_before of earliest movement in period; fallback = pv.on_hand - net_change
 *   - closing = pv.on_hand (current, real-time)
 *   - qty_in = SUM where type = 'supplier_receipt'
 *   - qty_out = SUM where type = 'stock_out' (stored as positive qty, sign is direction)
 *   - qty_adjust = SUM of remaining types (can be negative for reversals)
 *
 * Uses raw SQL via db.execute(sql`...`) for DISTINCT ON (PG-specific).
 */

import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type InOutMovementRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  opening: number;
  qtyIn: number;
  qtyOut: number;
  qtyAdjust: number;
  closing: number;
};

export type InOutMovementKpi = {
  totalQtyIn: number;
  totalQtyOut: number;
  totalQtyAdjust: number;
  variantsWithMovement: number;
};

export type InOutMovementReport = {
  data: InOutMovementRow[];
  kpi: InOutMovementKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type MovementDrillRow = {
  id: string;
  createdAt: string;
  type: string;
  quantity: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  note: string | null;
};

export type InOutMovementParams = {
  startDate: Date;
  endDate: Date;
  search?: string;
  typeFilter?: "in" | "out" | "adjust" | "all";
  page?: number;
  limit?: number;
};

type RawMovementRow = {
  variant_id: string;
  sku: string;
  product_name: string;
  variant_name: string;
  opening: string | number;
  qty_in: string | number;
  qty_out: string | number;
  qty_adjust: string | number;
  on_hand: number;
  total_count: string | number;
};

type RawDrillRow = {
  id: string;
  created_at: string;
  type: string;
  quantity: number;
  on_hand_before: number;
  on_hand_after: number;
  reference_id: string | null;
  note: string | null;
};

export async function getInOutMovementReport(
  params: InOutMovementParams,
): Promise<InOutMovementReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const { search, typeFilter = "all", page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  if (search) {
    const pattern = `%${search}%`;
    const result = await db.execute(sql`
      WITH agg AS (
        SELECT
          m.variant_id,
          SUM(CASE WHEN m.type = 'supplier_receipt' THEN m.quantity ELSE 0 END) AS qty_in,
          -- stock_out is stored as negative quantity; negate to get positive display value
          SUM(CASE WHEN m.type = 'stock_out' THEN -m.quantity ELSE 0 END) AS qty_out,
          SUM(CASE WHEN m.type IN ('manual_adjustment','stock_count_balance','cost_adjustment','cancellation')
              THEN m.quantity ELSE 0 END) AS qty_adjust
        FROM inventory_movements m
        WHERE m.created_at BETWEEN ${start} AND ${end}
        GROUP BY m.variant_id
      ),
      opening AS (
        SELECT DISTINCT ON (variant_id)
          variant_id,
          on_hand_before AS opening
        FROM inventory_movements
        WHERE created_at BETWEEN ${start} AND ${end}
        ORDER BY variant_id, created_at ASC
      )
      SELECT
        pv.id AS variant_id,
        pv.sku,
        p.name AS product_name,
        pv.name AS variant_name,
        -- fallback: closing - net_in + net_out - adjust (qty_out already positive)
        COALESCE(o.opening, pv.on_hand - COALESCE(a.qty_in,0) + COALESCE(a.qty_out,0) - COALESCE(a.qty_adjust,0)) AS opening,
        COALESCE(a.qty_in, 0) AS qty_in,
        COALESCE(a.qty_out, 0) AS qty_out,
        COALESCE(a.qty_adjust, 0) AS qty_adjust,
        pv.on_hand,
        COUNT(*) OVER () AS total_count
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN agg a ON a.variant_id = pv.id
      LEFT JOIN opening o ON o.variant_id = pv.id
      WHERE pv.is_active = true
        AND (pv.sku ILIKE ${pattern} OR p.name ILIKE ${pattern} OR pv.name ILIKE ${pattern})
      ORDER BY (COALESCE(a.qty_in,0) + COALESCE(a.qty_out,0)) DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    return buildReport(rowsOf<RawMovementRow>(result), page, limit);
  }

  // No search — simpler query without ILIKE
  const result = await db.execute(sql`
    WITH agg AS (
      SELECT
        m.variant_id,
        SUM(CASE WHEN m.type = 'supplier_receipt' THEN m.quantity ELSE 0 END) AS qty_in,
        -- stock_out is stored as negative quantity; negate to get positive display value
        SUM(CASE WHEN m.type = 'stock_out' THEN -m.quantity ELSE 0 END) AS qty_out,
        SUM(CASE WHEN m.type IN ('manual_adjustment','stock_count_balance','cost_adjustment','cancellation')
            THEN m.quantity ELSE 0 END) AS qty_adjust
      FROM inventory_movements m
      WHERE m.created_at BETWEEN ${start} AND ${end}
      GROUP BY m.variant_id
    ),
    opening AS (
      SELECT DISTINCT ON (variant_id)
        variant_id,
        on_hand_before AS opening
      FROM inventory_movements
      WHERE created_at BETWEEN ${start} AND ${end}
      ORDER BY variant_id, created_at ASC
    )
    SELECT
      pv.id AS variant_id,
      pv.sku,
      p.name AS product_name,
      pv.name AS variant_name,
      -- fallback: closing - net_in + net_out - adjust (qty_out already positive)
      COALESCE(o.opening, pv.on_hand - COALESCE(a.qty_in,0) + COALESCE(a.qty_out,0) - COALESCE(a.qty_adjust,0)) AS opening,
      COALESCE(a.qty_in, 0) AS qty_in,
      COALESCE(a.qty_out, 0) AS qty_out,
      COALESCE(a.qty_adjust, 0) AS qty_adjust,
      pv.on_hand,
      COUNT(*) OVER () AS total_count
    FROM product_variants pv
    INNER JOIN products p ON p.id = pv.product_id
    INNER JOIN agg a ON a.variant_id = pv.id
    LEFT JOIN opening o ON o.variant_id = pv.id
    WHERE pv.is_active = true
    ORDER BY (COALESCE(a.qty_in,0) + COALESCE(a.qty_out,0)) DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  // Apply type filter in JS for the no-search path (avoids duplicating SQL branches)
  let rows = rowsOf<RawMovementRow>(result);
  if (typeFilter === "in") rows = rows.filter((r) => Number(r.qty_in) > 0);
  // qty_out is already positive after SQL negation
  else if (typeFilter === "out") rows = rows.filter((r) => Number(r.qty_out) > 0);
  else if (typeFilter === "adjust") rows = rows.filter((r) => Number(r.qty_adjust) !== 0);

  return buildReport(rows, page, limit);
}

function buildReport(
  rows: RawMovementRow[],
  page: number,
  limit: number,
): InOutMovementReport {
  const total = rows.length > 0 ? Number(rows[0]!.total_count ?? rows.length) : 0;
  const totalPages = Math.ceil(total / limit);

  const data: InOutMovementRow[] = rows.map((r) => ({
    variantId: r.variant_id,
    sku: r.sku,
    productName: r.product_name,
    variantName: r.variant_name,
    opening: Number(r.opening ?? 0),
    qtyIn: Number(r.qty_in ?? 0),
    qtyOut: Number(r.qty_out ?? 0),
    qtyAdjust: Number(r.qty_adjust ?? 0),
    closing: Number(r.on_hand ?? 0),
  }));

  const kpi: InOutMovementKpi = {
    totalQtyIn: data.reduce((s, r) => s + r.qtyIn, 0),
    totalQtyOut: data.reduce((s, r) => s + r.qtyOut, 0),
    totalQtyAdjust: data.reduce((s, r) => s + r.qtyAdjust, 0),
    variantsWithMovement: total,
  };

  return { data, kpi, metadata: { total, page, totalPages, limit } };
}

/** Drill-down: movements for a specific variant within a date range (for log sheet). */
export async function getVariantMovementsInPeriod(
  variantId: string,
  startDate: Date,
  endDate: Date,
  limit = 100,
): Promise<MovementDrillRow[]> {
  const { start, end } = normalizeRange(startDate, endDate);

  const result = await db.execute(sql`
    SELECT
      m.id,
      m.created_at,
      m.type,
      m.quantity,
      m.on_hand_before,
      m.on_hand_after,
      m.reference_id,
      m.note
    FROM inventory_movements m
    WHERE m.variant_id = ${variantId}
      AND m.created_at BETWEEN ${start} AND ${end}
    ORDER BY m.created_at ASC
    LIMIT ${limit}
  `);

  return rowsOf<RawDrillRow>(result).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    type: r.type,
    quantity: Number(r.quantity ?? 0),
    onHandBefore: Number(r.on_hand_before ?? 0),
    onHandAfter: Number(r.on_hand_after ?? 0),
    referenceId: r.reference_id,
    note: r.note,
  }));
}
