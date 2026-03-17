import { config } from "dotenv";
import * as schema from "./schema";

config();

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

let db: any;

if (isTest) {
  const [{ drizzle }, { PGlite }, { readdir, readFile }] = await Promise.all([
    import("drizzle-orm/pglite"),
    import("@electric-sql/pglite"),
    import("node:fs/promises"),
  ]);
  const { join } = await import("node:path");
  const client = new PGlite();

  // Apply local Drizzle SQL migrations into the in-memory test DB.
  // This keeps unit tests hermetic (no external Postgres/Supabase required).
  const migrationsDir = join(process.cwd(), "drizzle");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    await client.exec(sql);
  }

  db = drizzle(client, { schema });
} else {
  const [{ drizzle }, { default: postgres }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("postgres"),
  ]);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(process.env.DATABASE_URL, {
    max: 10, // Maximum number of connections in pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
    prepare: false, // Disable prepared statements to avoid caching issues
  });
  db = drizzle(client, { schema });
}

export { db };
