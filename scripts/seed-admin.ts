import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "../packages/database/src/lib/security";
import * as schema from "../packages/database/src/schema";
import { ROLE } from "../packages/shared/src/constants";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Admin";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD env variable is required for production seed");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function seedAdmin() {
  console.log("🔐 Seeding production admin...");

  const passwordHash = await hashPassword(ADMIN_PASSWORD!);

  const existing = await db.query.profiles.findFirst({
    where: eq(schema.profiles.username, ADMIN_USERNAME),
  });

  if (existing) {
    await db
      .update(schema.profiles)
      .set({
        fullName: ADMIN_FULL_NAME,
        phone: ADMIN_PHONE || existing.phone,
        role: ROLE.OWNER,
        isActive: true,
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.username, ADMIN_USERNAME));
    console.log(`  ✓ Updated: ${ADMIN_USERNAME}`);
  } else {
    await db.insert(schema.profiles).values({
      username: ADMIN_USERNAME,
      fullName: ADMIN_FULL_NAME,
      phone: ADMIN_PHONE,
      role: ROLE.OWNER,
      isActive: true,
      passwordHash,
    });
    console.log(`  ✓ Created: ${ADMIN_USERNAME}`);
  }

  console.log("✅ Admin seed complete.");
  await client.end();
}

seedAdmin().catch((err) => {
  console.error("❌ Admin seed failed:", err);
  process.exit(1);
});
