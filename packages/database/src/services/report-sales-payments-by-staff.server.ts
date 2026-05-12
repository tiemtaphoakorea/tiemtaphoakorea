/**
 * Báo cáo thu tiền theo nhân viên (sales/payments-by-staff).
 *
 * NOTE: Schema has no `payments.collected_by` field. We use `payments.created_by`
 * (the staff who recorded the payment transaction) as the best available proxy.
 * This is noted in the UI as "NV ghi nhận thanh toán".
 *
 * Staff with null created_by → "Chưa rõ NV".
 */

import { and, gte, isNull, lte, sql } from "drizzle-orm";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { db } from "../db";
import { orders, payments } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { normalizeRange } from "./report-shared.server";

export type PaymentsByStaffRow = {
  staffId: string | null;
  staffName: string;
  orderCount: number;
  txCount: number;
  total: number;
  avgPerTx: number;
};

export type PaymentsByStaffReport = {
  data: PaymentsByStaffRow[];
  summary: {
    staffCount: number;
    totalAmount: number;
    totalTx: number;
    avgPerStaff: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

export async function getPaymentsByStaffReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaymentsByStaffReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  // Aggregate all staff first (staff count is small enough to do in-memory pagination)
  const aggRows = await db
    .select({
      staffId: payments.createdBy,
      staffName: sql<string>`coalesce(${profiles.fullName}, 'Chưa rõ NV')`,
      orderCount: sql<number>`count(distinct ${payments.orderId})`.mapWith(Number),
      txCount: sql<number>`count(*)`.mapWith(Number),
      total: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)`.mapWith(Number),
    })
    .from(payments)
    .leftJoin(profiles, sql`${profiles.id} = ${payments.createdBy}`)
    .innerJoin(orders, sql`${orders.id} = ${payments.orderId}`)
    .where(
      and(
        isNull(orders.cancelledAt),
        gte(payments.createdAt, start),
        lte(payments.createdAt, end),
      ),
    )
    .groupBy(payments.createdBy, profiles.fullName)
    .orderBy(sql`total desc`);

  // Apply search filter in-memory (staff list is small)
  const filtered = params.search
    ? aggRows.filter((r) =>
        r.staffName.toLowerCase().includes(params.search!.toLowerCase()),
      )
    : aggRows;

  const total = filtered.length;
  const pagedRows = filtered.slice(offset, offset + limit);

  const totalAmount = filtered.reduce((s, r) => s + r.total, 0);
  const totalTx = filtered.reduce((s, r) => s + r.txCount, 0);

  return {
    data: pagedRows.map((r) => ({
      staffId: r.staffId,
      staffName: r.staffName,
      orderCount: r.orderCount,
      txCount: r.txCount,
      total: r.total,
      avgPerTx: r.txCount > 0 ? r.total / r.txCount : 0,
    })),
    summary: {
      staffCount: total,
      totalAmount,
      totalTx,
      avgPerStaff: total > 0 ? totalAmount / total : 0,
    },
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
