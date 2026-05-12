/**
 * Báo cáo chi tiết theo đơn hàng (sales/by-order).
 * Lists eligible orders in period with customer + staff info + payment summary.
 * Revenue = subtotal - discount per order.
 *
 * Time anchor: `orders.stockOutAt` (cùng P&L). Default eligibility: `fulfillmentStatus IN
 * (stock_out, completed)`. User có thể narrow thêm qua `fulfillmentStatus` filter param
 * (chỉ trong 2 giá trị eligible).
 */

import { and, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { db } from "../db";
import { orders } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { normalizeRange } from "./report-shared.server";

export type SalesByOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  staffName: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  revenue: number;
  paidAmount: number;
  debtAmount: number;
  profit: number;
};

export type SalesByOrderReport = {
  data: SalesByOrderRow[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalPaid: number;
    totalDebt: number;
    totalProfit: number;
    paymentStatusBreakdown: Record<string, number>;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

// Alias tables for double-join on profiles
const customer = profiles;

export async function getSalesByOrderReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  page?: number;
  limit?: number;
}): Promise<SalesByOrderReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const searchFilter = params.search
    ? sql`(${orders.orderNumber} ilike ${"%" + params.search + "%"} or ${customer.fullName} ilike ${"%" + params.search + "%"})`
    : undefined;
  const paymentFilter = params.paymentStatus
    ? sql`${orders.paymentStatus} = ${params.paymentStatus}`
    : undefined;
  const fulfillmentFilter = params.fulfillmentStatus
    ? sql`${orders.fulfillmentStatus} = ${params.fulfillmentStatus}`
    : undefined;

  const conditions = and(
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [
      FULFILLMENT_STATUS.STOCK_OUT,
      FULFILLMENT_STATUS.COMPLETED,
    ]),
    gte(orders.stockOutAt, start),
    lte(orders.stockOutAt, end),
    searchFilter,
    paymentFilter,
    fulfillmentFilter,
  );

  const countResult = await db
    .select({ c: sql<number>`count(*)`.mapWith(Number) })
    .from(orders)
    .innerJoin(customer, sql`${customer.id} = ${orders.customerId}`)
    .where(conditions);
  const total = countResult[0]?.c ?? 0;

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      customerName: customer.fullName,
      createdBy: orders.createdBy,
      paymentStatus: orders.paymentStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      total: sql<number>`${orders.total}::numeric`.mapWith(Number),
      subtotal: sql<number>`${orders.subtotal}::numeric`.mapWith(Number),
      discount: sql<number>`${orders.discount}::numeric`.mapWith(Number),
      paidAmount: sql<number>`coalesce(${orders.paidAmount}::numeric, 0)`.mapWith(Number),
      profit: sql<number>`coalesce(${orders.profit}::numeric, 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(customer, sql`${customer.id} = ${orders.customerId}`)
    .where(conditions)
    .orderBy(sql`${orders.stockOutAt} desc`)
    .limit(limit)
    .offset(offset);

  // Fetch staff names for the page
  const staffIds = [...new Set(rows.map((r) => r.createdBy).filter(Boolean))] as string[];
  const staffMap = new Map<string, string>();
  if (staffIds.length > 0) {
    const staffRows = await db
      .select({ id: profiles.id, fullName: profiles.fullName })
      .from(profiles)
      .where(sql`${profiles.id} = any(${staffIds})`);
    for (const s of staffRows) staffMap.set(s.id, s.fullName);
  }

  // Summary over full result set
  const summaryResult = await db
    .select({
      totalOrders: sql<number>`count(*)`.mapWith(Number),
      totalRevenue: sql<number>`coalesce(sum(${orders.subtotal}::numeric - ${orders.discount}::numeric), 0)`.mapWith(Number),
      totalPaid: sql<number>`coalesce(sum(${orders.paidAmount}::numeric), 0)`.mapWith(Number),
      totalProfit: sql<number>`coalesce(sum(${orders.profit}::numeric), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(customer, sql`${customer.id} = ${orders.customerId}`)
    .where(conditions);

  // Payment status breakdown
  const breakdownRows = await db
    .select({
      status: orders.paymentStatus,
      cnt: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(
      and(
        isNull(orders.cancelledAt),
        inArray(orders.fulfillmentStatus, [
          FULFILLMENT_STATUS.STOCK_OUT,
          FULFILLMENT_STATUS.COMPLETED,
        ]),
        gte(orders.stockOutAt, start),
        lte(orders.stockOutAt, end),
      ),
    )
    .groupBy(orders.paymentStatus);

  const paymentStatusBreakdown: Record<string, number> = {};
  for (const b of breakdownRows) paymentStatusBreakdown[b.status] = b.cnt;

  const s = summaryResult[0] ?? { totalOrders: 0, totalRevenue: 0, totalPaid: 0, totalProfit: 0 };
  const totalDebt = s.totalRevenue - s.totalPaid;

  return {
    data: rows.map((r) => {
      const revenue = r.subtotal - r.discount;
      return {
        id: r.id,
        orderNumber: r.orderNumber,
        createdAt: r.createdAt ? String(r.createdAt) : "",
        customerName: r.customerName,
        staffName: r.createdBy ? (staffMap.get(r.createdBy) ?? null) : null,
        paymentStatus: r.paymentStatus,
        fulfillmentStatus: r.fulfillmentStatus,
        total: r.total,
        revenue,
        paidAmount: r.paidAmount,
        debtAmount: Math.max(0, revenue - r.paidAmount),
        profit: r.profit,
      };
    }),
    summary: {
      totalOrders: s.totalOrders,
      totalRevenue: s.totalRevenue,
      totalPaid: s.totalPaid,
      totalDebt: Math.max(0, totalDebt),
      totalProfit: s.totalProfit,
      paymentStatusBreakdown,
    },
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
