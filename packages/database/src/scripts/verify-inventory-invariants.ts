import { sql } from "drizzle-orm";
import { db } from "../db";

export type InventoryInvariantReport = {
  reservedMismatches: number;
};

/**
 * Run inventory invariants against the current DB and return counts.
 * Exposed so tests can exercise the exact SQL without invoking process.exit.
 *
 * 1. `product_variants.reserved` equals the sum of `order_items.quantity`
 *    across that variant's pending orders (and only pending — historical
 *    completed/cancelled items must not contribute).
 */
// drizzle's db.execute() returns different shapes across drivers:
//  - postgres-js (production): an array-like RowList with .length/.map
//  - pglite (in-memory tests):  { rows: Row[], fields, affectedRows }
// Normalize to a plain array so callers don't need to branch.
function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

export async function checkInventoryInvariants(): Promise<InventoryInvariantReport> {
  // The status predicate must gate the SUM via CASE, not the LEFT JOIN's ON.
  // Putting it on the ON clause only NULLs the `orders` row; the already-joined
  // `order_items` row still appears in the aggregate, so non-pending items
  // would be summed and every variant with historical orders would false-trigger.
  const mismatchResult = await db.execute(sql`
    SELECT pv.id, pv.reserved,
      COALESCE(SUM(CASE WHEN o.fulfillment_status = 'pending' THEN oi.quantity ELSE 0 END), 0) AS expected
    FROM product_variants pv
    LEFT JOIN order_items oi ON oi.variant_id = pv.id
    LEFT JOIN orders o ON o.id = oi.order_id
    GROUP BY pv.id, pv.reserved
    HAVING pv.reserved != COALESCE(SUM(CASE WHEN o.fulfillment_status = 'pending' THEN oi.quantity ELSE 0 END), 0)
  `);
  const mismatchRows = rowsOf<unknown>(mismatchResult);

  return {
    reservedMismatches: mismatchRows.length,
  };
}

async function main() {
  const report = await checkInventoryInvariants();
  if (report.reservedMismatches > 0) {
    console.error(`RESERVED MISMATCH: ${report.reservedMismatches} variants`);
    process.exit(1);
  }
  console.log("All inventory invariants hold");
}

// Only run when invoked as a script, not when imported by tests.
const invokedAsScript =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  /verify-inventory-invariants\.ts$/.test(process.argv[1]);
if (invokedAsScript) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
