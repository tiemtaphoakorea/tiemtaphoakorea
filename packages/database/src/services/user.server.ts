import { DEFAULT_PASSWORD_LENGTH, ERROR_MESSAGE, ROLE } from "@repo/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@repo/shared/pagination";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { hashPassword } from "../lib/security";
import type { UserRole } from "../schema/enums";
import { profiles } from "../schema/profiles";

type CreateUserData = {
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  password?: string;
};

export type UpdateUserData = {
  fullName?: string;
  role?: UserRole;
  phone?: string;
};

export async function getUserById(userId: string) {
  const user = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, userId), ne(profiles.role, ROLE.CUSTOMER)),
  });
  return user;
}

const usersListWhere = (search?: string) =>
  and(
    ne(profiles.role, ROLE.CUSTOMER),
    search
      ? or(ilike(profiles.fullName, `%${search}%`), ilike(profiles.username, `%${search}%`))
      : undefined,
  );

export async function getUsers(search?: string) {
  return await db.query.profiles.findMany({
    where: (p, { or, ilike, and, ne }) =>
      and(
        ne(p.role, ROLE.CUSTOMER),
        search ? or(ilike(p.fullName, `%${search}%`), ilike(p.username, `%${search}%`)) : undefined,
      ),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
}

export async function getUsersPaginated(
  params: { search?: string; page?: number; limit?: number } = {},
) {
  const { search, page = PAGINATION_DEFAULT.PAGE, limit = PAGINATION_DEFAULT.LIMIT } = params;
  const offset = (page - 1) * limit;
  const where = usersListWhere(search);

  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(where);
  const total = Number(totalRow?.count ?? 0);

  const data = await db
    .select()
    .from(profiles)
    .where(where)
    .orderBy(desc(profiles.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    metadata: calculateMetadata(total, page, limit),
  };
}

export async function createUser(data: CreateUserData) {
  const password = data.password || Math.random().toString(36).slice(-DEFAULT_PASSWORD_LENGTH); // Generate random password if not provided

  // No email construction needed anymore
  const username = data.username;

  if (!username) {
    throw new Error("Username must be provided");
  }

  const passwordHash = await hashPassword(password);

  try {
    // 1. Create Profile Record
    const [newProfile] = await db
      .insert(profiles)
      .values({
        username: username,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
        passwordHash: passwordHash,
        isActive: true,
      })
      .returning();

    return { profile: newProfile, password };
  } catch (error) {
    const dbError = error as Error;
    console.error("Profile creation failed:", dbError);
    throw new Error(`${ERROR_MESSAGE.USER.PROFILE_CREATE_FAILED}: ${dbError.message}`);
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  // Update Profile
  const [updatedProfile] = await db
    .update(profiles)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning();

  // Optional: Update Auth Metadata if needed
  /*
  const supabaseAdmin = await createClient();
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole }
  });
  */

  return updatedProfile;
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  // 1. Update Profile
  const [updatedProfile] = await db
    .update(profiles)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning();

  return updatedProfile;
}

export async function updateUser(userId: string, data: UpdateUserData) {
  const [updatedProfile] = await db
    .update(profiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  return updatedProfile;
}

export async function deleteUser(userId: string) {
  const [deleted] = await db.delete(profiles).where(eq(profiles.id, userId)).returning();
  return deleted;
}

export async function resetUserPassword(userId: string) {
  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!user || user.role === ROLE.CUSTOMER) {
    throw new Error(ERROR_MESSAGE.USER.NOT_FOUND_OR_CUSTOMER);
  }

  const newPassword = Math.random().toString(36).slice(-DEFAULT_PASSWORD_LENGTH);

  const passwordHash = await hashPassword(newPassword);

  const [updatedProfile] = await db
    .update(profiles)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  return { newPassword, profile: updatedProfile };
}
