import { createHash } from "node:crypto";
import { GUEST_CODE_PREFIX, GUEST_EMAIL_DOMAIN, ROLE } from "@repo/shared/constants";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { profiles } from "../schema/profiles";

const GUEST_CODE_MAX_LENGTH = 20;
const GUEST_CODE_BODY_MAX_LENGTH = GUEST_CODE_MAX_LENGTH - GUEST_CODE_PREFIX.length;

function buildGuestCode(guestSessionId: string): string {
  const normalizedSessionId = guestSessionId.trim();
  if (normalizedSessionId.length <= GUEST_CODE_BODY_MAX_LENGTH) {
    return `${GUEST_CODE_PREFIX}${normalizedSessionId}`;
  }

  // Keep guest code deterministic for room reuse while fitting DB length constraints.
  const digest = createHash("sha256").update(normalizedSessionId).digest("hex");
  return `${GUEST_CODE_PREFIX}${digest.slice(0, GUEST_CODE_BODY_MAX_LENGTH)}`;
}

/**
 * Ensures a guest profile exists for the given guest session ID.
 * We use a deterministic guest code to support room reuse across requests.
 */
export async function ensureGuestProfile(guestSessionId: string) {
  const guestCode = buildGuestCode(guestSessionId);

  // 1. Try to find existing profile
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.customerCode, guestCode))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // 2. Create new guest profile
  const [newProfile] = await db
    .insert(profiles)
    .values({
      username: guestCode,
      role: ROLE.CUSTOMER,
      fullName: `Khách ${guestSessionId.slice(0, 5)}`,
      customerCode: guestCode,
      email: `${guestCode}@${GUEST_EMAIL_DOMAIN}`, // Dummy email
      isActive: true,
    })
    .returning();

  return newProfile;
}
