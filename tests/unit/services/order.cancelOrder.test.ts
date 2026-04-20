/**
 * Integration tests for cancelOrder — Task 10 of invoice-management redesign.
 *
 * cancelOrder transitions pending → cancelled, returns reserved stock
 * (reserved -= qty) and does NOT touch on_hand. Uses real PGlite in-memory DB.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orderStatusHistory } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { FULFILLMENT_STATUS } from "@/lib/constants";
import { cancelOrder, createOrder, stockOut } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("cancelOrder", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("cancels a pending order and returns reserved stock (on_hand unchanged)", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
      userId: fx.userId,
    });

    // After createOrder: on_hand=5, reserved=2.
    const before = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(before[0]).toEqual({ onHand: 5, reserved: 2 });

    const updated = await cancelOrder({ orderId: order.id, userId: fx.userId });

    // on_hand unchanged; reserved returned.
    const after = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(after[0]).toEqual({ onHand: 5, reserved: 0 });

    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.CANCELLED);
    expect(updated.cancelledAt).toBeInstanceOf(Date);

    // Status history row written for the cancellation.
    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id));
    const cancelledEntry = history.find(
      (h) => h.fulfillmentStatus === FULFILLMENT_STATUS.CANCELLED,
    );
    expect(cancelledEntry).toBeDefined();
  });

  it("rejects cancelling after stock_out", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    await expect(cancelOrder({ orderId: order.id, userId: fx.userId })).rejects.toThrow(
      /cannot cancel after stock_out/i,
    );
  });
});
