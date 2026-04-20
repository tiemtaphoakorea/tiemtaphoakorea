import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { productVariants } from "@/db/schema/products";
import {
  adjustInventory,
  getInventoryDailySummary,
  getInventoryMovements,
} from "@/services/inventory.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

describe("adjustInventory", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("increments onHand and inserts a manual_adjustment movement", async () => {
    const movement = await adjustInventory({
      variantId: fx.variantId,
      quantity: 10,
      note: "Nhập hàng bổ sung",
      userId: fx.userId,
    });

    const [variant] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(variant.onHand).toBe(15); // 5 + 10
    expect(movement.type).toBe("manual_adjustment");
    expect(movement.quantity).toBe(10);
    expect(movement.onHandBefore).toBe(5);
    expect(movement.onHandAfter).toBe(15);
  });

  it("decrements onHand with negative quantity", async () => {
    await adjustInventory({
      variantId: fx.variantId,
      quantity: -3,
      userId: fx.userId,
    });

    const [variant] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));

    expect(variant.onHand).toBe(2); // 5 - 3
  });
});

describe("getInventoryMovements", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("returns paginated movements filtered by variantId", async () => {
    await adjustInventory({ variantId: fx.variantId, quantity: 5, userId: fx.userId });
    await adjustInventory({ variantId: fx.variantId, quantity: -2, userId: fx.userId });

    const result = await getInventoryMovements({ variantId: fx.variantId, page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.metadata.total).toBe(2);
  });
});

describe("getInventoryDailySummary", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await cleanOrderTest(fx);
  });

  it("aggregates in/out by date", async () => {
    await adjustInventory({ variantId: fx.variantId, quantity: 10, userId: fx.userId });
    await adjustInventory({ variantId: fx.variantId, quantity: -3, userId: fx.userId });

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });

    expect(rows).toHaveLength(1);
    expect(Number(rows[0].totalIn)).toBe(10);
    expect(Number(rows[0].totalOut)).toBe(3);
  });
});
