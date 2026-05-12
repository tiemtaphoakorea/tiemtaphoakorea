/**
 * Báo cáo lãi lỗ — wraps `getFinancialStats` and adds period-over-period delta.
 */

import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orderItems, orders } from "../schema/orders";
import { productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import { getFinancialStats } from "./finance.server";
import { deltaPct, normalizeRange, previousPeriod } from "./report-shared.server";

export type PnLMetrics = {
  salesRevenue: number; // doanh thu bán hàng (subtotal - discount)
  cogs: number; // giá vốn
  grossProfit: number; // lợi nhuận gộp
  otherIncome: number; // thu nhập khác (placeholder = 0; system has no "phiếu thu khác" yet)
  otherExpense: number; // chi phí khác (expenses table)
  netProfit: number; // lợi nhuận ròng = grossProfit + otherIncome - otherExpense
  orderCount: number;
  missingCostItems: number;
  missingCostOrderCount: number;
  missingCostRate: number;
  excludedRevenue: number;
};

function toPnLMetrics(stats: Awaited<ReturnType<typeof getFinancialStats>>): PnLMetrics {
  return {
    salesRevenue: stats.revenue,
    cogs: stats.cogs,
    grossProfit: stats.grossProfit,
    otherIncome: 0,
    otherExpense: stats.expenses,
    netProfit: stats.netProfit,
    orderCount: stats.orderCount,
    missingCostItems: stats.missingCostItems,
    missingCostOrderCount: stats.missingCostOrderCount,
    missingCostRate: stats.missingCostRate,
    excludedRevenue: stats.excludedRevenue,
  };
}

export type ProfitLossReport = {
  current: PnLMetrics;
  previous: PnLMetrics | null;
  delta: Record<keyof PnLMetrics, number> | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
};

export type MissingCostOrderItem = {
  orderItemId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  lineCost: number;
  currentCostPrice: number;
};

export type MissingCostOrderRow = {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  stockOutAt: Date | null;
  revenue: number;
  missingCostItemCount: number;
  items: MissingCostOrderItem[];
};

export type MissingCostOrdersReport = {
  data: MissingCostOrderRow[];
  summary: {
    orderCount: number;
    itemCount: number;
    excludedRevenue: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
};

export async function getProfitLossReport(params: {
  startDate: Date;
  endDate: Date;
  compare?: boolean;
}): Promise<ProfitLossReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const compare = params.compare ?? true;

  if (!compare) {
    const stats = await getFinancialStats({ startDate: start, endDate: end });
    return {
      current: toPnLMetrics(stats),
      previous: null,
      delta: null,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      previousPeriod: null,
    };
  }

  const prev = previousPeriod(start, end);
  const [currentStats, previousStats] = await Promise.all([
    getFinancialStats({ startDate: start, endDate: end }),
    getFinancialStats({ startDate: prev.start, endDate: prev.end }),
  ]);

  const current = toPnLMetrics(currentStats);
  const previous = toPnLMetrics(previousStats);
  const delta = {
    salesRevenue: deltaPct(current.salesRevenue, previous.salesRevenue),
    cogs: deltaPct(current.cogs, previous.cogs),
    grossProfit: deltaPct(current.grossProfit, previous.grossProfit),
    otherIncome: deltaPct(current.otherIncome, previous.otherIncome),
    otherExpense: deltaPct(current.otherExpense, previous.otherExpense),
    netProfit: deltaPct(current.netProfit, previous.netProfit),
    orderCount: deltaPct(current.orderCount, previous.orderCount),
    missingCostItems: deltaPct(current.missingCostItems, previous.missingCostItems),
    missingCostOrderCount: deltaPct(current.missingCostOrderCount, previous.missingCostOrderCount),
    missingCostRate: deltaPct(current.missingCostRate, previous.missingCostRate),
    excludedRevenue: deltaPct(current.excludedRevenue, previous.excludedRevenue),
  };

  return {
    current,
    previous,
    delta,
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
    previousPeriod: { startDate: prev.start.toISOString(), endDate: prev.end.toISOString() },
  };
}

export async function getMissingCostOrdersReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<MissingCostOrdersReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));

  const conditions = [
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [FULFILLMENT_STATUS.STOCK_OUT, FULFILLMENT_STATUS.COMPLETED]),
    gte(orders.stockOutAt, start),
    lte(orders.stockOutAt, end),
    sql`COALESCE(${orderItems.lineCost}::numeric, 0) <= 0`,
  ];
  if (search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(profiles.fullName, `%${search}%`),
        ilike(profiles.phone, `%${search}%`),
        ilike(orderItems.sku, `%${search}%`),
        ilike(orderItems.productName, `%${search}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerName: profiles.fullName,
      customerPhone: profiles.phone,
      stockOutAt: orders.stockOutAt,
      revenue: sql<number>`(${orders.subtotal}::numeric - ${orders.discount}::numeric)`.mapWith(
        Number,
      ),
      orderItemId: orderItems.id,
      variantId: orderItems.variantId,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      sku: orderItems.sku,
      quantity: orderItems.quantity,
      unitPrice: sql<number>`${orderItems.unitPrice}::numeric`.mapWith(Number),
      lineTotal: sql<number>`${orderItems.lineTotal}::numeric`.mapWith(Number),
      lineCost: sql<number>`COALESCE(${orderItems.lineCost}::numeric, 0)`.mapWith(Number),
      currentCostPrice: sql<number>`COALESCE(${productVariants.costPrice}::numeric, 0)`.mapWith(
        Number,
      ),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(and(...conditions))
    .orderBy(desc(orders.stockOutAt), desc(orders.createdAt), orderItems.createdAt);

  const grouped = new Map<string, MissingCostOrderRow>();
  for (const row of rows) {
    let order = grouped.get(row.orderId);
    if (!order) {
      order = {
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        stockOutAt: row.stockOutAt,
        revenue: row.revenue,
        missingCostItemCount: 0,
        items: [],
      };
      grouped.set(row.orderId, order);
    }
    order.items.push({
      orderItemId: row.orderItemId,
      variantId: row.variantId,
      productName: row.productName,
      variantName: row.variantName,
      sku: row.sku,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      lineTotal: row.lineTotal,
      lineCost: row.lineCost,
      currentCostPrice: row.currentCostPrice,
    });
    order.missingCostItemCount += 1;
  }

  const allRows = Array.from(grouped.values());
  const total = allRows.length;
  const data = allRows.slice((page - 1) * limit, page * limit);

  return {
    data,
    summary: {
      orderCount: total,
      itemCount: allRows.reduce((sum, row) => sum + row.missingCostItemCount, 0),
      excludedRevenue: allRows.reduce((sum, row) => sum + row.revenue, 0),
    },
    metadata: calculateMetadata(total, page, limit),
  };
}
