import "dotenv/config";
import { db } from "../db/db.server";
import { profiles } from "../db/schema/profiles";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

async function updateAdminPassword() {
  const identifier = process.argv[2] || "admin";
  const newPassword = process.argv[3];

  if (!newPassword) {
    console.error(
      "Usage: npx tsx scripts/update-admin-password.ts <username-or-email> <new-password>",
    );
    console.error(
      "Example: npx tsx scripts/update-admin-password.ts admin newpassword123",
    );
    process.exit(1);
  }

  console.log(`Updating password for: ${identifier}`);

  // Find user by username
  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.username, identifier),
  });

  if (!userProfile) {
    console.error(`User with identifier ${identifier} not found in profiles.`);
    process.exit(1);
  }

  // Update password hash
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(profiles)
    .set({ passwordHash: passwordHash, updatedAt: new Date() })
    .where(eq(profiles.id, userProfile.id));

  console.log("\n----------------------------------------");
  console.log("Password updated successfully in Database!");
  console.log(`Identifier: ${identifier}`);
  console.log(`New Password: ${newPassword}`);
  console.log("----------------------------------------\n");

  process.exit(0);
}

updateAdminPassword().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
