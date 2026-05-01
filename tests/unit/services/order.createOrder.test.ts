/**
 * Integration tests for createOrder — reserve-stock behaviour (Task 7).
 *
 * Unlike order.server.test.ts (fully mocked), these tests hit the real PGlite
 * in-memory DB so we can assert the database state after the service runs.
 */

import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { profiles } from "@/db/schema/profiles";
import { createOrder } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("createOrder (reserve-stock model)", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("reserves stock without changing on_hand when items are available", async () => {
    const before = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(before[0]).toEqual({ onHand: 5, reserved: 0 });

    await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
      userId: fx.userId,
    });

    const after = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(after[0]).toEqual({ onHand: 5, reserved: 2 });
  });

  it("creates a new order with payment_status='unpaid' and fulfillment_status='pending'", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    const [row] = await db
      .select({
        paymentStatus: orders.paymentStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        stockOutAt: orders.stockOutAt,
        completedAt: orders.completedAt,
      })
      .from(orders)
      .where(eq(orders.id, order.id));

    expect(row.paymentStatus).toBe(PAYMENT_STATUS.UNPAID);
    expect(row.fulfillmentStatus).toBe(FULFILLMENT_STATUS.PENDING);
    expect(row.stockOutAt).toBeNull();
    expect(row.completedAt).toBeNull();
  });

  it("creates a new customer without phone from customer info object", async () => {
    const guestName = `Guest ${fx.testId}`;
    const { order } = await createOrder({
      customerId: { name: guestName, phone: undefined },
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    const [profile] = await db
      .select({ phone: profiles.phone, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, order.customerId));

    expect(profile.fullName).toBe(guestName);
    expect(profile.phone).toBeNull();
  });

  it("persists shipping fields when provided", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
      shippingName: "Người nhận",
      shippingPhone: "0900000001",
      shippingAddress: "123 Đường ABC",
    });

    const [row] = await db
      .select({
        shippingName: orders.shippingName,
        shippingPhone: orders.shippingPhone,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(eq(orders.id, order.id));

    expect(row.shippingName).toBe("Người nhận");
    expect(row.shippingPhone).toBe("0900000001");
    expect(row.shippingAddress).toBe("123 Đường ABC");
  });

  it("allows oversell — reserved may exceed on_hand", async () => {
    // on_hand starts at 5; request 10 → reserved becomes 10, on_hand untouched.
    await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 10 }],
      userId: fx.userId,
    });

    const [row] = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(row.onHand).toBe(5);
    expect(row.reserved).toBe(10);
  });
});
