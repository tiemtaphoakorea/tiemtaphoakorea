/**
 * One-time script: mark local migration files as "already applied" on a DB
 * whose schema already matches them.
 *
 * Use this exactly once against production (and each existing environment)
 * after rebaselining migrations — the schema is already in place from manual
 * SQL, but Drizzle has no record of it. This script:
 *
 *   1. Creates `drizzle` schema + `__drizzle_migrations` table if missing.
 *   2. Inserts a row for each local migration hash, so `db:status` passes
 *      and future `drizzle-kit migrate` runs only apply new deltas.
 *
 * Aborts (without inserting) if the tracking table already has rows — safe
 * to re-run.
 *
 * Usage:
 *   DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:mark-baseline
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_FOLDER = path.resolve(__dirname, "../drizzle");

function maskDsn(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return "<invalid DATABASE_URL>";
  }
}

async function run(): Promise<number> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("✖ DATABASE_URL is not set");
    return 2;
  }

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (migrations.length === 0) {
    console.error("✖ No migrations found in drizzle/ — nothing to baseline.");
    return 1;
  }

  const client = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    console.log(`Target: ${maskDsn(DATABASE_URL)}`);

    await client.unsafe(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const existing = await client<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM drizzle.__drizzle_migrations
    `;
    const existingCount = Number(existing[0]?.count ?? 0);
    if (existingCount > 0) {
      console.log(
        `⚠ Tracking table already has ${existingCount} row(s). Refusing to double-insert.\n` +
          "  If you need to reset, delete rows manually and re-run.",
      );
      return 0;
    }

    for (const m of migrations) {
      await client`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${m.hash}, ${m.folderMillis})
      `;
      console.log(`  ✓ marked ${m.hash.slice(0, 12)}… as applied`);
    }

    console.log(`\n✓ Baseline complete. ${migrations.length} migration(s) recorded as applied.`);
    return 0;
  } finally {
    await client.end({ timeout: 3 });
  }
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("✖ db:mark-baseline failed:", err instanceof Error ? err.message : err);
    process.exit(2);
  });
