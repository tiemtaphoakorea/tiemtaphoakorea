import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements, openingStockEntries } from "@/db/schema/inventory";
import { costPriceHistory, productVariants } from "@/db/schema/products";
import {
  adjustInventory,
  applyOpeningStockEntries,
  previewOpeningStockCsv,
} from "@/services/inventory.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

const EFFECTIVE_DATE = new Date("2026-04-01T00:00:00Z");

describe("opening stock entries", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
    await db
      .update(productVariants)
      .set({ onHand: 0, reserved: 0, costPrice: "0" })
      .where(eq(productVariants.id, fx.variantId));
  });

  afterEach(async () => {
    await db.delete(openingStockEntries).where(eq(openingStockEntries.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("creates opening stock with first movement, onHand, cost price, and cost history", async () => {
    await applyOpeningStockEntries({
      entries: [
        {
          variantId: fx.variantId,
          quantity: 10,
          unitCost: 50_000,
          effectiveDate: EFFECTIVE_DATE,
          note: "Initial count",
        },
      ],
      userId: fx.userId,
    });

    const [variant] = await db
      .select({ onHand: productVariants.onHand, costPrice: productVariants.costPrice })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variant).toEqual({ onHand: 10, costPrice: "50000.00" });

    const [movement] = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, fx.variantId))
      .orderBy(inventoryMovements.createdAt, inventoryMovements.id);
    expect(movement).toMatchObject({
      type: "manual_adjustment",
      quantity: 10,
      onHandBefore: 0,
      onHandAfter: 10,
    });

    const history = await db
      .select()
      .from(costPriceHistory)
      .where(eq(costPriceHistory.variantId, fx.variantId));
    expect(history).toHaveLength(1);
    expect(history[0].costPrice).toBe("50000.00");
  });

  it("rechained later movements when opening quantity changes", async () => {
    await applyOpeningStockEntries({
      entries: [
        {
          variantId: fx.variantId,
          quantity: 10,
          unitCost: 50_000,
          effectiveDate: EFFECTIVE_DATE,
        },
      ],
      userId: fx.userId,
    });
    await adjustInventory({ variantId: fx.variantId, quantity: -2, userId: fx.userId });
    await adjustInventory({ variantId: fx.variantId, quantity: 5, userId: fx.userId });

    await applyOpeningStockEntries({
      entries: [
        {
          variantId: fx.variantId,
          quantity: 12,
          unitCost: 50_000,
          effectiveDate: EFFECTIVE_DATE,
          note: "Count correction",
        },
      ],
      userId: fx.userId,
    });

    const movements = await db
      .select({
        quantity: inventoryMovements.quantity,
        onHandBefore: inventoryMovements.onHandBefore,
        onHandAfter: inventoryMovements.onHandAfter,
      })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.variantId, fx.variantId))
      .orderBy(inventoryMovements.createdAt, inventoryMovements.id);

    expect(movements).toEqual([
      { quantity: 12, onHandBefore: 0, onHandAfter: 12 },
      { quantity: -2, onHandBefore: 12, onHandAfter: 10 },
      { quantity: 5, onHandBefore: 10, onHandAfter: 15 },
    ]);

    const [variant] = await db
      .select({ onHand: productVariants.onHand })
      .from(productVariants)
      .where(eq(productVariants.id, fx.variantId));
    expect(variant.onHand).toBe(15);
  });

  it("previews CSV errors without mutating inventory", async () => {
    const csv = [
      "sku,openingQuantity,openingUnitCost,note",
      `${fx.testId}-missing,5,1000,missing`,
      `${fx.testId}-bad,-1,1000,bad`,
    ].join("\n");

    const result = await previewOpeningStockCsv(csv);

    expect(result.validRows).toHaveLength(0);
    expect(result.errorRows).toHaveLength(2);
    const entries = await db
      .select()
      .from(openingStockEntries)
      .where(eq(openingStockEntries.variantId, fx.variantId));
    expect(entries).toHaveLength(0);
  });

  it("rolls back bulk apply when any row is invalid", async () => {
    await expect(
      applyOpeningStockEntries({
        entries: [
          {
            variantId: fx.variantId,
            quantity: 10,
            unitCost: 50_000,
            effectiveDate: EFFECTIVE_DATE,
          },
          {
            variantId: "00000000-0000-0000-0000-000000000000",
            quantity: 1,
            unitCost: 1,
            effectiveDate: EFFECTIVE_DATE,
          },
        ],
        userId: fx.userId,
      }),
    ).rejects.toThrow("Variant not found");

    const entries = await db
      .select()
      .from(openingStockEntries)
      .where(eq(openingStockEntries.variantId, fx.variantId));
    expect(entries).toHaveLength(0);
  });
});
