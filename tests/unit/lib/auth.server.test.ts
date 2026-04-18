import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  changeAdminPassword,
  getAuthenticatedUser,
  getInternalUser,
  getUserProfile,
  invalidateProfileCache,
  requireAdmin,
  requireInternalUser,
  requireRole,
  requireUserSession,
} from "@/lib/auth.server";
import { hashPassword, verifyPassword, verifySession } from "@/lib/security.server";

vi.mock("@/lib/security.server", () => ({
  verifySession: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/db/db.server", () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

describe("Auth Server Helpers", () => {
  const makeRequestWithToken = (token = "test-token") =>
    new Request("http://localhost", {
      headers: { Cookie: `admin_session=${token}` },
    });

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear in-memory profile cache so tests don't bleed into each other
    invalidateProfileCache("user-123");
    invalidateProfileCache("owner-id");
    invalidateProfileCache("staff-id");
    invalidateProfileCache("manager-id");
  });

  describe("requireUserSession", () => {
    it("should throw redirect if no session", async () => {
      const request = new Request("http://localhost");

      try {
        await requireUserSession(request);
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });

    it("should return user if exists", async () => {
      const user = { id: "1", username: "user1", role: "owner" };
      (verifySession as any).mockResolvedValueOnce({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      const result = await requireUserSession(makeRequestWithToken());
      expect(result.user).toEqual(user);
    });
  });

  describe("requireAdmin", () => {
    it("should allow if user is owner", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "owner-id",
        username: "admin",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "owner",
        isActive: true,
      });

      const result = await requireAdmin(makeRequestWithToken());
      expect(result.profile.role).toBe("owner");
    });

    it("should redirect if user is not owner", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "user-id",
        username: "user",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "customer",
        isActive: true,
      });

      try {
        await requireAdmin(makeRequestWithToken());
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });

    it("should redirect if profile not found", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "user-id",
        username: "user",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      try {
        await requireAdmin(makeRequestWithToken());
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });
  });

  describe("getUserProfile", () => {
    it("should return null if no user session", async () => {
      const request = new Request("http://localhost");
      const result = await getUserProfile(request);
      expect(result).toBeNull();
    });

    it("should return profile if user exists", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "user-123",
        username: "user123",
        role: "customer",
      });
      const mockProfile = {
        id: "profile-1",
        role: "customer",
        fullName: "John",
      };
      (db.query.profiles.findFirst as any).mockResolvedValue(mockProfile);

      const result = await getUserProfile(makeRequestWithToken());
      expect(result).toEqual(mockProfile);
    });

    it("should return null if profile not found", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "user-123",
        username: "user123",
        role: "customer",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      const result = await getUserProfile(makeRequestWithToken());
      expect(result).toBeNull();
    });
  });

  describe("getAuthenticatedUser", () => {
    it("should return profile for authenticated user", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "user-123",
        username: "user123",
        role: "owner",
      });
      const mockProfile = { id: "profile-1", role: "owner" };
      (db.query.profiles.findFirst as any).mockResolvedValue(mockProfile);

      const result = await getAuthenticatedUser(makeRequestWithToken());
      expect(result).toEqual(mockProfile);
    });

    it("should return null for unauthenticated request", async () => {
      const request = new Request("http://localhost");
      const result = await getAuthenticatedUser(request);
      expect(result).toBeNull();
    });
  });

  describe("requireRole", () => {
    it("should allow user with matching role", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "staff-id",
        username: "staff",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "staff",
        isActive: true,
      });

      const result = await requireRole(makeRequestWithToken(), ["staff", "manager"]);
      expect(result.profile.role).toBe("staff");
    });

    it("should redirect if role not in allowed list", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "customer-id",
        username: "customer",
        role: "customer",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "customer",
        isActive: true,
      });

      try {
        await requireRole(makeRequestWithToken(), ["owner"]);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });

    it("should redirect if profile is inactive", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "inactive-id",
        username: "inactive",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "staff",
        isActive: false,
      });

      try {
        await requireRole(makeRequestWithToken(), ["staff"]);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });

    it("should redirect if profile is missing", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "missing-profile-id",
        username: "missing",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      try {
        await requireRole(makeRequestWithToken(), ["owner"]);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.status).toBe(302);
      }
    });
  });

  describe("requireInternalUser", () => {
    it("should allow manager role", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "manager-id",
        username: "manager",
        role: "manager",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "manager",
        isActive: true,
      });

      const result = await requireInternalUser(makeRequestWithToken());
      expect(result.profile.role).toBe("manager");
    });

    it("should allow staff role", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "staff-id",
        username: "staff",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "staff",
        isActive: true,
      });

      const result = await requireInternalUser(makeRequestWithToken());
      expect(result.profile.role).toBe("staff");
    });

    // Owner, manager, and staff are internal roles; there is no separate admin role anymore
  });

  describe("getInternalUser", () => {
    it("should return null if no session user", async () => {
      const request = new Request("http://localhost");
      const result = await getInternalUser(request);
      expect(result).toBeNull();
    });

    it("should return null if profile is missing", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "missing-profile-id",
        username: "missing",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      const result = await getInternalUser(makeRequestWithToken());
      expect(result).toBeNull();
    });

    it("should return null if profile is inactive", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "inactive-id",
        username: "inactive",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "owner",
        isActive: false,
      });

      const result = await getInternalUser(makeRequestWithToken());
      expect(result).toBeNull();
    });

    it("should return null for non-internal role", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "customer-id",
        username: "customer",
        role: "customer",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "customer",
        isActive: true,
      });

      const result = await getInternalUser(makeRequestWithToken());
      expect(result).toBeNull();
    });

    it("should return user and profile for internal role", async () => {
      const user = { id: "staff-id", username: "staff", role: "staff" };
      (verifySession as any).mockResolvedValueOnce({
        userId: user.id,
        username: user.username,
        role: user.role,
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "staff",
        isActive: true,
      });

      const result = await getInternalUser(makeRequestWithToken());
      expect(result?.user).toEqual(user);
      expect(result?.profile.role).toBe("staff");
    });
  });

  describe("changeAdminPassword", () => {
    it("should return unauthorized if no user", async () => {
      const result = await changeAdminPassword(
        new Request("http://localhost"),
        "currentpass",
        "newpass",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return unauthorized if user is not admin/owner", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "staff-id",
        username: "staff",
        role: "staff",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "staff",
        isActive: true,
      });

      const result = await changeAdminPassword(makeRequestWithToken(), "currentpass", "newpass");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
    it("should return error if current password is wrong", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "owner-id",
        username: "admin",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "owner",
        isActive: true,
        passwordHash: "hash",
      });
      (verifyPassword as any).mockResolvedValueOnce(false);

      const result = await changeAdminPassword(makeRequestWithToken(), "wrongpass", "newpass");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Mật khẩu hiện tại không đúng");
    });

    it("should throw if update fails", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "owner-id",
        username: "admin",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "owner",
        isActive: true,
        passwordHash: "hash",
      });
      (verifyPassword as any).mockResolvedValueOnce(true);
      (hashPassword as any).mockResolvedValueOnce("new-hash");
      (db.update as any).mockImplementationOnce(() => {
        throw new Error("Update failed");
      });

      await expect(
        changeAdminPassword(makeRequestWithToken(), "currentpass", "newpass"),
      ).rejects.toThrow("Update failed");
    });

    it("should return success on successful password change", async () => {
      (verifySession as any).mockResolvedValueOnce({
        userId: "owner-id",
        username: "admin",
        role: "owner",
      });
      (db.query.profiles.findFirst as any).mockResolvedValue({
        role: "owner",
        isActive: true,
        passwordHash: "hash",
      });
      (verifyPassword as any).mockResolvedValueOnce(true);
      (hashPassword as any).mockResolvedValueOnce("new-hash");

      const result = await changeAdminPassword(makeRequestWithToken(), "currentpass", "newpass");

      expect(result.success).toBe(true);
    });
  });
});
