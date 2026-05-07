import { and, count, desc, eq, gte, lte, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { inventoryMovements } from "../schema/inventory";
import { products, productVariants } from "../schema/products";
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

  return db
    .select({
      date: sql<string>`DATE(${inventoryMovements.createdAt})`,
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} > 0 THEN ${inventoryMovements.quantity} ELSE 0 END), 0)`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${inventoryMovements.quantity} < 0 THEN ABS(${inventoryMovements.quantity}) ELSE 0 END), 0)`,
    })
    .from(inventoryMovements)
    .where(where)
    .groupBy(sql`DATE(${inventoryMovements.createdAt})`)
    .orderBy(sql`DATE(${inventoryMovements.createdAt}) DESC`);
}
