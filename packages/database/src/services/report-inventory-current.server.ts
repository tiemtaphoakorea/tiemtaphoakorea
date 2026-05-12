/**
 * Báo cáo 5.1 — Tồn kho hiện tại (snapshot) + KPI Tổng giá trị kho.
 *
 * Returns current on-hand quantities with WAC cost price. This is a real-time
 * snapshot — no daily snapshot table exists, so this reflects inventory right now.
 */

import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { products, productVariants } from "../schema/products";

export type CurrentStockRow = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryId: string | null;
  categoryName: string | null;
  onHand: number;
  reserved: number;
  available: number;
  costPrice: number;
  stockValue: number;
  lowStockThreshold: number;
  stockStatus: "in-stock" | "low" | "out-of-stock";
};

export type CurrentStockKpi = {
  totalSkus: number;
  totalUnits: number;
  totalValue: number;
  lowStockSkus: number;
};

export type CurrentStockReport = {
  data: CurrentStockRow[];
  kpi: CurrentStockKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type CategoryStockRow = {
  categoryId: string | null;
  categoryName: string;
  skuCount: number;
  totalUnits: number;
  totalValue: number;
  pctOfTotal: number;
};

export type CurrentStockParams = {
  search?: string;
  categoryId?: string;
  stockStatus?: "all" | "in-stock" | "out-of-stock" | "low";
  sortBy?: "value" | "qty";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
};

function computeStockStatus(
  onHand: number,
  threshold: number,
): CurrentStockRow["stockStatus"] {
  if (onHand <= 0) return "out-of-stock";
  if (onHand <= threshold) return "low";
  return "in-stock";
}

export async function getCurrentStockReport(
  params: CurrentStockParams = {},
): Promise<CurrentStockReport> {
  const {
    search,
    categoryId,
    stockStatus = "all",
    sortBy = "value",
    sortDir = "desc",
    page = 1,
    limit = 50,
  } = params;

  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(productVariants.isActive, true)];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(productVariants.sku, pattern),
        ilike(products.name, pattern),
        ilike(productVariants.name, pattern),
      )!,
    );
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (stockStatus === "out-of-stock") {
    conditions.push(sql`${productVariants.onHand} <= 0`);
  } else if (stockStatus === "low") {
    conditions.push(
      sql`${productVariants.onHand} > 0 AND ${productVariants.onHand} <= COALESCE(${productVariants.lowStockThreshold}, 5)`,
    );
  } else if (stockStatus === "in-stock") {
    conditions.push(
      sql`${productVariants.onHand} > COALESCE(${productVariants.lowStockThreshold}, 5)`,
    );
  }

  const orderExpr =
    sortBy === "qty"
      ? sortDir === "asc"
        ? sql`${productVariants.onHand} ASC`
        : sql`${productVariants.onHand} DESC`
      : sortDir === "asc"
        ? sql`${productVariants.onHand} * COALESCE(${productVariants.costPrice}, 0) ASC`
        : sql`${productVariants.onHand} * COALESCE(${productVariants.costPrice}, 0) DESC`;

  const where = and(...conditions);

  const [rows, kpiResult] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        productName: products.name,
        variantName: productVariants.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        onHand: productVariants.onHand,
        reserved: productVariants.reserved,
        costPrice: productVariants.costPrice,
        lowStockThreshold: productVariants.lowStockThreshold,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset),

    db
      .select({
        totalSkus: sql<string>`COUNT(*)`,
        totalUnits: sql<string>`SUM(${productVariants.onHand})`,
        totalValue: sql<string>`SUM(${productVariants.onHand} * COALESCE(${productVariants.costPrice}, 0))`,
        lowStockSkus: sql<string>`SUM(CASE WHEN ${productVariants.onHand} <= COALESCE(${productVariants.lowStockThreshold}, 5) AND ${productVariants.onHand} > 0 THEN 1 ELSE 0 END)`,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(where),
  ]);

  const kpiRaw = kpiResult[0];
  const kpi: CurrentStockKpi = {
    totalSkus: Number(kpiRaw?.totalSkus ?? 0),
    totalUnits: Number(kpiRaw?.totalUnits ?? 0),
    totalValue: Number(kpiRaw?.totalValue ?? 0),
    lowStockSkus: Number(kpiRaw?.lowStockSkus ?? 0),
  };

  const data: CurrentStockRow[] = rows.map((r) => {
    const cost = Number(r.costPrice ?? 0);
    const threshold = r.lowStockThreshold ?? 5;
    return {
      id: r.id,
      sku: r.sku,
      productName: r.productName,
      variantName: r.variantName,
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? null,
      onHand: r.onHand,
      reserved: r.reserved,
      available: r.onHand - r.reserved,
      costPrice: cost,
      stockValue: r.onHand * cost,
      lowStockThreshold: threshold,
      stockStatus: computeStockStatus(r.onHand, threshold),
    };
  });

  const total = kpi.totalSkus;
  const totalPages = Math.ceil(total / limit);

  return { data, kpi, metadata: { total, page, totalPages, limit } };
}

/** Aggregate stock value and units by category for pie chart. */
export async function getCategoryStockBreakdown(): Promise<CategoryStockRow[]> {
  const rows = await db
    .select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      skuCount: sql<string>`COUNT(${productVariants.id})`,
      totalUnits: sql<string>`SUM(${productVariants.onHand})`,
      totalValue: sql<string>`SUM(${productVariants.onHand} * COALESCE(${productVariants.costPrice}, 0))`,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(productVariants.isActive, true))
    .groupBy(products.categoryId, categories.name)
    .orderBy(sql`SUM(${productVariants.onHand} * COALESCE(${productVariants.costPrice}, 0)) DESC`);

  const grandTotal = rows.reduce((s, r) => s + Number(r.totalValue ?? 0), 0);

  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? "(Chưa phân loại)",
    skuCount: Number(r.skuCount ?? 0),
    totalUnits: Number(r.totalUnits ?? 0),
    totalValue: Number(r.totalValue ?? 0),
    pctOfTotal: grandTotal > 0 ? (Number(r.totalValue ?? 0) / grandTotal) * 100 : 0,
  }));
}

/** Fetch last N movements for a single variant (used in drill-down sheet). */
export async function getVariantRecentMovements(
  variantId: string,
  limit = 30,
) {
  const { inventoryMovements } = await import("../schema/inventory");
  return db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.variantId, variantId))
    .orderBy(sql`${inventoryMovements.createdAt} DESC`)
    .limit(limit);
}

/** Search active variants for picker (SKU/name). Used by variant-picker-combobox. */
export async function searchVariants(search: string, limit = 20) {
  const pattern = `%${search}%`;
  return db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      variantName: productVariants.name,
      productName: products.name,
      onHand: productVariants.onHand,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(productVariants.isActive, true),
        or(
          ilike(productVariants.sku, pattern),
          ilike(productVariants.name, pattern),
          ilike(products.name, pattern),
        ),
      ),
    )
    .orderBy(productVariants.sku)
    .limit(limit);
}

/** Get a single variant's info (for ledger header). */
export async function getVariantById(variantId: string) {
  const rows = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      variantName: productVariants.name,
      productName: products.name,
      onHand: productVariants.onHand,
      costPrice: productVariants.costPrice,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, [variantId]))
    .limit(1);
  return rows[0] ?? null;
}
