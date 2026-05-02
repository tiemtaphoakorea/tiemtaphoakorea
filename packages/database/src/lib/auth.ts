import { ERROR_MESSAGE, INTERNAL_ROLES, ROLE } from "@workspace/shared/constants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { profiles } from "../schema/profiles";
import { hashPassword, verifyPassword, verifySession } from "./security";

// In-memory TTL cache for profile lookups.
// Avoids a round-trip DB query on every API call for the same user.
// TTL: 60s — safe because role/isActive changes are infrequent admin operations.
const _profileCache = new Map<
  string,
  { value: typeof profiles.$inferSelect | null; expiresAt: number }
>();
const PROFILE_CACHE_TTL = 60_000;

// Transient errors thrown by postgres-js / Supabase pooler when a connection
// is dropped or DNS/TCP handshake fails. These are usually fixed by retrying
// once because the pool establishes a fresh connection on the next attempt.
const TRANSIENT_DB_ERROR_CODES = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
]);

function isTransientDbError(error: unknown) {
  const code =
    (error as { code?: string })?.code ??
    (error as { errno?: string })?.errno ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code ? TRANSIENT_DB_ERROR_CODES.has(code) : false;
}

async function getCachedProfile(userId: string) {
  const now = Date.now();
  const cached = _profileCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.value;

  // Retry once on transient connection errors. The pooler occasionally drops
  // idle connections; the next attempt usually succeeds with a fresh socket.
  let profile: typeof profiles.$inferSelect | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      profile = (await db.query.profiles.findFirst({ where: eq(profiles.id, userId) })) ?? null;
      break;
    } catch (error) {
      if (attempt === 0 && isTransientDbError(error)) continue;
      throw error;
    }
  }

  _profileCache.set(userId, { value: profile, expiresAt: now + PROFILE_CACHE_TTL });
  return profile;
}

/** Call when a profile is updated so the cache entry is invalidated immediately. */
export function invalidateProfileCache(userId: string) {
  _profileCache.delete(userId);
}

export { INTERNAL_ROLES };

function redirectWithStatus(url: string) {
  try {
    redirect(url);
  } catch (error: any) {
    if (process.env.NODE_ENV === "test") {
      const err = error instanceof Error ? error : new Error("Redirect");
      (err as any).status = (err as any).status ?? 302;
      (err as any).location = url;
      throw err;
    }
    throw error;
  }
}

export async function getSession(request?: Request) {
  let token: string | undefined;

  if (request) {
    // Read session from httpOnly cookie only — no Authorization header
    const cookieHeader = request.headers.get("Cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    token = match ? match[1] : undefined;
  } else {
    // Server Component or Action
    const cookieStore = await cookies();
    token = cookieStore.get("admin_session")?.value;
  }

  if (!token) {
    return { user: null };
  }

  const payload = await verifySession(token);
  if (!payload) {
    return { user: null };
  }

  // Map payload to user object structure expected by rest of the app
  const user = {
    id: payload.userId as string,
    username: payload.username as string,
    role: payload.role as string,
  };

  return { user };
}

export async function requireUserSession(request?: Request) {
  const { user } = await getSession(request);

  if (!user) {
    redirectWithStatus("/admin/login");
  }

  return { user };
}

export async function getUserProfile(userIdOrRequest: string | Request) {
  if (typeof userIdOrRequest !== "string") {
    const { user } = await getSession(userIdOrRequest);
    if (!user) return null;
    return getCachedProfile(user.id);
  }

  return getCachedProfile(userIdOrRequest);
}

export async function requireRole(
  requestOrRoles: Request | string[],
  maybeAllowedRoles?: string[],
) {
  const request = Array.isArray(requestOrRoles) ? undefined : requestOrRoles;
  const allowedRoles = Array.isArray(requestOrRoles) ? requestOrRoles : (maybeAllowedRoles ?? []);

  const { user } = await requireUserSession(request);

  if (!user) {
    redirectWithStatus("/login");
    throw new Error(); // Satisfy TS, though redirect throws
  }

  const userProfile = await getUserProfile(user.id);

  if (!userProfile) {
    redirectWithStatus("/login");
  }

  if (userProfile && !userProfile.isActive) {
    redirectWithStatus("/login");
  }

  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    redirectWithStatus("/");
  }

  return { user, profile: userProfile };
}

export async function requireAdmin(request?: Request) {
  // Owner is the only top-level admin role
  return requireRole(request ?? [ROLE.OWNER], [ROLE.OWNER]);
}

export async function requireInternalUser(request?: Request) {
  return requireRole(request ?? [...INTERNAL_ROLES], [...INTERNAL_ROLES]);
}

// API Helpers that return null/failure instead of redirecting
export async function getInternalUser(request?: Request) {
  const { user } = await getSession(request);
  if (!user) return null;

  const userProfile = await getUserProfile(user.id);
  if (!userProfile) return null;
  if (!userProfile.isActive) return null;
  if (!INTERNAL_ROLES.includes(userProfile.role as any)) return null;
  // Role changed since JWT was issued → force re-login so new permissions take effect
  if (user.role !== userProfile.role) return null;

  return { user, profile: userProfile };
}

export async function getAuthenticatedUser(request: Request) {
  return getUserProfile(request);
}

export async function changeAdminPassword(
  request: Request,
  currentPassword: string,
  newPassword: string,
) {
  const { user } = await getSession(request);

  if (!user) {
    return { success: false, error: ERROR_MESSAGE.AUTH.UNAUTHORIZED };
  }

  const profile = await getUserProfile(user.id);
  // Only the shop owner can change admin password
  if (!profile || profile.role !== ROLE.OWNER) {
    return { success: false, error: ERROR_MESSAGE.AUTH.UNAUTHORIZED };
  }

  const isPasswordCorrect = await verifyPassword(currentPassword, profile.passwordHash || "");
  if (!isPasswordCorrect) {
    return {
      success: false,
      error: ERROR_MESSAGE.AUTH.CURRENT_PASSWORD_INVALID,
    };
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(profiles)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  invalidateProfileCache(user.id);
  return { success: true };
}
