/**
 * Integration tests for stockOut — Task 8 of invoice-management redesign.
 *
 * Uses the real PGlite in-memory DB so we can assert on_hand / reserved
 * deductions and fulfillment_status transitions.
 */

import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { orders } from "@/db/schema/orders";
import { productVariants } from "@/db/schema/products";
import { createOrder, stockOut } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("stockOut", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("deducts both on_hand and reserved and flips fulfillment to stock_out", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
      userId: fx.userId,
    });

    // After createOrder: on_hand=5, reserved=2 (stock is reserved, not deducted).
    const before = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(before[0]).toEqual({ onHand: 5, reserved: 2 });

    const updated = await stockOut({
      orderId: order.id,
      userId: fx.userId,
    });

    // on_hand and reserved both drop by the ordered quantity.
    const after = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(after[0]).toEqual({ onHand: 3, reserved: 0 });

    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.STOCK_OUT);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.UNPAID);
    expect(updated.stockOutAt).toBeInstanceOf(Date);
  });

  it("allows stock-out when quantity exceeds on_hand, leaving onHand negative", async () => {
    // fx.variantId has onHand=5 by default from seedOrderTest
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 10 }],
      userId: fx.userId,
    });

    const updated = await stockOut({ orderId: order.id, userId: fx.userId });

    const [after] = await db
      .select({ onHand: productVariants.onHand, reserved: productVariants.reserved })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(after.onHand).toBe(-5); // 5 - 10 = -5
    expect(after.reserved).toBe(0);
    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.STOCK_OUT);
  });

  it("rejects when order is not in pending fulfillment state", async () => {
    // TODO(Task 10): Replace this with a `cancelOrder` call once it is
    // refactored to the payment/fulfillment-status split. For now we drive the
    // precondition directly via UPDATE — still exercises stockOut's
    // transition-guard logic.
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await db
      .update(orders)
      .set({ fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED })
      .where(eq(orders.id, order.id));

    await expect(stockOut({ orderId: order.id, userId: fx.userId })).rejects.toThrow(
      /Invalid transition/,
    );
  });

  it("writes an order_status_history row tagged stock_out", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
      userId: fx.userId,
    });

    await stockOut({
      orderId: order.id,
      userId: fx.userId,
      note: "Customer picked up goods",
    });

    const history = await db.query.orderStatusHistory.findMany({
      where: (h, { eq }) => eq(h.orderId, order.id),
    });

    const stockOutEntry = history.find((h) => h.fulfillmentStatus === FULFILLMENT_STATUS.STOCK_OUT);
    expect(stockOutEntry).toBeDefined();
    expect(stockOutEntry?.paymentStatus).toBe(PAYMENT_STATUS.UNPAID);
    expect(stockOutEntry?.note).toBe("Customer picked up goods");
  });

  it("records a stock_out movement in inventory_movements", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
      userId: fx.userId,
    });

    await stockOut({ orderId: order.id, userId: fx.userId });

    const movements = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, fx.variantId));

    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("stock_out");
    expect(movements[0].quantity).toBe(-2);
    expect(movements[0].onHandBefore).toBe(5);
    expect(movements[0].onHandAfter).toBe(3);
    expect(movements[0].referenceId).toBe(order.id);
  });
});
