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
  // Tests always run from workspace root via vitest.config.ts at the root.
  const migrationsDir = join(process.cwd(), "packages", "database", "drizzle");
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    await client.exec(sql);
  }

  db = drizzle(client, { schema });
} else if (process.env.DATABASE_URL) {
  const [{ drizzle }, { default: postgres }] = await Promise.all([
    import("drizzle-orm/postgres-js"),
    import("postgres"),
  ]);

  // Pool tuned for Supabase transaction pooler (port 6543):
  // - idle_timeout 60s: keep connections warm long enough to survive light
  //   traffic gaps without forcing a fresh TCP handshake on every request.
  //   Short values (e.g. 20s) caused intermittent CONNECT_TIMEOUT errors when
  //   the next request had to re-establish the connection on a transient
  //   network blip — common when a tab resumes from background sleep.
  // - connect_timeout 30s: give DNS/TLS more headroom on flaky networks.
  // - max_lifetime 30min: rotate connections to avoid stale state.
  const client = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 60,
    connect_timeout: 30,
    max_lifetime: 60 * 30,
    prepare: false, // Required for Supabase transaction pooler
    connection: {
      search_path: "public", // Ensure unqualified table names resolve to public schema
    },
  });
  db = drizzle(client, { schema });
} else {
  // DATABASE_URL not set — defer the error to query time.
  // This allows the module to import cleanly during Next.js build.
  db = new Proxy({} as any, {
    get() {
      throw new Error("DATABASE_URL is not set — cannot perform database queries.");
    },
  });
}

export { db };
