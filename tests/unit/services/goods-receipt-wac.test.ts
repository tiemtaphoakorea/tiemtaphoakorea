/**
 * WAC (Weighted Average Cost) tests covering:
 * - R4: formula uses pre-receipt qty (oldQty = on_hand_now − incomingQty) and
 *   computes in PG numeric to avoid JS float drift.
 * - R5: incoming cost = 0 (free/gift receipt) preserves existing costPrice
 *   instead of diluting WAC to zero.
 */

import { desc, eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { costPriceHistory, productVariants } from "@/db/schema/products";
import { goodsReceiptItems, goodsReceipts } from "@/db/schema/receipts";
import { completeGoodsReceipt, createGoodsReceipt } from "@/services/goods-receipt.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

const createdReceiptIds: string[] = [];

/** Force the variant into a known (onHand, costPrice) state for the test. */
async function setVariantState(variantId: string, onHand: number, costPrice: string) {
  await db
    .update(productVariants)
    .set({ onHand, costPrice })
    .where(eq(productVariants.id, variantId));
}

/** Create a draft receipt with one line + force debt to 0 so we can complete. */
async function createAndPayReceipt(
  variantId: string,
  quantity: number,
  unitCost: string,
  createdBy: string,
): Promise<string> {
  const receipt = await createGoodsReceipt({
    items: [{ variantId, quantity, unitCost }],
    createdBy,
  });
  // Skip payment plumbing — test focuses on WAC, not payment derivation.
  await db.update(goodsReceipts).set({ debtAmount: "0" }).where(eq(goodsReceipts.id, receipt.id));
  createdReceiptIds.push(receipt.id);
  return receipt.id;
}

async function readCost(variantId: string): Promise<number> {
  const [v] = await db
    .select({ cost: productVariants.costPrice })
    .from(productVariants)
    .where(eq(productVariants.id, variantId));
  return Number(v.cost);
}

describe("applyWeightedAverageCost (WAC)", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    // FK-safe cleanup: receipt items → receipts → movements → cost history → fixture.
    if (createdReceiptIds.length > 0) {
      await db
        .delete(goodsReceiptItems)
        .where(inArray(goodsReceiptItems.receiptId, createdReceiptIds));
      await db.delete(goodsReceipts).where(inArray(goodsReceipts.id, createdReceiptIds));
      createdReceiptIds.length = 0;
    }
    await db.delete(inventoryMovements).where(eq(inventoryMovements.variantId, fx.variantId));
    await db.delete(costPriceHistory).where(eq(costPriceHistory.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("standard WAC: onHand=10 cost=100, receipt qty=5 cost=200 → newCost = 133.33", async () => {
    await setVariantState(fx.variantId, 10, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "200", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    // (100×10 + 200×5) / (10+5) = 2000/15 = 133.333... → round 2 dp = 133.33
    expect(await readCost(fx.variantId)).toBe(133.33);
  });

  it("allows completing an unpaid receipt so supplier debt can be paid later", async () => {
    await setVariantState(fx.variantId, 10, "100");
    const receipt = await createGoodsReceipt({
      items: [{ variantId: fx.variantId, quantity: 2, unitCost: "150" }],
      createdBy: fx.userId,
    });
    createdReceiptIds.push(receipt.id);

    const completed = await completeGoodsReceipt(receipt.id, fx.userId);

    expect(completed.status).toBe("completed");
    expect(Number(completed.debtAmount)).toBe(300);
    expect(completed.paymentStatus).toBe("unpaid");
  });

  it("zero-stock fallback: onHand=0 cost=100, receipt qty=5 cost=200 → newCost = 200", async () => {
    await setVariantState(fx.variantId, 0, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "200", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    expect(await readCost(fx.variantId)).toBe(200);
  });

  it("negative pre-stock fallback: onHand=-3 cost=100, receipt qty=5 cost=200 → newCost = 200", async () => {
    await setVariantState(fx.variantId, -3, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "200", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    // After stock-in: onHand = -3 + 5 = 2. Pre-stock qty = 2 - 5 = -3 → fallback to incoming average.
    expect(await readCost(fx.variantId)).toBe(200);
  });

  it("R5: incoming cost = 0 (gift receipt) preserves existing costPrice", async () => {
    await setVariantState(fx.variantId, 10, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "0", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    // Should remain 100, not dilute to (100×10 + 0)/(10+5) = 66.67.
    expect(await readCost(fx.variantId)).toBe(100);

    // No cost_price_history row should be inserted for a no-op.
    const history = await db
      .select()
      .from(costPriceHistory)
      .where(eq(costPriceHistory.variantId, fx.variantId));
    expect(history).toHaveLength(0);
  });

  it("R4 decimal: onHand=3 cost=33.33 + qty=1 cost=99.99 → exact PG numeric, no float drift", async () => {
    await setVariantState(fx.variantId, 3, "33.33");
    const receiptId = await createAndPayReceipt(fx.variantId, 1, "99.99", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    // (33.33×3 + 99.99×1) / 4 = (99.99 + 99.99) / 4 = 199.98 / 4 = 49.995 → rounds to 50.00
    expect(await readCost(fx.variantId)).toBe(50);
  });

  it("inserts cost_price_history row with prev cost in note", async () => {
    await setVariantState(fx.variantId, 10, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "200", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    const [row] = await db
      .select()
      .from(costPriceHistory)
      .where(eq(costPriceHistory.variantId, fx.variantId))
      .orderBy(desc(costPriceHistory.createdAt))
      .limit(1);

    expect(row).toBeDefined();
    expect(Number(row.costPrice)).toBe(133.33);
    expect(row.note).toContain("prev cost");
    expect(row.createdBy).toBe(fx.userId);
  });

  it("formula regression: must NOT use post-stock-in onHand as oldQty (would give 125, not 133.33)", async () => {
    // Buggy formula: (100×15 + 1000) / 20 = 125. Correct: (100×10 + 1000) / 15 = 133.33.
    await setVariantState(fx.variantId, 10, "100");
    const receiptId = await createAndPayReceipt(fx.variantId, 5, "200", fx.userId);

    await completeGoodsReceipt(receiptId, fx.userId);

    expect(await readCost(fx.variantId)).not.toBe(125);
    expect(await readCost(fx.variantId)).toBe(133.33);
  });
});
