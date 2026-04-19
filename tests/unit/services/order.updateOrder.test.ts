/**
 * Integration tests for updateOrder / updateOrderItems — Task 12 of the
 * invoice-management redesign.
 *
 * Covers:
 *   1. updateOrder rejects edits after fulfillment transitions out of PENDING.
 *   2. updateOrderItems correctly increments reserved when an item's qty grows.
 *   3. updateOrderItems correctly decrements reserved when an item's qty shrinks
 *      (exercises the "restore old, deduct new" symmetry).
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { productVariants } from "@/db/schema/products";
import { createOrder, stockOut, updateOrder, updateOrderItems } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("updateOrder / updateOrderItems", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("rejects updateOrder after the order leaves PENDING (stock_out)", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    await expect(updateOrder(order.id, { adminNote: "x" }, fx.userId)).rejects.toThrow(
      /cannot edit/i,
    );
  });

  it("updates reserved when item quantity increases on a pending order", async () => {
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

    await updateOrderItems(order.id, [{ variantId: fx.variantId, quantity: 5 }], fx.userId);

    // Old reserve (2) restored, new reserve (5) applied → reserved = 5.
    const after = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(after[0]).toEqual({ onHand: 5, reserved: 5 });
  });

  it("decrements reserved when item quantity decreases on a pending order", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 3 }],
      userId: fx.userId,
    });

    // After createOrder: on_hand=5, reserved=3.
    const before = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(before[0]).toEqual({ onHand: 5, reserved: 3 });

    await updateOrderItems(order.id, [{ variantId: fx.variantId, quantity: 1 }], fx.userId);

    // Old reserve (3) restored, new reserve (1) applied → reserved = 1.
    const after = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(after[0]).toEqual({ onHand: 5, reserved: 1 });
  });
});
