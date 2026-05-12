/**
 * Báo cáo 5.4 — Cảnh báo hết hàng (Low Stock Alert).
 *
 * Shows variants where on_hand <= COALESCE(low_stock_threshold, 5).
 * Includes variants with on_hand = 0 (out-of-stock).
 */

import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { products, productVariants } from "../schema/products";

export type LowStockRow = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryName: string | null;
  onHand: number;
  lowStockThreshold: number;
  status: "out-of-stock" | "low";
  costPrice: number;
};

export type LowStockKpi = {
  lowStockSkus: number;
  outOfStockSkus: number;
  totalRemainingUnits: number;
};

export type LowStockReport = {
  data: LowStockRow[];
  kpi: LowStockKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type LowStockParams = {
  search?: string;
  categoryId?: string;
  status?: "all" | "low" | "out";
  page?: number;
  limit?: number;
};

export async function getLowStockReport(
  params: LowStockParams = {},
): Promise<LowStockReport> {
  const { search, categoryId, status = "all", page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  const baseCondition = sql`
    ${productVariants.isActive} = true
    AND ${productVariants.onHand} <= COALESCE(${productVariants.lowStockThreshold}, 5)
  `;

  const conditions = [baseCondition];

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

  if (status === "out") {
    conditions.push(sql`${productVariants.onHand} = 0`);
  } else if (status === "low") {
    conditions.push(sql`${productVariants.onHand} > 0`);
  }

  const where = and(...conditions);

  const [rows, kpiResult, totalResult] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        productName: products.name,
        variantName: productVariants.name,
        categoryName: categories.name,
        onHand: productVariants.onHand,
        lowStockThreshold: productVariants.lowStockThreshold,
        costPrice: productVariants.costPrice,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(where)
      .orderBy(productVariants.onHand)
      .limit(limit)
      .offset(offset),

    // KPI over ALL low-stock (ignore status filter for KPI)
    db
      .select({
        lowStockSkus: sql<string>`SUM(CASE WHEN ${productVariants.onHand} > 0 THEN 1 ELSE 0 END)`,
        outOfStockSkus: sql<string>`SUM(CASE WHEN ${productVariants.onHand} <= 0 THEN 1 ELSE 0 END)`,
        totalRemainingUnits: sql<string>`SUM(GREATEST(${productVariants.onHand}, 0))`,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(productVariants.isActive, true),
          sql`${productVariants.onHand} <= COALESCE(${productVariants.lowStockThreshold}, 5)`,
          search
            ? or(
                ilike(productVariants.sku, `%${search}%`),
                ilike(products.name, `%${search}%`),
                ilike(productVariants.name, `%${search}%`),
              )
            : undefined,
          categoryId ? eq(products.categoryId, categoryId) : undefined,
        ),
      ),

    db
      .select({ count: sql<string>`COUNT(*)` })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(where),
  ]);

  const kpiRaw = kpiResult[0];
  const kpi: LowStockKpi = {
    lowStockSkus: Number(kpiRaw?.lowStockSkus ?? 0),
    outOfStockSkus: Number(kpiRaw?.outOfStockSkus ?? 0),
    totalRemainingUnits: Number(kpiRaw?.totalRemainingUnits ?? 0),
  };

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  const data: LowStockRow[] = rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    productName: r.productName,
    variantName: r.variantName,
    categoryName: r.categoryName ?? null,
    onHand: r.onHand,
    lowStockThreshold: r.lowStockThreshold ?? 5,
    status: r.onHand <= 0 ? "out-of-stock" : "low",
    costPrice: Number(r.costPrice ?? 0),
  }));

  return { data, kpi, metadata: { total, page, totalPages, limit } };
}
