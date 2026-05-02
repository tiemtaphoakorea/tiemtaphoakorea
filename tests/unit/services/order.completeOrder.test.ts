/**
 * Integration tests for completeOrder — Task 9 of invoice-management redesign.
 *
 * completeOrder transitions stock_out → completed and requires
 * payment_status='paid' (DB CHECK constraint). Uses real PGlite in-memory DB.
 */

import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orderStatusHistory } from "@/db/schema/orders";
import { completeOrder, createOrder, recordPayment, stockOut } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("completeOrder", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("rejects when payment_status is not paid", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    await expect(completeOrder({ orderId: order.id, userId: fx.userId })).rejects.toThrow(
      /not fully paid|payment/i,
    );
  });

  it("rejects when fulfillment is still pending", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: Number(order.total),
      method: "cash",
    });

    await expect(completeOrder({ orderId: order.id, userId: fx.userId })).rejects.toThrow(
      /invalid transition/i,
    );
  });

  it("succeeds when stock_out + paid: sets completedAt and fulfillmentStatus=completed", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: Number(order.total),
      method: "cash",
    });

    const updated = await completeOrder({ orderId: order.id, userId: fx.userId });

    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.COMPLETED);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(updated.completedAt).toBeInstanceOf(Date);
  });

  it("writes an order_status_history row tagged completed", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: Number(order.total),
      method: "cash",
    });

    await completeOrder({
      orderId: order.id,
      userId: fx.userId,
      note: "Handed off",
    });

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id));

    const completedEntry = history.find(
      (h) => h.fulfillmentStatus === FULFILLMENT_STATUS.COMPLETED,
    );
    expect(completedEntry).toBeDefined();
    expect(completedEntry?.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(completedEntry?.note).toBe("Handed off");
  });
});
