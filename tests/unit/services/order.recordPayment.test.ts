/**
 * Integration tests for recordPayment — Task 11 of invoice-management redesign.
 *
 * recordPayment adds a payment row and recomputes payment_status from the
 * new paidAmount against the order total:
 *   newPaid === 0      → 'unpaid'
 *   newPaid < total    → 'partial'
 *   newPaid === total  → 'paid'   (also stamps paidAt)
 *
 * It also rejects payments on cancelled / completed orders and on overpay.
 * Uses the real PGlite in-memory DB.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PAYMENT_STATUS } from "@/lib/constants";
import { cancelOrder, createOrder, recordPayment } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("recordPayment", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("transitions unpaid → partial when paidAmount < total", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
      userId: fx.userId,
    });

    const total = Number(order.total);
    const updated = await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PARTIAL);
    expect(Number(updated.paidAmount)).toBe(total / 2);
    expect(updated.paidAt).toBeNull();
  });

  it("transitions partial → paid when total reached", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    const total = Number(order.total);

    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    const final = await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    expect(final.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(Number(final.paidAmount)).toBe(total);
    expect(final.paidAt).toBeInstanceOf(Date);
  });

  it("rejects payment on cancelled order", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await cancelOrder({ orderId: order.id, userId: fx.userId });

    await expect(
      recordPayment({
        orderId: order.id,
        userId: fx.userId,
        amount: Number(order.total),
        method: "cash",
      }),
    ).rejects.toThrow(/cancelled/i);
  });

  it("rejects overpayment", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await expect(
      recordPayment({
        orderId: order.id,
        userId: fx.userId,
        amount: Number(order.total) + 1,
        method: "cash",
      }),
    ).rejects.toThrow(/overpay/i);
  });
});
