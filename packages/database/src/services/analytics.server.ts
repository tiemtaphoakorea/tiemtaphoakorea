import {
  ANALYTICS_DEFAULT_CONVERSION_RATE,
  ANALYTICS_GROWTH_RANDOM_OFFSET,
  ANALYTICS_GROWTH_RANDOM_RANGE,
  ANALYTICS_TOP_PRODUCTS_LIMIT,
  ROLE,
} from "@repo/shared/constants";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import { categories, products, productVariants } from "../schema";
import { orderItems, orders } from "../schema/orders";
import { profiles } from "../schema/profiles";

export async function getAnalyticsData() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    // 1. Core KPIs
    const kpiQuery = db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
        totalOrders: sql<number>`count(${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .where(isNotNull(orders.paidAt));

    const customerQuery = db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(profiles)
      .where(eq(profiles.role, ROLE.CUSTOMER));

    const [kpis, customers] = await Promise.all([kpiQuery, customerQuery]);

    // 2. Revenue by Month (Current Year) - using query builder instead of raw SQL
    let monthlyRevenue: Array<{
      month: string;
      revenue: number;
      orders: number;
    }> = [];

    try {
      const monthlyData = await db
        .select({
          month: sql<string>`TO_CHAR(date_trunc('month', ${orders.paidAt}), 'Tháng MM')`,
          revenue: sql<number>`coalesce(SUM(${orders.total}), 0)`.mapWith(Number),
          orderCount: sql<number>`COUNT(${orders.id})`.mapWith(Number),
          minDate: sql<Date>`MIN(${orders.paidAt})`,
        })
        .from(orders)
        .where(and(isNotNull(orders.paidAt), gte(orders.paidAt, startOfYear)))
        .groupBy(sql`TO_CHAR(date_trunc('month', ${orders.paidAt}), 'Tháng MM')`)
        .orderBy(sql`MIN(${orders.paidAt})`);

      monthlyRevenue = monthlyData.map((row) => ({
        month: row.month || "N/A",
        revenue: row.revenue || 0,
        orders: row.orderCount || 0,
      }));
    } catch (e) {
      console.error("Monthly revenue query failed:", e);
      monthlyRevenue = [];
    }

    // 3. Category Distribution
    const categorySales = await db
      .select({
        category: categories.name,
        sales: sql<number>`count(${orderItems.id})`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .groupBy(categories.name)
      .orderBy(desc(sql`count(${orderItems.id})`));

    // 4. Top Products
    const topProducts = await db
      .select({
        name: products.name,
        sales: sql<number>`count(${orderItems.id})`.mapWith(Number),
        revenue: sql<number>`coalesce(sum(${orderItems.lineTotal}), 0)`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`sum(${orderItems.lineTotal})`))
      .limit(ANALYTICS_TOP_PRODUCTS_LIMIT);

    return {
      totalRevenue: kpis[0]?.totalRevenue || 0,
      totalOrders: kpis[0]?.totalOrders || 0,
      totalCustomers: customers[0]?.count || 0,
      conversionRate: ANALYTICS_DEFAULT_CONVERSION_RATE, // Mocked for now as we don't track visits
      monthlyRevenue,
      categorySales: categorySales.map((c, i) => ({
        ...c,
        color: `hsl(var(--chart-${(i % 5) + 1}))`,
      })),
      topProducts: topProducts.map((p) => ({
        ...p,
        growth:
          Math.floor(Math.random() * ANALYTICS_GROWTH_RANDOM_RANGE) +
          ANALYTICS_GROWTH_RANDOM_OFFSET, // Mocked growth
      })),
    };
  } catch (error) {
    console.error("Analytics query failed:", error);
    // Return empty/default data on error
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      conversionRate: 0,
      monthlyRevenue: [],
      categorySales: [],
      topProducts: [],
    };
  }
}
