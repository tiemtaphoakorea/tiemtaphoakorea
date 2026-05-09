/**
 * One-time backfill: insert missing `stock_out` inventory_movements for the
 * three early orders that were created BEFORE the new system started recording
 * movements. The goods physically left the warehouse but no rows were written.
 *
 * No synthetic opening-stock baselines are created — we deliberately do NOT
 * fabricate pre-period state. Variants without a recorded opening will show
 * negative XNT closing for the period, which honestly reflects "we don't know
 * what was in stock before 2026-04-19, only what moved after." Admins can
 * later set per-variant opening via the admin UI as real data emerges.
 *
 * `on_hand_before / on_hand_after` for the inserted rows reflect the chain
 * with whatever prior movements exist (or 0 if none) — they are NOT corrected
 * to match the variant's current on_hand, again to keep the data honest.
 *
 * Idempotent: each insert is guarded by `(variant_id, type, reference_id)`.
 *
 * Usage:
 *   DATABASE_URL=<url> pnpm --filter @workspace/database db:backfill-early-orders
 */

import "dotenv/config";
import postgres from "postgres";

const EARLY_ORDER_NUMBERS = ["ORD-20260419-EDC571", "ORD-20260420-BC1403", "ORD-20260420-79EE6A"];

async function run(): Promise<number> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("✖  DATABASE_URL is not set");
    return 2;
  }

  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });

  try {
    console.log("=== Backfill: early-order stock-outs ===");

    for (const orderNumber of EARLY_ORDER_NUMBERS) {
      const [order] = await sql<{ id: string; stock_out_at: Date | null; created_at: Date }[]>`
        SELECT id, stock_out_at, created_at FROM orders WHERE order_number = ${orderNumber}
      `;

      if (!order) {
        console.log(`  ⚠  Order ${orderNumber} not found — skipped`);
        continue;
      }

      const movementDate = order.stock_out_at ?? order.created_at;
      const items = await sql<{ variant_id: string; quantity: number }[]>`
        SELECT variant_id, quantity FROM order_items WHERE order_id = ${order.id}
      `;

      let skipped = 0;
      let inserted = 0;

      for (const item of items) {
        const [existing] = await sql<{ id: string }[]>`
          SELECT id FROM inventory_movements
          WHERE variant_id = ${item.variant_id} AND type = 'stock_out' AND reference_id = ${order.id}
        `;
        if (existing) {
          skipped++;
          continue;
        }

        const [prev] = await sql<{ on_hand_after: number }[]>`
          SELECT on_hand_after FROM inventory_movements
          WHERE variant_id = ${item.variant_id} AND created_at < ${movementDate}
          ORDER BY created_at DESC, id DESC LIMIT 1
        `;

        const onHandBefore = prev?.on_hand_after ?? 0;
        await sql`
          INSERT INTO inventory_movements
            (variant_id, type, quantity, on_hand_before, on_hand_after, reference_id, note, created_at)
          VALUES (
            ${item.variant_id}, 'stock_out', ${-item.quantity},
            ${onHandBefore}, ${onHandBefore - item.quantity},
            ${order.id}, ${`Stock-out for order ${orderNumber}`}, ${movementDate}
          )
        `;
        inserted++;
      }

      console.log(`  ✓ ${orderNumber}: ${inserted} inserted, ${skipped} already present`);
    }

    console.log("\n✅ Backfill complete");
    return 0;
  } finally {
    await sql.end({ timeout: 3 });
  }
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("✖  Backfill failed:", err instanceof Error ? err.message : err);
    process.exit(2);
  });
