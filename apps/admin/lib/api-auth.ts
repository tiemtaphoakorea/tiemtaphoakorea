import { getInternalUser } from "@workspace/database/lib/auth";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

type ApiUser = NonNullable<Awaited<ReturnType<typeof getInternalUser>>>;

/**
 * Auth gate for admin API routes. Returns either the authenticated user or a
 * pre-built 401/403 response — keeps each handler's auth boilerplate to two
 * lines.
 *
 * Usage:
 *   const auth = await requireApiUser(request, "owner");
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export type AuthLevel = "internal" | "owner";

export type AuthResult = { ok: true; user: ApiUser } | { ok: false; response: NextResponse };

export async function requireApiUser(
  request: Request,
  level: AuthLevel = "internal",
): Promise<AuthResult> {
  const user = await getInternalUser(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED }),
    };
  }
  if (level === "owner" && user.profile.role !== ROLE.OWNER) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN }),
    };
  }
  return { ok: true, user };
}
