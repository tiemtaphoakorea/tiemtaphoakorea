/**
 * Integration tests for debt services — Task 13 of invoice-management redesign.
 *
 * getDebtSummary: paginated list of customers who have at least one
 *   stock_out + non-paid order.
 * getCustomerDebt: full debt picture for a single customer (orders,
 *   unpaid subset, total debt, payment history).
 *
 * Uses the real PGlite in-memory DB via shared fixtures.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { orders } from "@/db/schema/orders";
import { getCustomerDebt, getDebtSummary } from "@/services/debt.server";
import { createOrder, recordPayment, stockOut } from "@/services/order.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("getDebtSummary", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("lists customers with stock_out + unpaid orders", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });

    const result = await getDebtSummary({});

    expect(result.data.length).toBeGreaterThan(0);
    const entry = result.data.find((r) => r.customerId === fx.customerId);
    expect(entry).toBeDefined();
    expect(Number(entry!.debt)).toBeGreaterThan(0);
    expect(entry!.unpaidOrders).toBe(1);
  });

  it("filters by search on customer name/phone", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });

    // Search by a substring of the seeded customer's fullName ("Customer <testId>").
    // Using fx.testId keeps the match specific to this fixture under parallel runs.
    const match = await getDebtSummary({ search: fx.testId });
    const entry = match.data.find((r) => r.customerId === fx.customerId);
    expect(entry).toBeDefined();
    expect(match.metadata.total).toBeGreaterThanOrEqual(1);

    const miss = await getDebtSummary({ search: "definitely-no-match-xyz" });
    expect(miss.data.length).toBe(0);
    expect(miss.metadata.total).toBe(0);
  });

  it("applies minAgeDays to both data and metadata.total (regression)", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    // Backdate so oldestDebtDate is 40 days ago.
    const past = new Date(Date.now() - 40 * 86400000);
    await db.update(orders).set({ stockOutAt: past }).where(eq(orders.id, order.id));

    // minAgeDays=30 ⇒ customer included; count must also include them.
    const hit = await getDebtSummary({ minAgeDays: 30 });
    expect(hit.data.find((r) => r.customerId === fx.customerId)).toBeDefined();
    expect(hit.metadata.total).toBeGreaterThanOrEqual(1);

    // minAgeDays=60 ⇒ customer excluded; count must also exclude them.
    const miss = await getDebtSummary({ minAgeDays: 60 });
    expect(miss.data.find((r) => r.customerId === fx.customerId)).toBeUndefined();
    // Regression: count query previously ignored minAgeDays and returned 1 here.
    expect(miss.metadata.total).toBe(0);
  });

  it("excludes customers with all paid", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 1 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: Number(row.total),
      method: "cash",
    });

    const result = await getDebtSummary({});
    const entry = result.data.find((r) => r.customerId === fx.customerId);
    expect(entry).toBeUndefined();
  });
});

describe("getCustomerDebt", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("returns null for unknown customer", async () => {
    const result = await getCustomerDebt("00000000-0000-0000-0000-000000000000");
    expect(result).toBeNull();
  });

  it("aggregates debt, unpaid orders, and payment history", async () => {
    const { order } = await createOrder({
      customerId: fx.customerId,
      userId: fx.userId,
      items: [{ variantId: fx.variantId, quantity: 2 }],
    });
    await stockOut({ orderId: order.id, userId: fx.userId });
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id));
    const total = Number(row.total);
    // Partial payment
    await recordPayment({
      orderId: order.id,
      userId: fx.userId,
      amount: total / 2,
      method: "cash",
    });

    const result = await getCustomerDebt(fx.customerId);
    expect(result).not.toBeNull();
    expect(result!.customer.id).toBe(fx.customerId);
    expect(result!.unpaidOrders.length).toBe(1); // still stock_out + not fully paid
    expect(result!.totalDebt).toBeCloseTo(total / 2, 2);
    expect(result!.paymentHistory.length).toBe(1);
    expect(Number(result!.paymentHistory[0].amount)).toBeCloseTo(total / 2, 2);
    expect(result!.allOrders.length).toBe(1);
  });
});
