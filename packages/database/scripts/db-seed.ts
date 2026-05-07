/**
 * Seed document_sequences with required prefixes (idempotent).
 * Run after restore or db:push to ensure sequence counters exist.
 *
 * Usage:
 *   pnpm --filter @workspace/database db:seed
 */
import "dotenv/config";
import postgres from "postgres";

async function run(): Promise<number> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("✖ DATABASE_URL is not set");
    return 2;
  }

  const client = postgres(DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    const result = await client`
      INSERT INTO document_sequences (prefix, last_seq) VALUES
        ('OSN', 0),
        ('PON', 0),
        ('PCH', 0)
      ON CONFLICT (prefix) DO NOTHING
      RETURNING prefix
    `;
    const inserted = result.map((r: { prefix: string }) => r.prefix);
    if (inserted.length > 0) {
      console.log(`✓ Seeded prefixes: ${inserted.join(", ")}`);
    } else {
      console.log("✓ All prefixes already exist, nothing inserted.");
    }
    return 0;
  } finally {
    await client.end({ timeout: 3 });
  }
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("✖ db:seed failed:", err instanceof Error ? err.message : err);
    process.exit(2);
  });
