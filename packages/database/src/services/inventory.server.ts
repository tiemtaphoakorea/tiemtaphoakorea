import { and, count, desc, eq, gte, ilike, inArray, lte, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { inventoryMovements, openingStockEntries } from "../schema/inventory";
import { costPriceHistory, products, productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import type { DbTransaction } from "../types/database";

export type MovementType =
  | "stock_out"
  | "supplier_receipt"
  | "manual_adjustment"
  | "cancellation"
  | "stock_count_balance"
  | "cost_adjustment";

export async function insertInventoryMovement(
  tx: DbTransaction,
  {
    variantId,
    type,
    quantity,
    onHandBefore,
    referenceId,
    note,
    createdBy,
  }: {
    variantId: string;
    type: MovementType;
    quantity: number;
    onHandBefore: number;
    referenceId?: string;
    note?: string;
    createdBy?: string;
  },
) {
  await tx.insert(inventoryMovements).values({
    variantId,
    type,
    quantity,
    onHandBefore,
    onHandAfter: onHandBefore + quantity,
    referenceId,
    note,
    createdBy,
  });
}

/**
 * Set the opening-stock baseline for a variant and re-chain every subsequent
 * movement so `on_hand_before/on_hand_after` stay consistent and `on_hand`
 * matches the latest movement. Idempotent — re-running with the same value
 * is a no-op.
 *
 * Used by admin UI to correct an opening figure (the historical balance
 * loaded by the migration backfill) without polluting the in-period XNT
 * report with a runtime adjustment movement.
 */
const OPENING_STOCK_NOTE = "Opening stock";

export type OpeningStockApplyEntry = {
  variantId: string;
  quantity: number;
  unitCost: number;
  effectiveDate: Date;
  note?: string | null;
};

export type OpeningStockCsvRow = {
  rowNumber: number;
  sku: string;
  openingQuantity: number;
  openingUnitCost: number;
  note: string | null;
  variantId?: string;
  productName?: string | null;
  variantName?: string | null;
  errors: string[];
};

export type OpeningStockApplyResult = {
  oldOpening: number;
  newOpening: number;
  oldUnitCost: number;
  newUnitCost: number;
  oldOnHand: number;
  newOnHand: number;
  entryId: string;
  noop: boolean;
};

/**
 * Read the current opening-stock quantity for a variant. Returns null if no
 * opening movement exists. Used by the admin dialog to display the actual
 * value the user is editing (which may differ from `product_variants.on_hand`
 * after subsequent stock-outs / receipts).
 */
export async function getOpeningStock(
  variantId: string,
): Promise<{ quantity: number | null; unitCost: number | null; effectiveDate: Date | null }> {
  const [entry] = await db
    .select({
      quantity: openingStockEntries.quantity,
      unitCost: openingStockEntries.unitCost,
      effectiveDate: openingStockEntries.effectiveDate,
    })
    .from(openingStockEntries)
    .where(eq(openingStockEntries.variantId, variantId))
    .limit(1);

  if (entry) {
    return {
      quantity: entry.quantity,
      unitCost: Number(entry.unitCost ?? 0),
      effectiveDate: entry.effectiveDate,
    };
  }

  const [row] = await db
    .select({ quantity: inventoryMovements.quantity, createdAt: inventoryMovements.createdAt })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.variantId, variantId),
        ilike(inventoryMovements.note, `${OPENING_STOCK_NOTE}%`),
      ),
    )
    .orderBy(inventoryMovements.createdAt, inventoryMovements.id)
    .limit(1);
  return { quantity: row?.quantity ?? null, unitCost: null, effectiveDate: row?.createdAt ?? null };
}

export async function updateOpeningStock({
  variantId,
  newQuantity,
  unitCost,
  effectiveDate,
  note,
  userId,
}: {
  variantId: string;
  newQuantity: number;
  unitCost?: number;
  effectiveDate?: Date;
  note?: string | null;
  userId: string;
}) {
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    throw new Error("newQuantity must be a non-negative integer");
  }
  const currentOpening = await getOpeningStock(variantId);
  const [variant] = await db
    .select({ costPrice: productVariants.costPrice })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  const [result] = await applyOpeningStockEntries({
    entries: [
      {
        variantId,
        quantity: newQuantity,
        unitCost: unitCost ?? currentOpening.unitCost ?? Number(variant?.costPrice ?? 0),
        effectiveDate: effectiveDate ?? currentOpening.effectiveDate ?? new Date(),
        note,
      },
    ],
    userId,
  });
  return result;
}

async function applySingleOpeningStockEntry(
  tx: DbTransaction,
  entry: OpeningStockApplyEntry,
  userId: string,
): Promise<OpeningStockApplyResult> {
  if (!Number.isInteger(entry.quantity) || entry.quantity < 0) {
    throw new Error("quantity must be a non-negative integer");
  }
  if (!Number.isFinite(entry.unitCost) || entry.unitCost < 0) {
    throw new Error("unitCost must be a non-negative number");
  }
  if (!(entry.effectiveDate instanceof Date) || Number.isNaN(entry.effectiveDate.getTime())) {
    throw new Error("effectiveDate must be a valid date");
  }

  const now = new Date();
  const note = entry.note?.trim() || null;

  const [variant] = await tx
    .select({
      id: productVariants.id,
      onHand: productVariants.onHand,
      costPrice: productVariants.costPrice,
    })
    .from(productVariants)
    .where(eq(productVariants.id, entry.variantId))
    .for("update");
  if (!variant) throw new Error("Variant not found");

  const [existingEntry] = await tx
    .select()
    .from(openingStockEntries)
    .where(eq(openingStockEntries.variantId, entry.variantId))
    .limit(1);
  const oldOpening = existingEntry?.quantity ?? 0;
  const oldUnitCost = Number(existingEntry?.unitCost ?? variant.costPrice ?? 0);

  const [savedEntry] = await tx
    .insert(openingStockEntries)
    .values({
      variantId: entry.variantId,
      quantity: entry.quantity,
      unitCost: entry.unitCost.toFixed(2),
      effectiveDate: entry.effectiveDate,
      note,
      status: "applied",
      createdBy: userId,
      updatedBy: userId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: openingStockEntries.variantId,
      set: {
        quantity: entry.quantity,
        unitCost: entry.unitCost.toFixed(2),
        effectiveDate: entry.effectiveDate,
        note,
        status: "applied",
        updatedBy: userId,
        updatedAt: now,
      },
    })
    .returning();

  const movementNote = note ? `${OPENING_STOCK_NOTE}: ${note}` : OPENING_STOCK_NOTE;
  const [existingMovement] = await tx
    .select({ id: inventoryMovements.id, quantity: inventoryMovements.quantity })
    .from(inventoryMovements)
    .where(
      or(
        eq(inventoryMovements.referenceId, savedEntry.id),
        and(
          eq(inventoryMovements.variantId, entry.variantId),
          ilike(inventoryMovements.note, `${OPENING_STOCK_NOTE}%`),
        ),
      ),
    )
    .orderBy(inventoryMovements.createdAt, inventoryMovements.id)
    .limit(1);

  if (existingMovement) {
    await tx
      .update(inventoryMovements)
      .set({
        quantity: entry.quantity,
        onHandAfter: entry.quantity,
        referenceId: savedEntry.id,
        note: movementNote,
        createdAt: entry.effectiveDate,
        createdBy: userId,
      })
      .where(eq(inventoryMovements.id, existingMovement.id));
  } else {
    await tx.insert(inventoryMovements).values({
      variantId: entry.variantId,
      type: "manual_adjustment",
      quantity: entry.quantity,
      onHandBefore: 0,
      onHandAfter: entry.quantity,
      referenceId: savedEntry.id,
      note: movementNote,
      createdAt: entry.effectiveDate,
      createdBy: userId,
    });
  }

  await tx.execute(sql`
      WITH chain AS (
        SELECT id,
               SUM(quantity) OVER (ORDER BY created_at, id) AS new_after
        FROM inventory_movements
        WHERE variant_id = ${entry.variantId}
      )
      UPDATE inventory_movements m
      SET on_hand_after  = c.new_after,
          on_hand_before = c.new_after - m.quantity
      FROM chain c
      WHERE m.id = c.id
    `);

  // 3. Sync product_variants.on_hand to the latest movement.
  const [latest] = await tx
    .select({ onHandAfter: inventoryMovements.onHandAfter })
    .from(inventoryMovements)
    .where(eq(inventoryMovements.variantId, entry.variantId))
    .orderBy(desc(inventoryMovements.createdAt), desc(inventoryMovements.id))
    .limit(1);

  const newOnHand = latest?.onHandAfter ?? entry.quantity;
  await tx
    .update(productVariants)
    .set({ onHand: newOnHand, costPrice: entry.unitCost.toFixed(2), updatedAt: now })
    .where(eq(productVariants.id, entry.variantId));

  if (entry.unitCost > 0 && oldUnitCost !== entry.unitCost) {
    await tx.insert(costPriceHistory).values({
      variantId: entry.variantId,
      costPrice: entry.unitCost.toFixed(2),
      effectiveDate: entry.effectiveDate,
      note: movementNote,
      createdBy: userId,
    });
  }

  return {
    oldOpening,
    newOpening: entry.quantity,
    oldUnitCost,
    newUnitCost: entry.unitCost,
    oldOnHand: variant.onHand ?? 0,
    newOnHand,
    entryId: savedEntry.id,
    noop:
      oldOpening === entry.quantity &&
      oldUnitCost === entry.unitCost &&
      existingEntry?.effectiveDate?.getTime() === entry.effectiveDate.getTime(),
  };
}

export async function applyOpeningStockEntries({
  entries,
  userId,
}: {
  entries: OpeningStockApplyEntry[];
  userId: string;
}): Promise<OpeningStockApplyResult[]> {
  if (entries.length === 0) return [];

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.variantId)) throw new Error("Duplicate variant in opening stock entries");
    seen.add(entry.variantId);
  }

  return await db.transaction(async (tx) => {
    const results: OpeningStockApplyResult[] = [];
    for (const entry of entries) {
      results.push(await applySingleOpeningStockEntry(tx, entry, userId));
    }
    return results;
  });
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseNumberCell(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  return Number(normalized || 0);
}

export async function previewOpeningStockCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: OpeningStockCsvRow[] = [];
  const header = lines[0] ? parseCsvLine(lines[0]).map((h) => h.trim()) : [];
  const indexOf = (name: string) => header.indexOf(name);
  const skuIndex = indexOf("sku");
  const quantityIndex = indexOf("openingQuantity");
  const unitCostIndex = indexOf("openingUnitCost");
  const noteIndex = indexOf("note");

  if (skuIndex < 0 || quantityIndex < 0 || unitCostIndex < 0) {
    return {
      validRows: [],
      errorRows: [
        {
          rowNumber: 1,
          sku: "",
          openingQuantity: 0,
          openingUnitCost: 0,
          note: null,
          errors: ["CSV must include sku, openingQuantity, and openingUnitCost columns"],
        },
      ] satisfies OpeningStockCsvRow[],
      summary: { totalRows: 0, totalQuantity: 0, totalValue: 0 },
    };
  }

  const seenSkus = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const sku = (cells[skuIndex] ?? "").trim();
    const quantity = parseNumberCell(cells[quantityIndex] ?? "");
    const unitCost = parseNumberCell(cells[unitCostIndex] ?? "");
    const note = noteIndex >= 0 ? (cells[noteIndex] ?? "").trim() || null : null;
    const errors: string[] = [];
    if (!sku) errors.push("SKU is required");
    if (seenSkus.has(sku)) errors.push("Duplicate SKU in CSV");
    if (!Number.isInteger(quantity) || quantity < 0) {
      errors.push("openingQuantity must be a non-negative integer");
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      errors.push("openingUnitCost must be a non-negative number");
    }
    seenSkus.add(sku);
    rows.push({
      rowNumber: i + 1,
      sku,
      openingQuantity: quantity,
      openingUnitCost: unitCost,
      note,
      errors,
    });
  }

  const skuRows = rows.filter((row) => row.sku);
  if (skuRows.length > 0) {
    const variants: Array<{
      id: string;
      sku: string;
      variantName: string;
      productName: string;
    }> = await db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        variantName: productVariants.name,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        inArray(
          productVariants.sku,
          skuRows.map((row) => row.sku),
        ),
      );
    const bySku = new Map(variants.map((variant) => [variant.sku, variant]));
    for (const row of skuRows) {
      const variant = bySku.get(row.sku);
      if (!variant) {
        row.errors.push("SKU does not exist");
      } else {
        row.variantId = variant.id;
        row.variantName = variant.variantName;
        row.productName = variant.productName;
      }
    }
  }

  const validRows = rows.filter((row) => row.errors.length === 0);
  return {
    validRows,
    errorRows: rows.filter((row) => row.errors.length > 0),
    summary: {
      totalRows: validRows.length,
      totalQuantity: validRows.reduce((sum, row) => sum + row.openingQuantity, 0),
      totalValue: validRows.reduce(
        (sum, row) => sum + row.openingQuantity * row.openingUnitCost,
        0,
      ),
    },
  };
}

export async function listOpeningStockEntries({
  search,
  page = 1,
  limit = 100,
}: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const where = search
    ? or(
        ilike(productVariants.sku, `%${search}%`),
        ilike(products.name, `%${search}%`),
        ilike(productVariants.name, `%${search}%`),
      )
    : undefined;

  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      productName: products.name,
      variantName: productVariants.name,
      categoryName: categories.name,
      currentOnHand: productVariants.onHand,
      currentCostPrice: productVariants.costPrice,
      openingQuantity: openingStockEntries.quantity,
      openingUnitCost: openingStockEntries.unitCost,
      effectiveDate: openingStockEntries.effectiveDate,
      note: openingStockEntries.note,
      status: openingStockEntries.status,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(openingStockEntries, eq(openingStockEntries.variantId, productVariants.id))
    .where(where)
    .orderBy(products.name, productVariants.sku)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(where);

  return {
    data: rows.map((row) => ({
      ...row,
      currentCostPrice: Number(row.currentCostPrice ?? 0),
      openingQuantity: row.openingQuantity ?? null,
      openingUnitCost: row.openingUnitCost == null ? null : Number(row.openingUnitCost),
      openingValue:
        row.openingQuantity == null || row.openingUnitCost == null
          ? null
          : row.openingQuantity * Number(row.openingUnitCost),
    })),
    summary: {
      totalVariants: total,
      enteredVariants: rows.filter((row) => row.openingQuantity != null).length,
      totalQuantity: rows.reduce((sum, row) => sum + (row.openingQuantity ?? 0), 0),
      totalValue: rows.reduce(
        (sum, row) => sum + (row.openingQuantity ?? 0) * Number(row.openingUnitCost ?? 0),
        0,
      ),
    },
    metadata: { page, limit, total },
  };
}

export async function adjustInventory({
  variantId,
  quantity,
  note,
  userId,
}: {
  variantId: string;
  quantity: number;
  note?: string;
  userId: string;
}) {
  return await db.transaction(async (tx) => {
    const [variant] = await tx
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .for("update");

    if (!variant) throw new Error("Variant not found");

    const onHandBefore = variant.onHand ?? 0;

    await tx
      .update(productVariants)
      .set({ onHand: sql`${productVariants.onHand} + ${quantity}` })
      .where(eq(productVariants.id, variantId));

    const [movement] = await tx
      .insert(inventoryMovements)
      .values({
        variantId,
        type: "manual_adjustment",
        quantity,
        onHandBefore,
        onHandAfter: onHandBefore + quantity,
        note,
        createdBy: userId,
      })
      .returning();

    return movement;
  });
}

export async function getInventoryMovements({
  variantId,
  type,
  search,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}: {
  variantId?: string;
  type?: MovementType;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const conditions: SQL[] = [];
  if (variantId) conditions.push(eq(inventoryMovements.variantId, variantId));
  if (type) conditions.push(eq(inventoryMovements.type, type));
  if (startDate) conditions.push(gte(inventoryMovements.createdAt, startDate));
  if (endDate) conditions.push(lte(inventoryMovements.createdAt, endDate));
  if (search) conditions.push(sql`${productVariants.sku} ILIKE ${`%${search}%`}`);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: inventoryMovements.id,
        variantId: inventoryMovements.variantId,
        variantSku: productVariants.sku,
        variantName: productVariants.name,
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        onHandBefore: inventoryMovements.onHandBefore,
        onHandAfter: inventoryMovements.onHandAfter,
        referenceId: inventoryMovements.referenceId,
        note: inventoryMovements.note,
        createdAt: inventoryMovements.createdAt,
        createdByName: profiles.fullName,
      })
      .from(inventoryMovements)
      .leftJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
      .leftJoin(profiles, eq(inventoryMovements.createdBy, profiles.id))
      .where(where)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(inventoryMovements)
      .leftJoin(productVariants, eq(inventoryMovements.variantId, productVariants.id))
      .where(where),
  ]);

  return {
    data,
    metadata: {
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

/**
 * Inventory valuation: per-SKU on-hand × cost price.
 * Used by the warehouse report (báo cáo kho).
 */
export async function getInventoryValuation({
  search,
  categoryId,
  page = 1,
  limit = 20,
}: {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20;
  const offset = (safePage - 1) * safeLimit;
  const conditions: SQL[] = [];
  if (search) {
    conditions.push(
      sql`(${productVariants.sku} ILIKE ${`%${search}%`} OR ${products.name} ILIKE ${`%${search}%`} OR ${productVariants.name} ILIKE ${`%${search}%`})`,
    );
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: count() })
    .from(productVariants)
    .leftJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where);

  const [totalsRow] = await db
    .select({
      totalQty: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
      totalValue: sql<number>`coalesce(sum(${productVariants.onHand} * ${productVariants.costPrice}), 0)`,
    })
    .from(productVariants)
    .leftJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where);

  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      variantName: productVariants.name,
      productId: products.id,
      productName: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
      onHand: productVariants.onHand,
      costPrice: productVariants.costPrice,
      retailPrice: productVariants.price,
    })
    .from(productVariants)
    .leftJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(desc(productVariants.onHand))
    .limit(safeLimit)
    .offset(offset);

  const items = rows.map((r) => {
    const onHand = r.onHand ?? 0;
    const costPrice = Number(r.costPrice ?? 0);
    return {
      ...r,
      stockValue: (onHand * costPrice).toFixed(2),
    };
  });

  const total = Number(countRow?.count ?? 0);
  const totalValue = Number(totalsRow?.totalValue ?? 0).toFixed(2);
  const totalQty = Number(totalsRow?.totalQty ?? 0);

  return {
    items,
    totals: { totalValue, totalQty, sku: total },
    metadata: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export type InventoryFlowRow = {
  variantId: string;
  sku: string | null;
  variantName: string | null;
  productName: string | null;
  categoryName: string | null;
  categoryId: string | null;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
};

export async function getInventoryFlowReport({
  startDate,
  endDate,
  search,
  categoryId,
  page = 1,
  limit = 30,
}: {
  startDate: Date;
  endDate: Date;
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}) {
  const offset = (page - 1) * limit;

  // Optional WHERE fragments composed into Drizzle sql template
  const searchCond = search
    ? sql`AND (pv.sku ILIKE ${`%${search}%`} OR p.name ILIKE ${`%${search}%`} OR pv.name ILIKE ${`%${search}%`})`
    : sql``;
  const categoryCond = categoryId ? sql`AND p.category_id = ${categoryId}` : sql``;

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const ctePrefix = sql`
    WITH period_movements AS (
      SELECT variant_id,
        SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END)      AS qty_in,
        SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) AS qty_out
      FROM inventory_movements
      WHERE created_at >= ${startIso}::timestamptz AND created_at <= ${endIso}::timestamptz
      GROUP BY variant_id
    ),
    begin_stock AS (
      SELECT DISTINCT ON (variant_id)
        variant_id, on_hand_after AS opening_stock
      FROM inventory_movements
      WHERE created_at < ${startIso}::timestamptz
      ORDER BY variant_id, created_at DESC
    )
  `;

  const baseFrom = sql`
    FROM product_variants pv
    LEFT JOIN products p   ON p.id = pv.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN period_movements pm ON pm.variant_id = pv.id
    LEFT JOIN begin_stock  bs ON bs.variant_id = pv.id
    WHERE (pm.qty_in > 0 OR pm.qty_out > 0 OR COALESCE(bs.opening_stock, 0) > 0 OR pv.on_hand > 0)
      ${searchCond} ${categoryCond}
  `;

  const [countResult, aggregateResult, dataResult] = await Promise.all([
    db.execute(sql`${ctePrefix} SELECT COUNT(*) AS total ${baseFrom}`),
    // Report-wide aggregate (not page-scoped) for accurate footer totals
    db.execute(sql`
      ${ctePrefix}
      SELECT
        COALESCE(SUM(COALESCE(pm.qty_in,  0)), 0) AS "totalIn",
        COALESCE(SUM(COALESCE(pm.qty_out, 0)), 0) AS "totalOut"
      ${baseFrom}
    `),
    db.execute(sql`
      ${ctePrefix}
      SELECT
        pv.id                                                                         AS "variantId",
        pv.sku                                                                        AS sku,
        pv.name                                                                       AS "variantName",
        p.name                                                                        AS "productName",
        c.name                                                                        AS "categoryName",
        c.id                                                                          AS "categoryId",
        COALESCE(bs.opening_stock, 0)                                                 AS "openingStock",
        COALESCE(pm.qty_in,  0)                                                       AS "stockIn",
        COALESCE(pm.qty_out, 0)                                                       AS "stockOut",
        COALESCE(bs.opening_stock, 0) + COALESCE(pm.qty_in, 0) - COALESCE(pm.qty_out, 0) AS "closingStock"
      ${baseFrom}
      ORDER BY (COALESCE(pm.qty_in, 0) + COALESCE(pm.qty_out, 0)) DESC, pv.sku
      LIMIT ${limit} OFFSET ${offset}
    `),
  ]);

  const total = Number((countResult[0] as Record<string, unknown>)?.total ?? 0);
  const agg = aggregateResult[0] as Record<string, unknown>;
  const items = dataResult as unknown as InventoryFlowRow[];

  return {
    items,
    totals: {
      totalIn: Number(agg?.totalIn ?? 0),
      totalOut: Number(agg?.totalOut ?? 0),
      skuCount: total,
    },
    metadata: { total, page, totalPages: Math.ceil(total / limit) },
  };
}

export async function getInventoryDailySummary({
  variantId,
  startDate,
  endDate,
}: {
  variantId?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const conditions: SQL[] = [];
  if (variantId) conditions.push(eq(inventoryMovements.variantId, variantId));
  if (startDate) conditions.push(gte(inventoryMovements.createdAt, startDate));
  if (endDate) conditions.push(lte(inventoryMovements.createdAt, endDate));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Group by Vietnam business day. `created_at` is `timestamp without tz` storing
  // wall-clock UTC, so we attach UTC then convert to Asia/Ho_Chi_Minh before truncating.
  const businessDate = sql`((${inventoryMovements.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;

  return db
    .select({
      date: sql<string>`${businessDate}`,
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} > 0 THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} < 0 THEN ABS(${inventoryMovements.quantity}) ELSE 0 END), 0)`,
    })
    .from(inventoryMovements)
    .where(where)
    .groupBy(businessDate)
    .orderBy(sql`${businessDate} DESC`);
}
