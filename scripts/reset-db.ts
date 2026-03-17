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
    // Set statement timeout to 30 seconds
    await client.unsafe(`SET statement_timeout = '30s';`);

    const tableList = TABLES.map((t) => `"${t}"`).join(", ");
    await client.unsafe(`TRUNCATE ${tableList} RESTART IDENTITY CASCADE;`);

    console.log("✅ Database reset complete.");
  } finally {
    await client.end();
  }
}

resetDb().catch((err) => {
  console.error("❌ Database reset failed:", err);
  process.exit(1);
});
