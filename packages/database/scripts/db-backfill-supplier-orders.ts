/**
 * One-time backfill: migrate legacy `supplier_orders` rows into the
 * Sapo-faithful `purchase_orders` + `goods_receipts` model.
 *
 * Status mapping
 *   legacy.pending   → PO.draft       (still pending, no receipt yet)
 *   legacy.ordered   → PO.ordered     (sent to supplier, awaiting goods)
 *   legacy.received  → PO.received    + completed receipt (paid)
 *   legacy.cancelled → PO.cancelled   (no receipt)
 *
 * Goods receipts are created ONLY for legacy `received` rows. Pending and
 * ordered rows remain "open" — admin can later mark received via UI which
 * will create the receipt + inventory_movement.
 *
 * Inventory side-effect intentionally OMITTED for `received` rows too —
 * current `on_hand` already reflects historical receipts (old system updated
 * on_hand directly without writing supplier_receipt movements).
 *
 * Idempotency: skips entirely if any `purchase_orders` rows already exist.
 * To re-run after a partial result, manually clear the target tables:
 *   TRUNCATE goods_receipt_items, goods_receipts, purchase_order_items, purchase_orders;
 *   UPDATE document_sequences SET last_seq = 0 WHERE prefix IN ('OSN', 'PON');
 *
 * Usage:
 *   DATABASE_URL=<url> pnpm --filter @workspace/database db:backfill-supplier-orders
 */

import "dotenv/config";
import postgres from "postgres";

const SEQ_PREFIXES = ["OSN", "PON", "PCH", "IAN", "CDC"] as const;

type LegacyStatus = "pending" | "ordered" | "received" | "cancelled";
type PurchaseOrderStatus = "draft" | "ordered" | "received" | "cancelled";

function mapStatus(legacy: LegacyStatus): PurchaseOrderStatus {
  switch (legacy) {
    // Pending = not yet processed; admin marks received later via UI.
    case "pending":
      return "draft";
    case "ordered":
      return "ordered";
    case "received":
      return "received";
    case "cancelled":
      return "cancelled";
  }
}

async function run(): Promise<number> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("✖  DATABASE_URL is not set");
    return 2;
  }

  const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });

  try {
    // ----------------------------------------------------------- Seed sequences
    console.log("=== Seed document_sequences ===");
    for (const prefix of SEQ_PREFIXES) {
      await sql`
        INSERT INTO document_sequences (prefix, last_seq)
        VALUES (${prefix}, 0)
        ON CONFLICT (prefix) DO NOTHING
      `;
    }
    console.log(`  ✓ Ensured ${SEQ_PREFIXES.length} sequences exist`);

    // ----------------------------------------------------------- Idempotency
    const [{ existing }] = await sql<{ existing: number }[]>`
      SELECT COUNT(*)::int AS existing FROM purchase_orders
    `;
    if (existing > 0) {
      console.log(`\n⚠  ${existing} purchase_orders already exist — skipping backfill.`);
      console.log("   To force re-run, clear target tables first (see header comment).");
      return 0;
    }

    // ----------------------------------------------------------- Load legacy
    console.log("\n=== Load legacy supplier_orders ===");
    const legacyRows = await sql<
      {
        id: string;
        supplier_id: string | null;
        variant_id: string | null;
        status: LegacyStatus;
        quantity: number;
        actual_cost_price: string | null;
        note: string | null;
        ordered_at: Date | null;
        expected_date: Date | null;
        received_at: Date | null;
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
        variant_cost_price: string | null;
      }[]
    >`
      SELECT so.id, so.supplier_id, so.variant_id, so.status, so.quantity,
             so.actual_cost_price, so.note, so.ordered_at, so.expected_date,
             so.received_at, so.created_by, so.created_at, so.updated_at,
             pv.cost_price AS variant_cost_price
      FROM supplier_orders so
      LEFT JOIN product_variants pv ON pv.id = so.variant_id
      ORDER BY so.created_at ASC, so.id ASC
    `;
    console.log(`  Loaded ${legacyRows.length} legacy rows`);

    // ----------------------------------------------------------- Migrate
    console.log("\n=== Migrate to purchase_orders + goods_receipts ===");
    const stats = {
      skippedNoVariant: 0,
      poInserted: 0,
      poItemsInserted: 0,
      receiptsInserted: 0,
      receiptItemsInserted: 0,
    };

    for (const row of legacyRows) {
      if (!row.variant_id) {
        stats.skippedNoVariant++;
        continue;
      }

      await sql.begin(async (tx) => {
        const rawCost = Number(row.actual_cost_price ?? row.variant_cost_price ?? 0);
        const unitCost = Number.isFinite(rawCost) ? rawCost : 0;
        const lineTotal = unitCost * row.quantity;
        const newStatus = mapStatus(row.status);
        const isReceived = newStatus === "received";
        const isCancelled = newStatus === "cancelled";

        // OSN code
        const [{ last_seq: poSeq }] = await tx<{ last_seq: number }[]>`
          UPDATE document_sequences SET last_seq = last_seq + 1
          WHERE prefix = 'OSN' RETURNING last_seq
        `;
        const poCode = `OSN${String(poSeq).padStart(5, "0")}`;

        // PO header
        const [po] = await tx<{ id: string }[]>`
          INSERT INTO purchase_orders (
            code, supplier_id, branch_id, status,
            ordered_at, expected_date, completed_at, cancelled_at,
            total_qty, total_amount, discount_amount,
            note, created_by, confirmed_by, created_at, updated_at
          ) VALUES (
            ${poCode}, ${row.supplier_id}, NULL,
            ${newStatus}::purchase_order_status,
            ${row.ordered_at}, ${row.expected_date},
            ${isReceived ? (row.received_at ?? row.created_at) : null},
            ${isCancelled ? row.updated_at : null},
            ${row.quantity}, ${lineTotal.toFixed(2)}, '0',
            ${row.note}, ${row.created_by},
            ${newStatus === "ordered" || isReceived ? row.created_by : null},
            ${row.created_at}, ${row.updated_at}
          ) RETURNING id
        `;
        stats.poInserted++;

        // PO line item
        const [poItem] = await tx<{ id: string }[]>`
          INSERT INTO purchase_order_items (
            purchase_order_id, variant_id, ordered_qty, received_qty,
            unit_cost, discount, line_total, note, created_at
          ) VALUES (
            ${po.id}, ${row.variant_id}, ${row.quantity},
            ${isReceived ? row.quantity : 0},
            ${unitCost.toFixed(2)}, '0', ${lineTotal.toFixed(2)},
            ${row.note}, ${row.created_at}
          ) RETURNING id
        `;
        stats.poItemsInserted++;

        // Matching receipt for received status only
        if (isReceived) {
          const [{ last_seq: ponSeq }] = await tx<{ last_seq: number }[]>`
            UPDATE document_sequences SET last_seq = last_seq + 1
            WHERE prefix = 'PON' RETURNING last_seq
          `;
          const ponCode = `PON${String(ponSeq).padStart(5, "0")}`;
          const receivedAt = row.received_at ?? row.updated_at ?? row.created_at;

          const [receipt] = await tx<{ id: string }[]>`
            INSERT INTO goods_receipts (
              code, purchase_order_id, supplier_id, branch_id, status,
              received_at, invoice_date, invoice_ref,
              total_qty, total_amount, discount_amount, extra_cost,
              payable_amount, paid_amount, debt_amount, payment_status,
              note, created_by, completed_by, cancelled_at,
              created_at, updated_at
            ) VALUES (
              ${ponCode}, ${po.id}, ${row.supplier_id}, NULL,
              'completed'::receipt_status,
              ${receivedAt}, NULL, NULL,
              ${row.quantity}, ${lineTotal.toFixed(2)}, '0', '0',
              ${lineTotal.toFixed(2)}, ${lineTotal.toFixed(2)}, '0',
              'paid'::payment_status,
              ${row.note}, ${row.created_by}, ${row.created_by}, NULL,
              ${receivedAt}, ${receivedAt}
            ) RETURNING id
          `;
          stats.receiptsInserted++;

          await tx`
            INSERT INTO goods_receipt_items (
              receipt_id, purchase_order_item_id, variant_id,
              quantity, unit_cost, discount, line_total, note, created_at
            ) VALUES (
              ${receipt.id}, ${poItem.id}, ${row.variant_id},
              ${row.quantity}, ${unitCost.toFixed(2)}, '0',
              ${lineTotal.toFixed(2)}, ${row.note}, ${receivedAt}
            )
          `;
          stats.receiptItemsInserted++;
        }
      });
    }

    console.log("  ✓ Migration summary:");
    console.log(`     Purchase orders:        ${stats.poInserted}`);
    console.log(`     PO line items:          ${stats.poItemsInserted}`);
    console.log(`     Goods receipts:         ${stats.receiptsInserted}`);
    console.log(`     Receipt line items:     ${stats.receiptItemsInserted}`);
    console.log(`     Skipped (no variant):   ${stats.skippedNoVariant}`);

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
