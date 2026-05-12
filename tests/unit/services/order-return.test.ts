/**
 * R16: returnOrder — full return of a shipped order.
 *
 * Reverses stock (onHand += qty per item, inventory_movements type=cancellation)
 * and reverses COGS (totalCost=0, profit = subtotal − discount). Uses the
 * existing `cancelled` fulfillment status with a `[RETURNED]` history marker
 * to distinguish post-shipment returns from pre-shipment cancels.
 *
 * Out of scope (manual): refunding `payments`, customer credit, partial returns.
 */

import { desc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { orderStatusHistory, orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { cancelOrder, createOrder, returnOrder, stockOut } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

async function setVariantStock(variantId: string, onHand: number, costPrice: string) {
  await db
    .update(productVariants)
    .set({ onHand, costPrice, reserved: 0 })
    .where(eq(productVariants.id, variantId));
}

async function placeAndShipOrder(
  fx: OrderTestFixture,
  qty: number,
  customPrice: number,
): Promise<string> {
  const { order } = await createOrder({
    customerId: fx.customerId,
    userId: fx.userId,
    items: [{ variantId: fx.variantId, quantity: qty, customPrice }],
  });
  await stockOut({ orderId: order.id, userId: fx.userId });
  return order.id;
}

describe("returnOrder", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
    await setVariantStock(fx.variantId, 10, "80000");
  });

  afterEach(async () => {
    // FK-safe cleanup: orders cascade items + status_history; movements separate.
    await db.delete(inventoryMovements).where(eq(inventoryMovements.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("reverses stock back into onHand and records a cancellation movement", async () => {
    const orderId = await placeAndShipOrder(fx, 3, 150_000);

    // After stock-out: onHand = 10 - 3 = 7
    const [beforeReturn] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(beforeReturn.onHand).toBe(7);

    await returnOrder({ orderId, userId: fx.userId, reason: "Khách đổi ý" });

    const [afterReturn] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(afterReturn.onHand).toBe(10); // 7 + 3 back in

    // Movement chain: stock_out (-3) then cancellation (+3) for this order.
    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.referenceId, orderId))
      .orderBy(desc(inventoryMovements.createdAt));
    const cancellation = movements.find((m) => m.type === "cancellation");
    expect(cancellation).toBeDefined();
    expect(cancellation?.quantity).toBe(3);
    // onHandBefore + quantity = onHandAfter
    expect((cancellation?.onHandBefore ?? 0) + (cancellation?.quantity ?? 0)).toBe(
      cancellation?.onHandAfter,
    );
  });

  it("zeros totalCost and sets profit = subtotal − discount (no cost recognised on return)", async () => {
    const orderId = await placeAndShipOrder(fx, 2, 150_000);
    // Subtotal = 2 × 150,000 = 300,000. After stock-out, COGS = 2 × 80,000 = 160,000.
    // After return, totalCost should drop to 0 and profit climb to subtotal (no discount in fixture).

    await returnOrder({ orderId, userId: fx.userId, reason: "Hỏng" });

    const [row] = await db
      .select({
        fulfillmentStatus: orders.fulfillmentStatus,
        totalCost: orders.totalCost,
        profit: orders.profit,
        cancelledAt: orders.cancelledAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    expect(row.fulfillmentStatus).toBe("cancelled");
    expect(Number(row.totalCost)).toBe(0);
    expect(Number(row.profit)).toBe(300_000);
    expect(row.cancelledAt).toBeInstanceOf(Date);
  });

  it("inserts an orderStatusHistory row with [RETURNED] marker so timeline distinguishes return from cancel", async () => {
    const orderId = await placeAndShipOrder(fx, 1, 100_000);

    await returnOrder({ orderId, userId: fx.userId, reason: "Khách trả vì lỗi sản xuất" });

    const [history] = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt))
      .limit(1);

    expect(history.fulfillmentStatus).toBe("cancelled");
    expect(history.note).toContain("[RETURNED]");
    expect(history.note).toContain("Khách trả vì lỗi sản xuất");
    expect(history.createdBy).toBe(fx.userId);
  });

  it("rejects when order has not been shipped (status=pending)", async () => {
    // Create order but don't stock-out.
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2, customPrice: 100_000 }],
    });

    await expect(
      returnOrder({ orderId: order.id, userId: fx.userId, reason: "x" }),
    ).rejects.toThrow(/Invalid transition/);

    // onHand should still reflect the pending reservation (no stock-in reversal).
    const [v] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(v.onHand).toBe(10);
  });

  it("rejects double-return on already-cancelled order", async () => {
    const orderId = await placeAndShipOrder(fx, 2, 100_000);
    await returnOrder({ orderId, userId: fx.userId, reason: "first" });

    // Status now `cancelled`; second return must throw.
    await expect(returnOrder({ orderId, userId: fx.userId, reason: "duplicate" })).rejects.toThrow(
      /Invalid transition/,
    );
  });

  it("cancelOrder still rejects post-shipment cancels (channel returnOrder explicitly)", async () => {
    const orderId = await placeAndShipOrder(fx, 1, 100_000);

    await expect(cancelOrder({ orderId, userId: fx.userId })).rejects.toThrow(
      /Cannot cancel after stock_out/,
    );
  });
});
