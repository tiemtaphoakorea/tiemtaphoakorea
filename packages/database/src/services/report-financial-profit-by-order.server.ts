/**
 * Báo cáo lợi nhuận theo đơn hàng (profit-loss/by-order).
 *
 * Liệt kê các đơn eligible trong kỳ với doanh thu / giá vốn / lợi nhuận / margin %,
 * kèm chi tiết từng line item: qty, đơn giá, giá vốn tại thời điểm bán, lineProfit, margin %.
 *
 * Eligibility (giống P&L): `cancelledAt IS NULL` AND `fulfillmentStatus IN (stock_out, completed)`,
 * anchor `stockOutAt` trong kỳ.
 */

import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { orderItems, orders } from "../schema/orders";
import { profiles } from "../schema/profiles";
import { normalizeRange } from "./report-shared.server";

export type ProfitByOrderItem = {
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPriceAtOrderTime: number;
  lineTotal: number;
  lineCost: number;
  lineProfit: number;
  lineProfitPct: number;
};

export type ProfitByOrderRow = {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  stockOutAt: string | null;
  revenue: number;
  cost: number;
  profit: number;
  profitPct: number;
  itemCount: number;
  items: ProfitByOrderItem[];
};

export type ProfitByOrderReport = {
  data: ProfitByOrderRow[];
  summary: {
    orderCount: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
  };
  metadata: ReturnType<typeof calculateMetadata>;
  period: { startDate: string; endDate: string };
};

export type ProfitByOrderSort = "recent" | "profit_desc" | "profit_asc" | "margin_desc";

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

export async function getProfitByOrderReport(params: {
  startDate: Date;
  endDate: Date;
  search?: string;
  sort?: ProfitByOrderSort;
  page?: number;
  limit?: number;
}): Promise<ProfitByOrderReport> {
  const { start, end } = normalizeRange(params.startDate, params.endDate);
  const search = params.search?.trim() ?? "";
  const sort: ProfitByOrderSort = params.sort ?? "recent";
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULT.PAGE);
  const limit = Math.max(1, Math.min(200, params.limit ?? PAGINATION_DEFAULT.LIMIT));
  const offset = (page - 1) * limit;

  const baseConditions = [
    isNull(orders.cancelledAt),
    inArray(orders.fulfillmentStatus, [FULFILLMENT_STATUS.STOCK_OUT, FULFILLMENT_STATUS.COMPLETED]),
    gte(orders.stockOutAt, start),
    lte(orders.stockOutAt, end),
  ];
  if (search) {
    baseConditions.push(
      or(ilike(orders.orderNumber, `%${search}%`), ilike(profiles.fullName, `%${search}%`))!,
    );
  }

  const revenueExpr = sql<number>`(${orders.subtotal}::numeric - ${orders.discount}::numeric)`;
  const costExpr = sql<number>`coalesce(${orders.totalCost}::numeric, 0)`;
  const profitExpr = sql<number>`coalesce(${orders.profit}::numeric, 0)`;

  const orderBy = (() => {
    switch (sort) {
      case "profit_desc":
        return [desc(profitExpr), desc(orders.stockOutAt)];
      case "profit_asc":
        return [asc(profitExpr), desc(orders.stockOutAt)];
      case "margin_desc":
        return [
          desc(sql`case when ${revenueExpr} = 0 then 0 else ${profitExpr} / ${revenueExpr} end`),
          desc(orders.stockOutAt),
        ];
      default:
        return [desc(orders.stockOutAt), desc(orders.createdAt)];
    }
  })();

  const [countResult] = await db
    .select({ c: sql<number>`count(*)`.mapWith(Number) })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...baseConditions));
  const total = countResult?.c ?? 0;

  const orderRows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerName: profiles.fullName,
      stockOutAt: orders.stockOutAt,
      revenue: revenueExpr.mapWith(Number),
      cost: costExpr.mapWith(Number),
      profit: profitExpr.mapWith(Number),
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...baseConditions))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const orderIds = orderRows.map((row) => row.orderId);
  const itemRows = orderIds.length
    ? await db
        .select({
          orderId: orderItems.orderId,
          orderItemId: orderItems.id,
          productName: orderItems.productName,
          variantName: orderItems.variantName,
          sku: orderItems.sku,
          quantity: orderItems.quantity,
          unitPrice: sql<number>`${orderItems.unitPrice}::numeric`.mapWith(Number),
          costPriceAtOrderTime:
            sql<number>`coalesce(${orderItems.costPriceAtOrderTime}::numeric, 0)`.mapWith(Number),
          lineTotal: sql<number>`${orderItems.lineTotal}::numeric`.mapWith(Number),
          lineCost: sql<number>`coalesce(${orderItems.lineCost}::numeric, 0)`.mapWith(Number),
          lineProfit: sql<number>`coalesce(${orderItems.lineProfit}::numeric, 0)`.mapWith(Number),
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(orderItems.createdAt))
    : [];

  const itemsByOrder = new Map<string, ProfitByOrderItem[]>();
  for (const item of itemRows) {
    const bucket = itemsByOrder.get(item.orderId) ?? [];
    bucket.push({
      orderItemId: item.orderItemId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPriceAtOrderTime: item.costPriceAtOrderTime,
      lineTotal: item.lineTotal,
      lineCost: item.lineCost,
      lineProfit: item.lineProfit,
      lineProfitPct: pct(item.lineProfit, item.lineTotal),
    });
    itemsByOrder.set(item.orderId, bucket);
  }

  const data: ProfitByOrderRow[] = orderRows.map((row) => {
    const items = itemsByOrder.get(row.orderId) ?? [];
    return {
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      stockOutAt: row.stockOutAt ? row.stockOutAt.toISOString() : null,
      revenue: row.revenue,
      cost: row.cost,
      profit: row.profit,
      profitPct: pct(row.profit, row.revenue),
      itemCount: items.length,
      items,
    };
  });

  const [summaryResult] = await db
    .select({
      orderCount: sql<number>`count(*)`.mapWith(Number),
      totalRevenue: sql<number>`coalesce(sum(${revenueExpr}), 0)`.mapWith(Number),
      totalCost: sql<number>`coalesce(sum(${costExpr}), 0)`.mapWith(Number),
      totalProfit: sql<number>`coalesce(sum(${profitExpr}), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(and(...baseConditions));

  const s = summaryResult ?? { orderCount: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 };

  return {
    data,
    summary: {
      orderCount: s.orderCount,
      totalRevenue: s.totalRevenue,
      totalCost: s.totalCost,
      totalProfit: s.totalProfit,
      avgMargin: pct(s.totalProfit, s.totalRevenue),
    },
    metadata: calculateMetadata(total, page, limit),
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
  };
}
