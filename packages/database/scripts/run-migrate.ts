import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const url = process.env.DATABASE_URL as string;
const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client);

async function run() {
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../drizzle") });
    console.log("Done!");
  } catch (e) {
    console.error("Migration error:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  } finally {
    await client.end({ timeout: 3 });
  }
}
run();
