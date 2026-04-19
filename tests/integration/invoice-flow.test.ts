/**
 * End-to-end invoice flow integration tests — Task 20 of invoice-management-spec1.
 *
 * Three scenarios tested against the real PGlite in-memory DB:
 *   1. Happy path: create → stock_out → partial payment → full payment → complete
 *   2. Cancellation: cancel pending returns reserved; cancel after stock_out rejected
 *   3. Oversell: stock_out blocked when on_hand=0, succeeds after stock is received
 *
 * Uses shared fixtures (PGlite, unique IDs) so tests are parallel-safe.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { checkInventoryInvariants } from "@/db/scripts/verify-inventory-invariants";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  recordPayment,
  stockOut,
} from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "../unit/services/fixtures";

describe("invoice flow: happy path", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("create → stock_out → partial payment → full payment → complete", async () => {
    // Arrange: variant seeded with onHand=5, reserved=0
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
    });

    // After create: reserved incremented
    const [variantAfterCreate] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterCreate.reserved).toBe(2);
    expect(variantAfterCreate.onHand).toBe(5);

    // Act: stock_out
    await stockOut({ orderId: order.id, userId: fx.userId });

    // After stock_out: on_hand decremented, reserved decremented
    const [variantAfterStockOut] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterStockOut.onHand).toBe(3);
    expect(variantAfterStockOut.reserved).toBe(0);

    const [orderAfterStockOut] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(orderAfterStockOut.fulfillmentStatus).toBe("stock_out");

    // Act: partial payment
    const total = Number(orderAfterStockOut.total);
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    const [orderAfterPartial] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(orderAfterPartial.paymentStatus).toBe("partial");

    // Act: full payment
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    const [orderAfterFull] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(orderAfterFull.paymentStatus).toBe("paid");

    // Act: complete
    await completeOrder({ orderId: order.id, userId: fx.userId });

    const [orderCompleted] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(orderCompleted.fulfillmentStatus).toBe("completed");
    expect(orderCompleted.completedAt).not.toBeNull();
  });
});

describe("invoice flow: cancellation", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("cancel pending returns reserved; cancel after stock_out rejected", async () => {
    // Arrange: create two orders
    const { order: order1 } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
    });
    const { order: order2 } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });

    // reserved should be 3 now
    const [variantAfterBoth] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterBoth.reserved).toBe(3);

    // Act: cancel first order (pending) — reserved decremented back
    await cancelOrder({ orderId: order1.id, userId: fx.userId });

    const [variantAfterCancel] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfterCancel.reserved).toBe(1);

    const [cancelledOrder] = await db.select().from(orders).where(eq(orders.id, order1.id));
    expect(cancelledOrder.fulfillmentStatus).toBe("cancelled");

    // Act: stock_out second order, then attempt cancel — must reject
    await stockOut({ orderId: order2.id, userId: fx.userId });

    await expect(cancelOrder({ orderId: order2.id, userId: fx.userId })).rejects.toThrow(
      /Cannot cancel after stock_out/,
    );
  });
});

describe("invoice flow: inventory invariants", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  // Regression: the invariant check's SQL must only sum `order_items` that
  // belong to a *pending* order. An earlier draft placed the
  // `fulfillment_status = 'pending'` filter on the LEFT JOIN's ON clause,
  // which NULLs the joined `orders` row but still aggregates the
  // `order_items` row, so completing an order produced a false positive.
  it("does not flag a variant whose only order is completed", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    const [stockedOut] = await db.select().from(orders).where(eq(orders.id, order.id));
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: Number(stockedOut.total),
      method: "cash",
    });
    await completeOrder({ orderId: order.id, userId: fx.userId });

    // The variant's reserved is 0 and the only order_item belongs to a
    // completed order — no mismatch should be reported.
    const report = await checkInventoryInvariants();
    expect(report.reservedMismatches).toBe(0);
    expect(report.negativeOnHand).toBe(0);
  });

  it("flags a variant whose reserved drifts from pending-order quantities", async () => {
    await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
    });

    // Corrupt reserved out-of-band to simulate a desync.
    await db
      .update(productVariants)
      .set({ reserved: 99 })
      .where(eq(productVariants.id, fx.variantId));

    const report = await checkInventoryInvariants();
    expect(report.reservedMismatches).toBeGreaterThanOrEqual(1);
  });
});

describe("invoice flow: oversell protection", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("stock_out blocked when on_hand=0; succeeds after stock received", async () => {
    // Arrange: set on_hand to 0 so stock_out will fail
    await db.update(productVariants).set({ onHand: 0 }).where(eq(productVariants.id, fx.variantId));

    // Create order — reserved increments, but on_hand is 0
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });

    // Act: stock_out should fail (on_hand=0, need 1)
    await expect(stockOut({ orderId: order.id, userId: fx.userId })).rejects.toThrow(
      /Insufficient stock/,
    );

    // Simulate receiving stock: set on_hand to qty needed
    await db.update(productVariants).set({ onHand: 1 }).where(eq(productVariants.id, fx.variantId));

    // Act: stock_out should now succeed
    await stockOut({ orderId: order.id, userId: fx.userId });

    const [variantAfter] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variantAfter.onHand).toBe(0);
    expect(variantAfter.reserved).toBe(0);

    const [orderAfter] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(orderAfter.fulfillmentStatus).toBe("stock_out");
  });
});
