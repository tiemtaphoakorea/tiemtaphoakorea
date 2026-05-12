/**
 * Customers reports — Top customers (6.1 top-by-revenue / 6.2 top-by-orders).
 *
 * Single `getCustomerAggregate` service shared by both reports; caller passes
 * `sortBy` to switch the ORDER BY direction.
 *
 * Also exports `getCustomerAggregateList` which returns the per-customer rows
 * used by the drilldown sheet (no paging — called with explicit limit).
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type CustomerAggregateRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
  aov: number;
  lastOrderAt: string | null;
};

export type CustomerAggregateReport = {
  data: CustomerAggregateRow[];
  summary: {
    customerCount: number;
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    topRevenue: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getCustomerAggregate(params: {
  startDate: Date;
  endDate: Date;
  sortBy?: "revenue" | "order_count";
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CustomerAggregateReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const sortBy = params.sortBy ?? "revenue";
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? 50));
  const offset = (page - 1) * limit;

  const searchClause = search
    ? sql`AND (p.full_name ILIKE ${"%" + search + "%"} OR p.phone ILIKE ${"%" + search + "%"} OR p.customer_code ILIKE ${"%" + search + "%"})`
    : sql``;

  const orderClause =
    sortBy === "order_count"
      ? sql`ORDER BY order_count DESC, revenue DESC`
      : sql`ORDER BY revenue DESC, order_count DESC`;

  const countResult = await db.execute(sql`
    SELECT COUNT(DISTINCT p.id)::int AS total
    FROM profiles p
    INNER JOIN orders o ON o.customer_id = p.id
    WHERE p.role = 'customer'
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
  `);
  const countRows = rowsOf<{ total: number }>(countResult);
  const total = Number(countRows[0]?.total ?? 0);

  const dataResult = await db.execute(sql`
    SELECT
      p.id                                          AS "customerId",
      p.full_name                                   AS "fullName",
      p.phone                                       AS "phone",
      p.customer_code                               AS "customerCode",
      COUNT(o.id)::int                              AS "orderCount",
      COALESCE(SUM(o.subtotal::numeric - o.discount::numeric), 0)::float8             AS "revenue",
      COALESCE(AVG(o.subtotal::numeric - o.discount::numeric), 0)::float8             AS "aov",
      MAX(o.stock_out_at)                                                              AS "lastOrderAt"
    FROM profiles p
    INNER JOIN orders o ON o.customer_id = p.id
    WHERE p.role = 'customer'
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
    GROUP BY p.id, p.full_name, p.phone, p.customer_code
    ${orderClause}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const data = rowsOf<CustomerAggregateRow>(dataResult).map((r) => ({
    customerId: r.customerId,
    fullName: r.fullName,
    phone: r.phone,
    customerCode: r.customerCode,
    orderCount: Number(r.orderCount),
    revenue: Number(r.revenue),
    aov: Number(r.aov),
    lastOrderAt: r.lastOrderAt ? String(r.lastOrderAt) : null,
  }));

  const summaryResult = await db.execute(sql`
    SELECT
      COUNT(DISTINCT p.id)::int             AS "customerCount",
      COALESCE(SUM(o.subtotal::numeric - o.discount::numeric), 0)::float8     AS "totalRevenue",
      COALESCE(MAX(sub.cust_rev), 0)::float8 AS "topRevenue"
    FROM profiles p
    INNER JOIN orders o ON o.customer_id = p.id
    LEFT JOIN (
      SELECT customer_id, SUM(subtotal::numeric - discount::numeric)::float8 AS cust_rev
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
        AND stock_out_at >= ${start} AND stock_out_at <= ${end}
      GROUP BY customer_id
    ) sub ON sub.customer_id = p.id
    WHERE p.role = 'customer'
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
      ${searchClause}
  `);

  const sumRow = rowsOf<{ customerCount: number; totalRevenue: number; topRevenue: number }>(
    summaryResult,
  )[0];
  const customerCount = Number(sumRow?.customerCount ?? 0);
  const totalRevenue = Number(sumRow?.totalRevenue ?? 0);
  const topRevenue = Number(sumRow?.topRevenue ?? 0);

  return {
    data,
    summary: {
      customerCount,
      totalRevenue,
      avgRevenuePerCustomer: customerCount > 0 ? totalRevenue / customerCount : 0,
      topRevenue,
    },
    metadata: calculateMetadata(total, page, limit),
  };
}
