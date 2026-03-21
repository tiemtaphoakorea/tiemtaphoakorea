import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../packages/database/src/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("Deleting all products (cascades to variants, images, cost history)...");
  const deleted = await db.delete(schema.products).returning({ id: schema.products.id });
  console.log(`Deleted ${deleted.length} products.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
