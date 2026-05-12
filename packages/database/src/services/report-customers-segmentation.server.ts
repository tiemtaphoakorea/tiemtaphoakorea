/**
 * New vs Returning customers report (6.4).
 *
 * Uses CTE to classify each in-period customer as 'new' (first order is within
 * the period) or 'returning' (had an order before the period start).
 *
 * Also exports `getCustomersInBucket` for drilldown list of KH in a bucket.
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type SegmentBucket = "new" | "returning";

export type SegmentBucketRow = {
  bucket: SegmentBucket;
  customers: number;
  orders: number;
  revenue: number;
  profit: number;
  aov: number;
};

export type SegmentTimeSeries = {
  period: string;
  newCustomers: number;
  returningCustomers: number;
};

export type NewVsReturningReport = {
  data: SegmentBucketRow[];
  timeSeries: SegmentTimeSeries[];
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    newRate: number;
    returningRevenue: number;
  };
};

export type BucketCustomerRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
};

export async function getNewVsReturningReport(params: {
  startDate: Date;
  endDate: Date;
}): Promise<NewVsReturningReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  // Bucket aggregation using CTE (matches spec exactly)
  const bucketResult = await db.execute(sql`
    WITH first_order AS (
      SELECT customer_id, MIN(stock_out_at) AS first_at
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
      GROUP BY customer_id
    ),
    in_period AS (
      SELECT DISTINCT customer_id
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
        AND stock_out_at >= ${start}
        AND stock_out_at <= ${end}
    ),
    classified AS (
      SELECT
        ip.customer_id,
        CASE
          WHEN fo.first_at >= ${start} AND fo.first_at <= ${end} THEN 'new'
          ELSE 'returning'
        END AS bucket
      FROM in_period ip
      INNER JOIN first_order fo ON fo.customer_id = ip.customer_id
    )
    SELECT
      c.bucket                                    AS "bucket",
      COUNT(DISTINCT c.customer_id)::int          AS "customers",
      COUNT(o.id)::int                            AS "orders",
      COALESCE(SUM(o.subtotal::numeric - o.discount::numeric), 0)::float8           AS "revenue",
      COALESCE(SUM(o.profit), 0)::float8          AS "profit"
    FROM classified c
    INNER JOIN orders o
      ON o.customer_id = c.customer_id
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
    GROUP BY c.bucket
  `);

  const rawBuckets = rowsOf<{
    bucket: string;
    customers: number;
    orders: number;
    revenue: number;
    profit: number;
  }>(bucketResult);

  const data: SegmentBucketRow[] = rawBuckets.map((r) => {
    const customers = Number(r.customers);
    const orders = Number(r.orders);
    const revenue = Number(r.revenue);
    return {
      bucket: r.bucket as SegmentBucket,
      customers,
      orders,
      revenue,
      profit: Number(r.profit),
      aov: orders > 0 ? revenue / orders : 0,
    };
  });

  // Time-series: per-day new vs returning counts
  const tsResult = await db.execute(sql`
    WITH first_order AS (
      SELECT customer_id, MIN(created_at) AS first_at
      FROM orders
      WHERE cancelled_at IS NULL
      GROUP BY customer_id
    ),
    daily_orders AS (
      SELECT
        DATE_TRUNC('day', o.stock_out_at)::date  AS day,
        o.customer_id,
        fo.first_at
      FROM orders o
      INNER JOIN first_order fo ON fo.customer_id = o.customer_id
      WHERE o.cancelled_at IS NULL
        AND o.fulfillment_status IN ('stock_out', 'completed')
        AND o.stock_out_at >= ${start}
        AND o.stock_out_at <= ${end}
    )
    SELECT
      TO_CHAR(day, 'YYYY-MM-DD')                                AS "period",
      COUNT(DISTINCT CASE WHEN first_at >= ${start} AND first_at <= ${end} THEN customer_id END)::int AS "newCustomers",
      COUNT(DISTINCT CASE WHEN first_at < ${start} THEN customer_id END)::int AS "returningCustomers"
    FROM daily_orders
    GROUP BY day
    ORDER BY day
  `);

  const timeSeries: SegmentTimeSeries[] = rowsOf<{
    period: string;
    newCustomers: number;
    returningCustomers: number;
  }>(tsResult).map((r) => ({
    period: r.period,
    newCustomers: Number(r.newCustomers),
    returningCustomers: Number(r.returningCustomers),
  }));

  const newRow = data.find((r) => r.bucket === "new");
  const returningRow = data.find((r) => r.bucket === "returning");
  const newCustomers = newRow?.customers ?? 0;
  const returningCustomers = returningRow?.customers ?? 0;
  const totalCustomers = newCustomers + returningCustomers;

  return {
    data,
    timeSeries,
    summary: {
      totalCustomers,
      newCustomers,
      returningCustomers,
      newRate: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0,
      returningRevenue: returningRow?.revenue ?? 0,
    },
  };
}

/** Drilldown: paginated list of customers in a specific segment bucket. */
export async function getCustomersInBucket(params: {
  bucket: SegmentBucket;
  startDate: Date;
  endDate: Date;
  page?: number;
  limit?: number;
}): Promise<{ data: BucketCustomerRow[]; metadata: ReturnType<typeof calculateMetadata> }> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? 50));
  const offset = (page - 1) * limit;

  const countResult = await db.execute(sql`
    WITH first_order AS (
      SELECT customer_id, MIN(stock_out_at) AS first_at
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
      GROUP BY customer_id
    ),
    in_period AS (
      SELECT DISTINCT customer_id
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
        AND stock_out_at >= ${start}
        AND stock_out_at <= ${end}
    ),
    classified AS (
      SELECT ip.customer_id
      FROM in_period ip
      INNER JOIN first_order fo ON fo.customer_id = ip.customer_id
      WHERE ${params.bucket === "new"
        ? sql`fo.first_at >= ${start} AND fo.first_at <= ${end}`
        : sql`fo.first_at < ${start}`}
    )
    SELECT COUNT(*)::int AS total FROM classified
  `);
  const total = Number(rowsOf<{ total: number }>(countResult)[0]?.total ?? 0);

  const dataResult = await db.execute(sql`
    WITH first_order AS (
      SELECT customer_id, MIN(stock_out_at) AS first_at
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
      GROUP BY customer_id
    ),
    in_period AS (
      SELECT DISTINCT customer_id
      FROM orders
      WHERE cancelled_at IS NULL
        AND fulfillment_status IN ('stock_out', 'completed')
        AND stock_out_at >= ${start}
        AND stock_out_at <= ${end}
    ),
    classified AS (
      SELECT ip.customer_id
      FROM in_period ip
      INNER JOIN first_order fo ON fo.customer_id = ip.customer_id
      WHERE ${params.bucket === "new"
        ? sql`fo.first_at >= ${start} AND fo.first_at <= ${end}`
        : sql`fo.first_at < ${start}`}
    )
    SELECT
      p.id                                        AS "customerId",
      p.full_name                                 AS "fullName",
      p.phone                                     AS "phone",
      p.customer_code                             AS "customerCode",
      COUNT(o.id)::int                                                            AS "orderCount",
      COALESCE(SUM(o.subtotal::numeric - o.discount::numeric), 0)::float8          AS "revenue"
    FROM classified c
    INNER JOIN profiles p ON p.id = c.customer_id
    INNER JOIN orders o
      ON o.customer_id = c.customer_id
      AND o.cancelled_at IS NULL
      AND o.fulfillment_status IN ('stock_out', 'completed')
      AND o.stock_out_at >= ${start}
      AND o.stock_out_at <= ${end}
    GROUP BY p.id, p.full_name, p.phone, p.customer_code
    ORDER BY revenue DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const data = rowsOf<BucketCustomerRow>(dataResult).map((r) => ({
    customerId: r.customerId,
    fullName: r.fullName,
    phone: r.phone,
    customerCode: r.customerCode,
    orderCount: Number(r.orderCount),
    revenue: Number(r.revenue),
  }));

  return { data, metadata: calculateMetadata(total, page, limit) };
}
