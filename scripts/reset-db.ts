import "dotenv/config";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });

const TABLES = [
  "admin_notifications",
  "chat_messages",
  "chat_rooms",
  "idempotency_keys",
  "order_status_history",
  "order_items",
  "supplier_orders",
  "payments",
  "orders",
  "cost_price_history",
  "variant_images",
  "product_variants",
  "products",
  "categories",
  "expenses",
  "daily_reports",
  "system_settings",
  "suppliers",
  "profiles",
];

async function resetDb() {
  console.log("🧹 Resetting database...");

  try {
    await client.unsafe(`SET statement_timeout = '60s';`);
    await client.unsafe(`SET lock_timeout = '10s';`);

    // DELETE in dependency order (children first) to avoid FK conflicts.
    // Using DELETE instead of TRUNCATE to avoid ACCESS EXCLUSIVE lock contention
    // with idle app connections that can't be terminated without SUPERUSER.
    for (const table of TABLES) {
      await client.unsafe(`DELETE FROM "${table}";`);
    }

    // Reset sequences separately (TRUNCATE RESTART IDENTITY equivalent)
    const seqRows = await client.unsafe<{ relname: string }[]>(`
      SELECT relname FROM pg_class
      WHERE relkind = 'S' AND relnamespace = 'public'::regnamespace
    `);
    for (const { relname } of seqRows) {
      await client.unsafe(`ALTER SEQUENCE "${relname}" RESTART WITH 1;`).catch(() => {});
    }

    console.log("✅ Database reset complete.");
  } finally {
    await client.end();
  }
}

resetDb().catch((err) => {
  console.error("❌ Database reset failed:", err);
  process.exit(1);
});
