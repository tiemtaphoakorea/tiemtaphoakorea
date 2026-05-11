import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../packages/database/src/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

/**
 * Backfill `order_items.cost_price_at_order_time` and `line_cost` for items
 * that snapshotted cost = 0 (because the variant had no cost_price at the time
 * of sale, e.g. before the Sapo re-import). Then recompute `orders.total_cost`
 * and `orders.profit` for affected orders.
 *
 * Best-effort: uses CURRENT productVariants.cost_price as the estimate.
 */
async function main() {
  // 1. Find items needing backfill (snapshot cost = 0 or NULL)
  const items = await db
    .select({
      id: schema.orderItems.id,
      orderId: schema.orderItems.orderId,
      variantId: schema.orderItems.variantId,
      quantity: schema.orderItems.quantity,
      lineTotal: schema.orderItems.lineTotal,
    })
    .from(schema.orderItems)
    .where(
      sql`${schema.orderItems.costPriceAtOrderTime} = '0' OR ${schema.orderItems.costPriceAtOrderTime} IS NULL`,
    );

  console.log(`Found ${items.length} order_items to backfill\n`);
  if (items.length === 0) {
    await client.end();
    return;
  }

  // 2. Fetch current cost for all relevant variants in one query
  const variantIds = [...new Set(items.map((i) => i.variantId))];
  const variants = await db
    .select({
      id: schema.productVariants.id,
      sku: schema.productVariants.sku,
      costPrice: schema.productVariants.costPrice,
    })
    .from(schema.productVariants)
    .where(
      sql`${schema.productVariants.id} = ANY(ARRAY[${sql.join(
        variantIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::uuid[])`,
    );

  const variantCostMap = new Map(
    variants.map((v) => [v.id, { sku: v.sku, cost: Number(v.costPrice ?? 0) }]),
  );

  // 3. Update each item with current cost (best-effort estimate)
  const affectedOrderIds = new Set<string>();
  let updated = 0;
  let stillZero = 0;

  for (const item of items) {
    const v = variantCostMap.get(item.variantId);
    const cost = v?.cost ?? 0;
    if (cost === 0) {
      stillZero++;
      continue; // can't backfill if variant still has no cost
    }
    const lineTotal = Number(item.lineTotal ?? 0);
    const lineCost = cost * item.quantity;
    const lineProfit = lineTotal - lineCost;

    await db
      .update(schema.orderItems)
      .set({
        costPriceAtOrderTime: cost.toFixed(2),
        lineCost: lineCost.toFixed(2),
        lineProfit: lineProfit.toFixed(2),
      })
      .where(eq(schema.orderItems.id, item.id));

    affectedOrderIds.add(item.orderId);
    updated++;
  }

  console.log(`Updated ${updated} order_items, ${stillZero} still zero (variant cost missing)\n`);

  // 4. Recompute orders.total_cost and orders.profit for affected orders
  console.log(`Recomputing totals for ${affectedOrderIds.size} orders...\n`);
  let orderRecomputed = 0;

  for (const orderId of affectedOrderIds) {
    const [order] = await db
      .select({
        id: schema.orders.id,
        subtotal: schema.orders.subtotal,
        discount: schema.orders.discount,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId));

    if (!order) continue;

    const [costAgg] = await db
      .select({
        totalCost: sql<string>`COALESCE(SUM(${schema.orderItems.lineCost}::numeric), 0)::text`,
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));

    const totalCost = Number(costAgg?.totalCost ?? 0);
    const subtotal = Number(order.subtotal ?? 0);
    const discount = Number(order.discount ?? 0);
    const profit = subtotal - discount - totalCost;

    await db
      .update(schema.orders)
      .set({
        totalCost: totalCost.toFixed(2),
        profit: profit.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));
    orderRecomputed++;
  }

  console.log(`
Done.
  Items updated     : ${updated}
  Items still zero  : ${stillZero} (variant cost missing in DB)
  Orders recomputed : ${orderRecomputed}
`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
