/**
 * R10: Date grouping in reports must respect Asia/Ho_Chi_Minh (UTC+7), not the
 * raw stored UTC timestamp. A movement at 17:30 UTC (= 00:30 next day VN local)
 * must group into the VN-local date, not the UTC date.
 *
 * `timestamp` columns store wall-clock UTC; the fix converts via
 * `(col AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh'` before truncating.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { inventoryMovements } from "@/db/schema/inventory";
import { adjustInventory, getInventoryDailySummary } from "@/services/inventory.server";
import { cleanOrderTest, type OrderTestFixture, seedOrderTest } from "./fixtures";

/** Force a movement's createdAt to a specific UTC instant. */
async function setMovementCreatedAt(movementId: string, at: Date) {
  await db
    .update(inventoryMovements)
    .set({ createdAt: at })
    .where(eq(inventoryMovements.id, movementId));
}

describe("getInventoryDailySummary — Asia/Ho_Chi_Minh day boundary (R10)", () => {
  let fx: OrderTestFixture;

  beforeEach(async () => {
    fx = await seedOrderTest();
  });

  afterEach(async () => {
    await db.delete(inventoryMovements).where(eq(inventoryMovements.variantId, fx.variantId));
    await cleanOrderTest(fx);
  });

  it("groups movement at 16:30 UTC (= 23:30 VN same day) into VN local date", async () => {
    // 2026-04-15 16:30 UTC = 2026-04-15 23:30 Asia/Ho_Chi_Minh (UTC+7) — still day 15 in VN.
    const movement = await adjustInventory({
      variantId: fx.variantId,
      quantity: 7,
      userId: fx.userId,
    });
    await setMovementCreatedAt(movement.id, new Date("2026-04-15T16:30:00Z"));

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });

    expect(rows).toHaveLength(1);
    // Drizzle's pglite returns date as a string YYYY-MM-DD.
    expect(String(rows[0].date)).toContain("2026-04-15");
    expect(Number(rows[0].totalIn)).toBe(7);
  });

  it("groups movement at 17:30 UTC (= 00:30 next day VN) into NEXT VN local date", async () => {
    // 2026-04-15 17:30 UTC = 2026-04-16 00:30 Asia/Ho_Chi_Minh — already day 16 in VN.
    const movement = await adjustInventory({
      variantId: fx.variantId,
      quantity: 4,
      userId: fx.userId,
    });
    await setMovementCreatedAt(movement.id, new Date("2026-04-15T17:30:00Z"));

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });

    expect(rows).toHaveLength(1);
    expect(String(rows[0].date)).toContain("2026-04-16");
    expect(Number(rows[0].totalIn)).toBe(4);
  });

  it("splits two movements straddling VN midnight into separate VN day buckets", async () => {
    // Both fall on UTC 2026-04-15 but VN-local split: 23:30 → 04-15, 00:30 → 04-16.
    const m1 = await adjustInventory({ variantId: fx.variantId, quantity: 10, userId: fx.userId });
    await setMovementCreatedAt(m1.id, new Date("2026-04-15T16:30:00Z")); // 23:30 VN, 04-15

    const m2 = await adjustInventory({ variantId: fx.variantId, quantity: -3, userId: fx.userId });
    await setMovementCreatedAt(m2.id, new Date("2026-04-15T17:30:00Z")); // 00:30 VN, 04-16

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });
    const byDate = new Map(rows.map((r) => [String(r.date).slice(0, 10), r]));

    expect(byDate.size).toBe(2);
    expect(Number(byDate.get("2026-04-15")?.totalIn)).toBe(10);
    expect(Number(byDate.get("2026-04-15")?.totalOut)).toBe(0);
    expect(Number(byDate.get("2026-04-16")?.totalIn)).toBe(0);
    expect(Number(byDate.get("2026-04-16")?.totalOut)).toBe(3);
  });

  it("regression: a movement at 17:30 UTC must NOT be grouped under UTC date 2026-04-15", async () => {
    // The pre-fix buggy behavior would put this under 04-15 (UTC truncate).
    // After fix, it MUST be under 04-16 (VN truncate).
    const movement = await adjustInventory({
      variantId: fx.variantId,
      quantity: 1,
      userId: fx.userId,
    });
    await setMovementCreatedAt(movement.id, new Date("2026-04-15T17:30:00Z"));

    const rows = await getInventoryDailySummary({ variantId: fx.variantId });
    expect(String(rows[0].date)).not.toContain("2026-04-15");
    expect(String(rows[0].date)).toContain("2026-04-16");
  });
});
