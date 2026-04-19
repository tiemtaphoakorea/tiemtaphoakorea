import { sql } from "drizzle-orm";
import { db } from "../db";

async function main() {
  // 1. reserved matches pending-order quantities
  const mismatch = (await db.execute(sql`
    SELECT pv.id, pv.reserved, COALESCE(SUM(oi.quantity), 0) AS expected
    FROM product_variants pv
    LEFT JOIN order_items oi ON oi.variant_id = pv.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.fulfillment_status = 'pending'
    GROUP BY pv.id, pv.reserved
    HAVING pv.reserved != COALESCE(SUM(oi.quantity), 0)
  `)) as unknown[];
  if (mismatch.length > 0) {
    console.error(`RESERVED MISMATCH: ${mismatch.length} variants`);
    process.exit(1);
  }

  // 2. on_hand >= 0
  const negatives = (await db.execute(
    sql`SELECT COUNT(*) AS c FROM product_variants WHERE on_hand < 0`,
  )) as { c: string | number }[];
  if (Number(negatives[0].c) > 0) {
    console.error("NEGATIVE on_hand detected");
    process.exit(1);
  }

  console.log("All inventory invariants hold");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
