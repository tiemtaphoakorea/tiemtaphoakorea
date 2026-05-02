/**
 * Check database migration status against local migration files.
 *
 * Reads drizzle's migration metadata and queries the
 * `drizzle.__drizzle_migrations` tracking table on the target database.
 *
 * Exit codes:
 *   0  up-to-date
 *   1  pending migrations, or tracking table missing (run db:mark-baseline first)
 *   2  environment / connection problem
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../../../.env") });
const MIGRATIONS_FOLDER = path.resolve(__dirname, "../drizzle");
const JOURNAL_PATH = path.join(MIGRATIONS_FOLDER, "meta", "_journal.json");

type JournalEntry = { idx: number; when: number; tag: string };

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
  const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf-8")) as {
    entries: JournalEntry[];
  };
  // Match migration hash → tag via folderMillis === journal.when.
  const tagByMillis = new Map(journal.entries.map((e) => [e.when, e.tag]));

  const client = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    console.log(`Database: ${maskDsn(DATABASE_URL)}`);

    const tableCheck = await client<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      ) AS exists
    `;
    if (!tableCheck[0]?.exists) {
      console.error(
        "✖ Tracking table drizzle.__drizzle_migrations does not exist.\n" +
          "  Run `pnpm --filter @workspace/database db:mark-baseline` once against this DB.",
      );
      return 1;
    }

    const applied = await client<{ hash: string; created_at: string }[]>`
      SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at
    `;
    const appliedByHash = new Map(applied.map((r) => [r.hash, r]));

    let pending = 0;
    for (const m of migrations) {
      const tag = tagByMillis.get(m.folderMillis) ?? m.hash.slice(0, 12);
      const row = appliedByHash.get(m.hash);
      if (row) {
        const when = new Date(Number(row.created_at)).toISOString().slice(0, 10);
        console.log(`  ✓ ${tag.padEnd(48)} applied ${when}`);
      } else {
        console.log(`  ⚠ ${tag.padEnd(48)} PENDING`);
        pending++;
      }
    }

    const journalHashes = new Set(migrations.map((m) => m.hash));
    const orphans = applied.filter((r) => !journalHashes.has(r.hash));
    for (const o of orphans) {
      console.log(`  ? ${o.hash.slice(0, 12).padEnd(48)} in DB but not in repo`);
    }

    console.log("");
    if (pending === 0 && orphans.length === 0) {
      console.log(
        `✓ Database is up-to-date (${applied.length} migration${applied.length === 1 ? "" : "s"} applied).`,
      );
      return 0;
    }
    if (pending > 0) {
      console.error(
        `✖ ${pending} pending migration${pending === 1 ? "" : "s"} — run \`pnpm --filter @workspace/database db:migrate\` against this DB.`,
      );
    }
    if (orphans.length > 0) {
      console.error(
        `✖ ${orphans.length} migration${orphans.length === 1 ? "" : "s"} applied in DB but missing from repo.`,
      );
    }
    return 1;
  } finally {
    await client.end({ timeout: 3 });
  }
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("✖ db:status failed:", err instanceof Error ? err.message : err);
    process.exit(2);
  });
