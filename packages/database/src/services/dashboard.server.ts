import {
  DASHBOARD_DEFAULT_LIMIT,
  LOW_STOCK_DEFAULT_THRESHOLD,
  ORDER_STATUS,
  ROLE,
} from "@repo/shared/constants";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { orderItems, orderStatusHistory, orders } from "../schema/orders";
import { products, productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";

// Helper to get start of today
const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export async function getKPIStats() {
  const today = getStartOfToday();

  // Today's revenue
  const todayRevenueResult = await db
    .select({
      total: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
    })
    .from(orders)
    .where(and(gte(orders.paidAt, today), eq(orders.status, ORDER_STATUS.DELIVERED)));

  const todayRevenue = todayRevenueResult[0]?.total || 0;

  // New orders today
  const newOrdersResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(gte(orders.createdAt, today));

  const todayOrdersCount = newOrdersResult[0]?.count || 0;

  // Today's new customers
  const newCustomersResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(profiles)
    .where(and(gte(profiles.createdAt, today), eq(profiles.role, ROLE.CUSTOMER)));

  const todayCustomersCount = newCustomersResult[0]?.count || 0;

  // Pending orders
  const pendingOrdersResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(orders)
    .where(eq(orders.status, ORDER_STATUS.PENDING));

  const pendingOrdersCount = pendingOrdersResult[0]?.count || 0;

  // Stock alerts
  const outOfStockResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(productVariants)
    .where(eq(productVariants.stockQuantity, 0));

  const lowStockResult = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(productVariants)
    .where(
      and(
        sql`${productVariants.stockQuantity} > 0`,
        sql`${productVariants.stockQuantity} <= coalesce(${productVariants.lowStockThreshold}, ${LOW_STOCK_DEFAULT_THRESHOLD})`,
      ),
    );

  return {
    todayRevenue,
    todayOrdersCount,
    todayCustomersCount,
    pendingOrdersCount,
    outOfStockCount: outOfStockResult[0]?.count || 0,
    lowStockCount: lowStockResult[0]?.count || 0,
  };
}

export async function getRecentOrders(limit = DASHBOARD_DEFAULT_LIMIT) {
  return await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      customerName: profiles.fullName,
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getTopProducts(limit = DASHBOARD_DEFAULT_LIMIT) {
  return await db
    .select({
      id: products.id,
      name: products.name,
      totalQuantity: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);
}

export async function getRecentActivities(limit = DASHBOARD_DEFAULT_LIMIT) {
  return await db
    .select({
      id: orderStatusHistory.id,
      orderNumber: orders.orderNumber,
      status: orderStatusHistory.status,
      note: orderStatusHistory.note,
      createdAt: orderStatusHistory.createdAt,
      creatorName: profiles.fullName,
    })
    .from(orderStatusHistory)
    .innerJoin(orders, eq(orderStatusHistory.orderId, orders.id))
    .innerJoin(profiles, eq(orderStatusHistory.createdBy, profiles.id))
    .orderBy(desc(orderStatusHistory.createdAt))
    .limit(limit);
}

export async function getRecentPayments(limit = DASHBOARD_DEFAULT_LIMIT) {
  return await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      paidAt: orders.paidAt,
      customerName: profiles.fullName,
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(sql`${orders.paidAt} is not null`)
    .orderBy(desc(orders.paidAt))
    .limit(limit);
}

export async function getDashboardStats() {
  const [kpiStats, recentOrders, topProducts, recentActivities, recentPayments] = await Promise.all(
    [
      getKPIStats(),
      getRecentOrders(),
      getTopProducts(),
      getRecentActivities(),
      getRecentPayments(),
    ],
  );

  return {
    ...kpiStats,
    recentOrders,
    topProducts,
    recentActivities,
    recentPayments,
  };
}
