/**
 * Báo cáo dòng tiền — Inflow (customer payments) − Outflow (supplier payments + expenses) = Net.
 *
 * `created_at` / `paid_at` / `date` columns are `timestamp without tz` storing wall-clock UTC.
 * Convert to Asia/Ho_Chi_Minh before truncating to avoid day-boundary drift.
 */

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../schema/expenses";
import { orderStatusHistory, orders, payments } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { supplierPayments } from "../schema/receipts";
import { suppliers } from "../schema/suppliers";
import { normalizeRange, rowsOf, sqlTimestamp, TRUNC_FMT } from "./report-shared.server";

export type CashFlowPeriodRow = {
  period: string; // YYYY-MM-DD (day), YYYY-Www (week), YYYY-MM (month)
  inflow: number;
  outflow: number;
  net: number;
};

export type CashFlowReport = {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  byPeriod: CashFlowPeriodRow[];
  breakdown: {
    customerPayments: number;
    supplierPayments: number;
    expenses: number;
  };
};

function cashflowOrderPredicate() {
  return sql`(${orders.cancelledAt} IS NULL OR EXISTS (
    SELECT 1
    FROM ${orderStatusHistory}
    WHERE ${orderStatusHistory.orderId} = ${orders.id}
      AND ${orderStatusHistory.note} LIKE '[RETURNED]%'
  ))`;
}

export async function getCashFlowReport(params: {
  startDate: Date;
  endDate: Date;
  groupBy?: "day" | "week" | "month";
}): Promise<CashFlowReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const groupBy = params.groupBy ?? "day";
  const fmt = TRUNC_FMT[groupBy];
  const startSql = sqlTimestamp(start);
  const endSql = sqlTimestamp(end);

  const tz = sql`'Asia/Ho_Chi_Minh'`;

  const inflowRowsP = db.execute(sql`
    SELECT to_char(date_trunc(${fmt.trunc}, (p.created_at AT TIME ZONE 'UTC') AT TIME ZONE ${tz}), ${fmt.format}) AS period,
           COALESCE(SUM(p.amount::numeric), 0) AS inflow
    FROM payments p
    INNER JOIN orders o ON o.id = p.order_id
    WHERE p.created_at >= ${startSql} AND p.created_at <= ${endSql}
      AND (
        o.cancelled_at IS NULL
        OR EXISTS (
          SELECT 1
          FROM order_status_history osh
          WHERE osh.order_id = o.id AND osh.note LIKE '[RETURNED]%'
        )
      )
    GROUP BY 1
  `);

  const outflowRowsP = db.execute(sql`
    WITH sp AS (
      SELECT date_trunc(${fmt.trunc}, (paid_at AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS period_dt,
             SUM(amount::numeric) AS amount
      FROM supplier_payments
      WHERE paid_at >= ${startSql} AND paid_at <= ${endSql}
      GROUP BY 1
    ),
    ex AS (
      SELECT date_trunc(${fmt.trunc}, (date AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS period_dt,
             SUM(amount::numeric) AS amount
      FROM expenses
      WHERE date >= ${startSql} AND date <= ${endSql}
      GROUP BY 1
    )
    SELECT to_char(period_dt, ${fmt.format}) AS period,
           COALESCE(SUM(amount), 0) AS outflow
    FROM (
      SELECT period_dt, amount FROM sp
      UNION ALL
      SELECT period_dt, amount FROM ex
    ) merged
    GROUP BY period_dt
    ORDER BY period_dt
  `);

  const breakdownP = Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)`.mapWith(Number),
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .where(
        and(cashflowOrderPredicate(), gte(payments.createdAt, start), lte(payments.createdAt, end)),
      ),
    db
      .select({
        total: sql<number>`coalesce(sum(${supplierPayments.amount}::numeric), 0)`.mapWith(Number),
      })
      .from(supplierPayments)
      .where(and(gte(supplierPayments.paidAt, start), lte(supplierPayments.paidAt, end))),
    db
      .select({
        total: sql<number>`coalesce(sum(${expenses.amount}::numeric), 0)`.mapWith(Number),
      })
      .from(expenses)
      .where(and(gte(expenses.date, start), lte(expenses.date, end))),
  ]);

  const [inflowRows, outflowRows, [[cust], [supp], [exp]]] = await Promise.all([
    inflowRowsP,
    outflowRowsP,
    breakdownP,
  ]);

  const inflowMap = new Map<string, number>();
  for (const r of rowsOf<Record<string, unknown>>(inflowRows)) {
    inflowMap.set(String(r.period), Number(r.inflow ?? 0));
  }
  const outflowMap = new Map<string, number>();
  for (const r of rowsOf<Record<string, unknown>>(outflowRows)) {
    outflowMap.set(String(r.period), Number(r.outflow ?? 0));
  }

  const periods = Array.from(new Set([...inflowMap.keys(), ...outflowMap.keys()])).sort();
  const byPeriod: CashFlowPeriodRow[] = periods.map((p) => {
    const inflow = inflowMap.get(p) ?? 0;
    const outflow = outflowMap.get(p) ?? 0;
    return { period: p, inflow, outflow, net: inflow - outflow };
  });

  const customerPayments = cust?.total ?? 0;
  const supplierPaymentsTotal = supp?.total ?? 0;
  const expensesTotal = exp?.total ?? 0;
  const totalInflow = customerPayments;
  const totalOutflow = supplierPaymentsTotal + expensesTotal;

  return {
    totalInflow,
    totalOutflow,
    netCashFlow: totalInflow - totalOutflow,
    byPeriod,
    breakdown: {
      customerPayments,
      supplierPayments: supplierPaymentsTotal,
      expenses: expensesTotal,
    },
  };
}

export type CashFlowTransaction = {
  id: string;
  date: Date;
  kind: "customer-payment" | "supplier-payment" | "expense";
  reference: string;
  party: string | null;
  amount: number; // positive=inflow, negative=outflow
  note: string | null;
};

export async function getCashFlowTransactions(params: {
  startDate: Date;
  endDate: Date;
}): Promise<CashFlowTransaction[]> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);

  const [inflows, supplierOutflows, expenseOutflows] = await Promise.all([
    db
      .select({
        id: payments.id,
        date: payments.createdAt,
        orderNumber: orders.orderNumber,
        customerName: profiles.fullName,
        amount: payments.amount,
        note: payments.note,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .innerJoin(profiles, eq(profiles.id, orders.customerId))
      .where(
        and(cashflowOrderPredicate(), gte(payments.createdAt, start), lte(payments.createdAt, end)),
      )
      .orderBy(desc(payments.createdAt)),
    db
      .select({
        id: supplierPayments.id,
        date: supplierPayments.paidAt,
        code: supplierPayments.code,
        supplierName: suppliers.name,
        amount: supplierPayments.amount,
        note: supplierPayments.note,
      })
      .from(supplierPayments)
      .leftJoin(suppliers, eq(suppliers.id, supplierPayments.supplierId))
      .where(and(gte(supplierPayments.paidAt, start), lte(supplierPayments.paidAt, end)))
      .orderBy(desc(supplierPayments.paidAt)),
    db
      .select({
        id: expenses.id,
        date: expenses.date,
        description: expenses.description,
        amount: expenses.amount,
      })
      .from(expenses)
      .where(and(gte(expenses.date, start), lte(expenses.date, end)))
      .orderBy(desc(expenses.date)),
  ]);

  const all: CashFlowTransaction[] = [
    ...inflows.map((r) => ({
      id: r.id,
      date: r.date ?? new Date(0),
      kind: "customer-payment" as const,
      reference: r.orderNumber,
      party: r.customerName,
      amount: Number(r.amount ?? 0),
      note: r.note,
    })),
    ...supplierOutflows.map((r) => ({
      id: r.id,
      date: r.date,
      kind: "supplier-payment" as const,
      reference: r.code,
      party: r.supplierName,
      amount: -Number(r.amount ?? 0),
      note: r.note,
    })),
    ...expenseOutflows.map((r) => ({
      id: r.id,
      date: r.date,
      kind: "expense" as const,
      reference: r.description,
      party: null,
      amount: -Number(r.amount ?? 0),
      note: null,
    })),
  ];
  all.sort((a, b) => b.date.getTime() - a.date.getTime());
  return all;
}
