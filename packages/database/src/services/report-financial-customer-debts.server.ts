/**
 * Báo cáo công nợ khách hàng — opening + increase − decrease = closing.
 *
 * Aggregates derived live from `orders` + `payments` (no opening-balance snapshot table).
 *  - Opening = pre-period orders.total − pre-period payments
 *  - Increase = orders.total in period (not cancelled)
 *  - Decrease = payments.amount in period (covers prior debt being paid in this kỳ)
 */

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { orders, payments } from "../schema/orders";
import { normalizeRange, rowsOf } from "./report-shared.server";

export type CustomerDebtRow = {
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerCode: string | null;
  openingDebt: number;
  debtIncrease: number;
  debtDecrease: number;
  closingDebt: number;
};

export type CustomerDebtsReport = {
  data: CustomerDebtRow[];
  summary: {
    openingDebt: number;
    debtIncrease: number;
    debtDecrease: number;
    closingDebt: number;
    customerCount: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getCustomerDebtsReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
  includeZero?: boolean;
}): Promise<CustomerDebtsReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const includeZero = params.includeZero ?? false;

  const aggregates = await db.execute(sql`
    WITH all_customers AS (
      SELECT id, full_name, phone, customer_code
      FROM profiles
      WHERE role = 'customer'
    ),
    pre_order AS (
      -- Snapshot at period start: include orders created before start AND not yet cancelled at start
      -- (orders cancelled later still counted opening; cancellation in period nets via in-period queries).
      SELECT customer_id,
             COALESCE(SUM(total::numeric), 0) AS pre_total
      FROM orders
      WHERE created_at < ${start}
        AND (cancelled_at IS NULL OR cancelled_at >= ${start})
      GROUP BY customer_id
    ),
    pre_pay AS (
      -- Same snapshot logic for the orders the payment belongs to.
      SELECT o.customer_id,
             COALESCE(SUM(p.amount::numeric), 0) AS pre_paid
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      WHERE p.created_at < ${start}
        AND (o.cancelled_at IS NULL OR o.cancelled_at >= ${start})
      GROUP BY o.customer_id
    ),
    in_order AS (
      SELECT customer_id,
             COALESCE(SUM(total::numeric), 0) AS in_total
      FROM orders
      WHERE created_at >= ${start} AND created_at <= ${end} AND cancelled_at IS NULL
      GROUP BY customer_id
    ),
    in_pay AS (
      SELECT o.customer_id,
             COALESCE(SUM(p.amount::numeric), 0) AS in_paid
      FROM payments p
      INNER JOIN orders o ON o.id = p.order_id
      WHERE p.created_at >= ${start} AND p.created_at <= ${end} AND o.cancelled_at IS NULL
      GROUP BY o.customer_id
    )
    SELECT
      c.id AS customer_id,
      c.full_name AS customer_name,
      c.phone AS customer_phone,
      c.customer_code AS customer_code,
      COALESCE(po.pre_total, 0) - COALESCE(pp.pre_paid, 0) AS opening_debt,
      COALESCE(io.in_total, 0) AS debt_increase,
      COALESCE(ip.in_paid, 0) AS debt_decrease,
      COALESCE(po.pre_total, 0) - COALESCE(pp.pre_paid, 0)
        + COALESCE(io.in_total, 0) - COALESCE(ip.in_paid, 0) AS closing_debt
    FROM all_customers c
    LEFT JOIN pre_order po ON po.customer_id = c.id
    LEFT JOIN pre_pay pp ON pp.customer_id = c.id
    LEFT JOIN in_order io ON io.customer_id = c.id
    LEFT JOIN in_pay ip ON ip.customer_id = c.id
    WHERE (
      COALESCE(po.pre_total, 0) - COALESCE(pp.pre_paid, 0) <> 0
      OR COALESCE(io.in_total, 0) <> 0
      OR COALESCE(ip.in_paid, 0) <> 0
    )
  `);

  let rows = rowsOf<Record<string, unknown>>(aggregates).map((r) => ({
    customerId: r.customer_id as string,
    customerName: (r.customer_name as string) ?? null,
    customerPhone: (r.customer_phone as string) ?? null,
    customerCode: (r.customer_code as string) ?? null,
    openingDebt: Number(r.opening_debt ?? 0),
    debtIncrease: Number(r.debt_increase ?? 0),
    debtDecrease: Number(r.debt_decrease ?? 0),
    closingDebt: Number(r.closing_debt ?? 0),
  }));

  if (!includeZero) {
    rows = rows.filter((r) => r.closingDebt !== 0);
  }

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.toLowerCase().includes(q) ||
        r.customerCode?.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => b.closingDebt - a.closingDebt);

  const summary = {
    openingDebt: rows.reduce((s, r) => s + r.openingDebt, 0),
    debtIncrease: rows.reduce((s, r) => s + r.debtIncrease, 0),
    debtDecrease: rows.reduce((s, r) => s + r.debtDecrease, 0),
    closingDebt: rows.reduce((s, r) => s + r.closingDebt, 0),
    customerCount: rows.length,
  };

  const total = rows.length;
  const paged = rows.slice((page - 1) * limit, page * limit);

  return {
    data: paged,
    summary,
    metadata: calculateMetadata(total, page, limit),
  };
}

export type DebtTransaction = {
  id: string;
  date: Date;
  kind: "order" | "payment";
  reference: string;
  amount: number;
  note: string | null;
};

export async function getCustomerDebtTransactions(params: {
  customerId: string;
  startDate: Date;
  endDate: Date;
}): Promise<{ increases: DebtTransaction[]; decreases: DebtTransaction[] }> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const orderRows = await db
    .select({
      id: orders.id,
      date: orders.createdAt,
      orderNumber: orders.orderNumber,
      total: orders.total,
      note: orders.adminNote,
    })
    .from(orders)
    .where(
      and(
        eq(orders.customerId, params.customerId),
        isNull(orders.cancelledAt),
        gte(orders.createdAt, start),
        lte(orders.createdAt, end),
      ),
    )
    .orderBy(desc(orders.createdAt));

  const paymentRows = await db
    .select({
      id: payments.id,
      date: payments.createdAt,
      orderNumber: orders.orderNumber,
      amount: payments.amount,
      note: payments.note,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(orders.customerId, params.customerId),
        isNull(orders.cancelledAt),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end),
      ),
    )
    .orderBy(desc(payments.createdAt));

  return {
    increases: orderRows.map((r) => ({
      id: r.id,
      date: r.date ?? new Date(0),
      kind: "order" as const,
      reference: r.orderNumber,
      amount: Number(r.total ?? 0),
      note: r.note,
    })),
    decreases: paymentRows.map((r) => ({
      id: r.id,
      date: r.date ?? new Date(0),
      kind: "payment" as const,
      reference: r.orderNumber,
      amount: Number(r.amount ?? 0),
      note: r.note,
    })),
  };
}
