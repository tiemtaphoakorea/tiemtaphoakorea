/**
 * One-time backfill: populate missing inventory_movements to make the XNT
 * (opening/closing stock) report accurate.
 *
 * Execution order matters:
 *
 *  Gap 2 runs first — inserts `stock_out` for 3 early orders that predate
 *  movement recording, so gap 1 can correctly calculate pre-period balances.
 *
 *  Gap 1 — Pre-period opening-stock baseline
 *    For every variant with no movement before PERIOD_START, inserts a
 *    `manual_adjustment` at OPENING_STOCK_DATE with:
 *      quantity = on_hand + Σ(in-period out) − Σ(in-period in)
 *    This handles both "no movements at all" (Σ = 0 → quantity = on_hand)
 *    and "only gap-2 in-period movements" (quantity accounts for early orders).
 *
 *  Gap 3 — on_hand reconciliation
 *    For any remaining drift between movement-derived closing and on_hand,
 *    appends a reconciling `manual_adjustment` dated now.
 *
 * All three gaps are IDEMPOTENT.
 *
 * Usage:
 *   DATABASE_URL=<url> pnpm --filter @workspace/database db:backfill-opening-stock
 */

import "dotenv/config";
import postgres from "postgres";

const OPENING_STOCK_DATE = "2026-04-18T23:59:59Z";
const PERIOD_START = "2026-04-19T00:00:00Z";
const OPENING_STOCK_NOTE = "Opening stock — historical balance";
const RECON_NOTE = "Reconciliation — on_hand vs movement drift";

const EARLY_ORDER_NUMBERS = ["ORD-20260419-EDC571", "ORD-20260420-BC1403", "ORD-20260420-79EE6A"];

async function run(): Promise<number> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("✖  DATABASE_URL is not set");
    return 2;
  }

  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });

  try {
    // ------------------------------------------------------------------ Gap 2
    // Must run before Gap 1 so the formula accounts for early-order stock-outs.
    console.log("=== Gap 2: Early-orders stock-out ===");

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

    // ------------------------------------------------------------------ Gap 1
    // opening = on_hand + Σ(in-period out) − Σ(in-period in)
    // Skips variants that already have a movement before PERIOD_START.
    console.log("\n=== Gap 1: Opening-stock baseline ===");

    const candidates = await sql<
      {
        variant_id: string;
        sku: string | null;
        correct_opening: number;
      }[]
    >`
      WITH period_net AS (
        SELECT variant_id,
          SUM(CASE WHEN quantity > 0 THEN  quantity ELSE 0 END) AS qty_in,
          SUM(CASE WHEN quantity < 0 THEN -quantity ELSE 0 END) AS qty_out
        FROM inventory_movements
        WHERE created_at >= ${PERIOD_START}::timestamptz
        GROUP BY variant_id
      )
      SELECT pv.id AS variant_id, pv.sku,
        (pv.on_hand
          + COALESCE(pn.qty_out, 0)
          - COALESCE(pn.qty_in,  0))::int AS correct_opening
      FROM product_variants pv
      LEFT JOIN period_net pn ON pn.variant_id = pv.id
      WHERE (pv.on_hand + COALESCE(pn.qty_out, 0) - COALESCE(pn.qty_in, 0)) > 0
        AND NOT EXISTS (
          SELECT 1 FROM inventory_movements
          WHERE variant_id = pv.id AND created_at < ${PERIOD_START}::timestamptz
        )
    `;

    console.log(`  Candidates needing pre-period baseline: ${candidates.length}`);

    let gap1Inserted = 0;
    for (const v of candidates) {
      if (v.correct_opening <= 0) continue;
      await sql`
        INSERT INTO inventory_movements
          (variant_id, type, quantity, on_hand_before, on_hand_after, note, created_at)
        VALUES (
          ${v.variant_id}, 'manual_adjustment',
          ${v.correct_opening}, 0, ${v.correct_opening},
          ${OPENING_STOCK_NOTE}, ${OPENING_STOCK_DATE}::timestamptz
        )
        ON CONFLICT DO NOTHING
      `;
      gap1Inserted++;
    }

    console.log(`  ✓ Inserted ${gap1Inserted} opening-stock movements`);

    // ------------------------------------------------------------------ Gap 1.5
    // Gap 2 ran before Gap 1, so gap2 stock-out movements have on_hand_before=0.
    // Now that gap1 has established an opening baseline, re-chain those gap2
    // movements so their on_hand_before/on_hand_after correctly follow the
    // opening stock. Without this, gap3 would insert spurious in-period
    // manual_adjustments that inflate XNT closing stock.
    console.log("\n=== Gap 1.5: Patch gap2 on_hand chain ===");

    const patchResult = await sql`
      WITH gap1_openings AS (
        SELECT variant_id, on_hand_after AS opening
        FROM inventory_movements
        WHERE note = ${OPENING_STOCK_NOTE}
      ),
      gap2_candidates AS (
        SELECT m.id, m.variant_id, m.quantity, m.created_at, g1.opening
        FROM inventory_movements m
        JOIN gap1_openings g1 ON g1.variant_id = m.variant_id
        WHERE m.note LIKE 'Stock-out for order ORD-%'
      ),
      with_new_values AS (
        SELECT id,
               COALESCE(
                 opening + SUM(quantity) OVER (
                   PARTITION BY variant_id ORDER BY created_at, id
                   ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
                 ),
                 opening
               ) AS new_on_hand_before,
               opening + SUM(quantity) OVER (
                 PARTITION BY variant_id ORDER BY created_at, id
               ) AS new_on_hand_after
        FROM gap2_candidates
      )
      UPDATE inventory_movements m
      SET on_hand_before = wnv.new_on_hand_before,
          on_hand_after  = wnv.new_on_hand_after
      FROM with_new_values wnv
      WHERE m.id = wnv.id
        AND (m.on_hand_before IS DISTINCT FROM wnv.new_on_hand_before
          OR m.on_hand_after  IS DISTINCT FROM wnv.new_on_hand_after)
    `;

    console.log(`  ✓ Patched ${patchResult.count} gap2 movement(s)`);

    // ------------------------------------------------------------------ Gap 3
    // Only runs for variants WITHOUT a gap1 baseline. For gap1 variants the
    // XNT formula already guarantees closing = on_hand; running gap3 on them
    // adds in-period movements that corrupt the XNT period metrics.
    console.log("\n=== Gap 3: on_hand reconciliation ===");

    // Clean up any stale gap3 movements for gap1 variants from a previous run.
    const cleaned = await sql`
      DELETE FROM inventory_movements
      WHERE note = ${RECON_NOTE}
        AND variant_id IN (
          SELECT variant_id FROM inventory_movements WHERE note = ${OPENING_STOCK_NOTE}
        )
    `;
    if (cleaned.count > 0) {
      console.log(`  Cleaned ${cleaned.count} stale reconciliation movement(s) for gap1 variants`);
    }

    const drifted = await sql<
      {
        id: string;
        sku: string | null;
        on_hand: number;
        derived_closing: number;
      }[]
    >`
      WITH latest AS (
        SELECT DISTINCT ON (variant_id) variant_id, on_hand_after AS derived_closing
        FROM inventory_movements
        ORDER BY variant_id, created_at DESC, id DESC
      )
      SELECT pv.id, pv.sku, pv.on_hand, l.derived_closing
      FROM product_variants pv
      JOIN latest l ON l.variant_id = pv.id
      WHERE pv.on_hand <> l.derived_closing
        AND NOT EXISTS (
          SELECT 1 FROM inventory_movements im2
          WHERE im2.variant_id = pv.id AND im2.note = ${OPENING_STOCK_NOTE}
        )
    `;

    console.log(`  Drifted variants: ${drifted.length}`);

    let gap3Inserted = 0;
    for (const v of drifted) {
      const delta = v.on_hand - v.derived_closing;
      await sql`
        INSERT INTO inventory_movements
          (variant_id, type, quantity, on_hand_before, on_hand_after, note, created_at)
        VALUES (
          ${v.id}, 'manual_adjustment', ${delta},
          ${v.derived_closing}, ${v.on_hand},
          ${RECON_NOTE}, NOW()
        )
      `;
      gap3Inserted++;
      console.log(
        `    ${v.sku ?? v.id}: derived=${v.derived_closing} on_hand=${v.on_hand} delta=${delta > 0 ? "+" : ""}${delta}`,
      );
    }

    console.log(`  ✓ Inserted ${gap3Inserted} reconciliation movements`);

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
