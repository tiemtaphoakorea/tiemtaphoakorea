import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../packages/database/src/db";
import { hashPassword } from "../packages/database/src/lib/security";
import { profiles } from "../packages/database/src/schema/profiles";

// Manually verify env vars if needed, though dotenv handles it
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL must be set in .env");
  process.exit(1);
}

async function createAdmin() {
  const username = "admin";
  const password = "password123";
  const fullName = "Admin User";

  console.log(`Setting up admin account for: ${username}`);

  // 1. Check if profile exists
  const existingProfile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });

  const passwordHash = await hashPassword(password);

  if (existingProfile) {
    if (existingProfile.role === "owner") {
      console.log("Profile already exists and is an owner. Updating password...");
      await db.update(profiles).set({ passwordHash }).where(eq(profiles.id, existingProfile.id));
    } else {
      console.log(`Profile exists but role is ${existingProfile.role}. Updating to owner...`);
      await db
        .update(profiles)
        .set({ role: "owner", passwordHash })
        .where(eq(profiles.id, existingProfile.id));
      console.log("Profile updated to owner.");
    }
  } else {
    console.log("Creating admin profile...");
    await db.insert(profiles).values({
      username,
      fullName,
      role: "owner",
      isActive: true,
      passwordHash,
    });
    console.log("Admin profile created.");
  }

  console.log("\n----------------------------------------");
  console.log("Admin account ready!");
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log("----------------------------------------\n");

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
