/**
 * Báo cáo 5.2 — Sổ kho (Inventory Ledger) per-variant.
 *
 * Requires exactly one variantId. Returns chronological movement log with
 * running balance (onHandAfter from the movement record itself).
 *
 * Note on unit_cost: schema does NOT have unit_cost on inventory_movements.
 * We approximate using the current WAC (productVariants.costPrice) as the
 * "estimated cost per unit" — historical per-unit cost is not snapshotted.
 * UI surfaces this caveat explicitly.
 *
 * reference_type is derived from movement.type since schema has no referenceType col.
 */

import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";
import { movementReferenceRoute } from "./report-inventory-shared.server";

export type LedgerRow = {
  id: string;
  createdAt: string;
  type: string;
  /** Positive = stock in/adjustment; for stock_out this is the qty moved (positive stored) */
  quantity: number;
  qtyIn: number;
  qtyOut: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  /** Derived URL for reference link — null if no route applies */
  referenceRoute: string | null;
  note: string | null;
  /** Approximate WAC at time of query (current costPrice — not historical) */
  estimatedUnitCost: number;
  estimatedValue: number;
};

export type LedgerKpi = {
  /** on_hand_before of the earliest movement in period, or current onHand if no movements */
  openingBalance: number;
  totalQtyIn: number;
  totalQtyOut: number;
  /** on_hand_after of the latest movement in period, or current onHand */
  closingBalance: number;
  /** SUM(qtyIn * estimatedUnitCost) */
  estimatedValueIn: number;
};

export type LedgerReport = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentOnHand: number;
  /** Current WAC — used as estimated unit cost for value column */
  costPrice: number;
  data: LedgerRow[];
  kpi: LedgerKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type LedgerParams = {
  variantId: string;
  startDate: Date;
  endDate: Date;
  /** Filter by bucket: 'in' | 'out' | 'adjust' | 'all' */
  typeFilter?: "in" | "out" | "adjust" | "all";
  search?: string;
  page?: number;
  limit?: number;
};

type RawVariantInfo = {
  id: string;
  sku: string;
  variant_name: string;
  product_name: string;
  on_hand: number;
  cost_price: string | null;
};

type RawLedgerRow = {
  id: string;
  created_at: string;
  type: string;
  quantity: string | number;
  on_hand_before: string | number;
  on_hand_after: string | number;
  reference_id: string | null;
  note: string | null;
  total_count: string | number;
};

type RawKpiRow = {
  opening: number | null;
  closing: number | null;
  total_qty_in: string | number;
  total_qty_out: string | number;
};

export async function getLedgerReport(params: LedgerParams): Promise<LedgerReport> {
  const { variantId, search, typeFilter = "all", page = 1, limit = 50 } = params;
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const offset = (page - 1) * limit;

  // Fetch variant info
  const variantResult = await db.execute(sql`
    SELECT pv.id, pv.sku, pv.name AS variant_name, p.name AS product_name,
           pv.on_hand, pv.cost_price
    FROM product_variants pv
    INNER JOIN products p ON p.id = pv.product_id
    WHERE pv.id = ${variantId}
    LIMIT 1
  `);

  const variantRaw = rowsOf<RawVariantInfo>(variantResult)[0];
  if (!variantRaw) {
    throw new Error(`Variant ${variantId} not found`);
  }

  const costPrice = Number(variantRaw.cost_price ?? 0);
  const currentOnHand = Number(variantRaw.on_hand ?? 0);

  // Build movement query based on typeFilter and optional search
  const movResult = await (async () => {
    if (typeFilter === "in") {
      if (search) {
        const pattern = `%${search}%`;
        return db.execute(sql`
          SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
                 m.reference_id, m.note, COUNT(*) OVER () AS total_count
          FROM inventory_movements m
          WHERE m.variant_id = ${variantId}
            AND m.created_at BETWEEN ${start} AND ${end}
            AND m.type = 'supplier_receipt'
            AND (m.note ILIKE ${pattern} OR CAST(m.reference_id AS text) ILIKE ${pattern})
          ORDER BY m.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `);
      }
      return db.execute(sql`
        SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
               m.reference_id, m.note, COUNT(*) OVER () AS total_count
        FROM inventory_movements m
        WHERE m.variant_id = ${variantId}
          AND m.created_at BETWEEN ${start} AND ${end}
          AND m.type = 'supplier_receipt'
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    if (typeFilter === "out") {
      if (search) {
        const pattern = `%${search}%`;
        return db.execute(sql`
          SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
                 m.reference_id, m.note, COUNT(*) OVER () AS total_count
          FROM inventory_movements m
          WHERE m.variant_id = ${variantId}
            AND m.created_at BETWEEN ${start} AND ${end}
            AND m.type = 'stock_out'
            AND (m.note ILIKE ${pattern} OR CAST(m.reference_id AS text) ILIKE ${pattern})
          ORDER BY m.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `);
      }
      return db.execute(sql`
        SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
               m.reference_id, m.note, COUNT(*) OVER () AS total_count
        FROM inventory_movements m
        WHERE m.variant_id = ${variantId}
          AND m.created_at BETWEEN ${start} AND ${end}
          AND m.type = 'stock_out'
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    if (typeFilter === "adjust") {
      if (search) {
        const pattern = `%${search}%`;
        return db.execute(sql`
          SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
                 m.reference_id, m.note, COUNT(*) OVER () AS total_count
          FROM inventory_movements m
          WHERE m.variant_id = ${variantId}
            AND m.created_at BETWEEN ${start} AND ${end}
            AND m.type IN ('manual_adjustment','cancellation','stock_count_balance','cost_adjustment')
            AND (m.note ILIKE ${pattern} OR CAST(m.reference_id AS text) ILIKE ${pattern})
          ORDER BY m.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `);
      }
      return db.execute(sql`
        SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
               m.reference_id, m.note, COUNT(*) OVER () AS total_count
        FROM inventory_movements m
        WHERE m.variant_id = ${variantId}
          AND m.created_at BETWEEN ${start} AND ${end}
          AND m.type IN ('manual_adjustment','cancellation','stock_count_balance','cost_adjustment')
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    // typeFilter === "all"
    if (search) {
      const pattern = `%${search}%`;
      return db.execute(sql`
        SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
               m.reference_id, m.note, COUNT(*) OVER () AS total_count
        FROM inventory_movements m
        WHERE m.variant_id = ${variantId}
          AND m.created_at BETWEEN ${start} AND ${end}
          AND (m.note ILIKE ${pattern} OR CAST(m.reference_id AS text) ILIKE ${pattern})
        ORDER BY m.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }
    return db.execute(sql`
      SELECT m.id, m.created_at, m.type, m.quantity, m.on_hand_before, m.on_hand_after,
             m.reference_id, m.note, COUNT(*) OVER () AS total_count
      FROM inventory_movements m
      WHERE m.variant_id = ${variantId}
        AND m.created_at BETWEEN ${start} AND ${end}
      ORDER BY m.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `);
  })();

  // KPI aggregation
  const kpiResult = await db.execute(sql`
    SELECT
      (SELECT on_hand_before FROM inventory_movements
       WHERE variant_id = ${variantId} AND created_at BETWEEN ${start} AND ${end}
       ORDER BY created_at ASC LIMIT 1) AS opening,
      (SELECT on_hand_after FROM inventory_movements
       WHERE variant_id = ${variantId} AND created_at BETWEEN ${start} AND ${end}
       ORDER BY created_at DESC LIMIT 1) AS closing,
      COALESCE(SUM(CASE WHEN type = 'supplier_receipt' THEN quantity ELSE 0 END), 0) AS total_qty_in,
      -- stock_out stored as negative; negate to get positive count
      COALESCE(SUM(CASE WHEN type = 'stock_out' THEN -quantity ELSE 0 END), 0) AS total_qty_out
    FROM inventory_movements
    WHERE variant_id = ${variantId} AND created_at BETWEEN ${start} AND ${end}
  `);

  const kpiRaw = rowsOf<RawKpiRow>(kpiResult)[0];
  const openingBalance = kpiRaw?.opening != null ? Number(kpiRaw.opening) : currentOnHand;
  const closingBalance = kpiRaw?.closing != null ? Number(kpiRaw.closing) : currentOnHand;
  const totalQtyIn = Number(kpiRaw?.total_qty_in ?? 0);
  const totalQtyOut = Number(kpiRaw?.total_qty_out ?? 0);

  const movementRows = rowsOf<RawLedgerRow>(movResult);
  const total = movementRows.length > 0 ? Number(movementRows[0]!.total_count ?? 0) : 0;
  const totalPages = Math.ceil(total / limit);

  const data: LedgerRow[] = movementRows.map((r) => {
    const isIn = r.type === "supplier_receipt";
    const isOut = r.type === "stock_out";
    // stock_out quantity is stored negative; use abs for display
    const qty = Number(r.quantity ?? 0);
    const displayQty = Math.abs(qty);
    const estimatedValue = (isIn || isOut) ? displayQty * costPrice : 0;

    return {
      id: r.id,
      createdAt: String(r.created_at),
      type: r.type,
      quantity: qty,
      qtyIn: isIn ? displayQty : 0,
      qtyOut: isOut ? displayQty : 0,
      onHandBefore: Number(r.on_hand_before ?? 0),
      onHandAfter: Number(r.on_hand_after ?? 0),
      referenceId: r.reference_id,
      referenceRoute: movementReferenceRoute(r.type, r.reference_id),
      note: r.note,
      estimatedUnitCost: costPrice,
      estimatedValue,
    };
  });

  const kpi: LedgerKpi = {
    openingBalance,
    totalQtyIn,
    totalQtyOut,
    closingBalance,
    estimatedValueIn: totalQtyIn * costPrice,
  };

  return {
    variantId,
    sku: variantRaw.sku,
    productName: variantRaw.product_name,
    variantName: variantRaw.variant_name,
    currentOnHand,
    costPrice,
    data,
    kpi,
    metadata: { total, page, totalPages, limit },
  };
}
