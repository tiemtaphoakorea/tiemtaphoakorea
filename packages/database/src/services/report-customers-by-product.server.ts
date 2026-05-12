/**
 * Customers by product report (6.3) — "SP nào kéo nhiều khách nhất?"
 *
 * Groups order_items by variant, counts DISTINCT customers per variant.
 * Also exposes `getCustomersForVariant` for the drilldown sheet (list KH mua SP X).
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type CustomersByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  customerCount: number;
  orderCount: number;
  qty: number;
  revenue: number;
};

export type CustomersByProductReport = {
  data: CustomersByProductRow[];
  summary: {
    skuCount: number;
    totalUniqueCustomers: number;
    topProductName: string | null;
    avgCustomersPerSku: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export type VariantCustomerRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  purchaseCount: number;
  totalQty: number;
  totalSpend: number;
};

export async function getCustomersByProduct(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  sortBy?: "customer_count" | "revenue" | "qty";
  page?: number;
  limit?: number;
}): Promise<CustomersByProductReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const sortBy = params.sortBy ?? "customer_count";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const searchClause = search
    ? sql`AND (p.name ILIKE ${"%" + search + "%"} OR pv.sku ILIKE ${"%" + search + "%"})`
    : sql``;

  // Separate search clause for the topProductName subquery (which uses p2/pv2/oi2/o2 aliases)
  const searchClauseInner = search
    ? sql`AND (p2.name ILIKE ${"%" + search + "%"} OR pv2.sku ILIKE ${"%" + search + "%"})`
    : sql``;

  const orderClause =
    sortBy === "revenue"
      ? sql`ORDER BY revenue DESC`
      : sortBy === "qty"
        ? sql`ORDER BY qty DESC`
        : sql`ORDER BY customer_count DESC`;

  const countResult = await db.execute(sql`
    SELECT COUNT(DISTINCT oi.variant_id)::int AS total
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN product_variants pv ON pv.id = oi.variant_id
    INNER JOIN products p ON p.id = pv.product_id
    WHERE o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
  `);
  const countRows = rowsOf<{ total: number }>(countResult);
  const total = Number(countRows[0]?.total ?? 0);

  const dataResult = await db.execute(sql`
    SELECT
      oi.variant_id                                       AS "variantId",
      pv.sku                                              AS "sku",
      p.name                                              AS "productName",
      pv.name                                             AS "variantName",
      COUNT(DISTINCT o.customer_id)::int                  AS "customerCount",
      COUNT(DISTINCT o.id)::int                           AS "orderCount",
      COALESCE(SUM(oi.quantity), 0)::int                  AS "qty",
      COALESCE(SUM(oi.line_total), 0)::float8             AS "revenue"
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN product_variants pv ON pv.id = oi.variant_id
    INNER JOIN products p ON p.id = pv.product_id
    WHERE o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
    GROUP BY oi.variant_id, pv.sku, p.name, pv.name
    ${orderClause}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const data = rowsOf<CustomersByProductRow>(dataResult).map((r) => ({
    variantId: r.variantId,
    sku: r.sku,
    productName: r.productName,
    variantName: r.variantName,
    customerCount: Number(r.customerCount),
    orderCount: Number(r.orderCount),
    qty: Number(r.qty),
    revenue: Number(r.revenue),
  }));

  const summaryResult = await db.execute(sql`
    SELECT
      COUNT(DISTINCT oi.variant_id)::int                AS "skuCount",
      COUNT(DISTINCT o.customer_id)::int                AS "totalUniqueCustomers",
      (
        SELECT p2.name || CASE WHEN pv2.name <> '' THEN ' - ' || pv2.name ELSE '' END
        FROM order_items oi2
        INNER JOIN orders o2 ON o2.id = oi2.order_id
        INNER JOIN product_variants pv2 ON pv2.id = oi2.variant_id
        INNER JOIN products p2 ON p2.id = pv2.product_id
        WHERE o2.cancelled_at IS NULL
          AND o2.fulfillment_status IN ('stock_out', 'completed')
          AND o2.stock_out_at >= ${start}
          AND o2.stock_out_at <= ${end}
          ${searchClauseInner}
        GROUP BY p2.name, pv2.name
        ORDER BY COUNT(DISTINCT o2.customer_id) DESC
        LIMIT 1
      ) AS "topProductName"
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN product_variants pv ON pv.id = oi.variant_id
    INNER JOIN products p ON p.id = pv.product_id
    WHERE o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
  `);

  const sumRow = rowsOf<{ skuCount: number; totalUniqueCustomers: number; topProductName: string | null }>(
    summaryResult,
  )[0];

  const skuCount = Number(sumRow?.skuCount ?? 0);
  const totalUniqueCustomers = Number(sumRow?.totalUniqueCustomers ?? 0);

  return {
    data,
    summary: {
      skuCount,
      totalUniqueCustomers,
      topProductName: sumRow?.topProductName ?? null,
      avgCustomersPerSku: skuCount > 0 ? totalUniqueCustomers / skuCount : 0,
    },
    metadata: calculateMetadata(total, page, limit),
  };
}

/** Drilldown: list customers who bought a specific variant in the period. */
export async function getCustomersForVariant(params: {
  variantId: string;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}): Promise<{ data: VariantCustomerRow[]; metadata: ReturnType<typeof calculateMetadata> }> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? 50));
  const offset = (page - 1) * limit;

  const countResult = await db.execute(sql`
    SELECT COUNT(DISTINCT o.customer_id)::int AS total
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE oi.variant_id = ${params.variantId}
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
  `);
  const total = Number(rowsOf<{ total: number }>(countResult)[0]?.total ?? 0);

  const dataResult = await db.execute(sql`
    SELECT
      p.id                                        AS "customerId",
      p.full_name                                 AS "fullName",
      p.phone                                     AS "phone",
      p.customer_code                             AS "customerCode",
      COUNT(DISTINCT o.id)::int                   AS "purchaseCount",
      COALESCE(SUM(oi.quantity), 0)::int          AS "totalQty",
      COALESCE(SUM(oi.line_total), 0)::float8     AS "totalSpend"
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN profiles p ON p.id = o.customer_id
    WHERE oi.variant_id = ${params.variantId}
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
    GROUP BY p.id, p.full_name, p.phone, p.customer_code
    ORDER BY "totalSpend" DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const data = rowsOf<VariantCustomerRow>(dataResult).map((r) => ({
    customerId: r.customerId,
    fullName: r.fullName,
    phone: r.phone,
    customerCode: r.customerCode,
    purchaseCount: Number(r.purchaseCount),
    totalQty: Number(r.totalQty),
    totalSpend: Number(r.totalSpend),
  }));

  return { data, metadata: calculateMetadata(total, page, limit) };
}
