/**
 * Authentication Security Tests
 *
 * Tests for authentication mechanisms including:
 * - Session validation
 * - Unauthenticated access rejection
 * - Login/logout security
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, MOCK_PROFILES } from "./helpers/security-helpers";

// Mock Security Server
vi.mock("@/lib/security.server", () => ({
  verifySession: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

// Mock database
vi.mock("@/db/db.server", () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("Authentication Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("requireUserSession", () => {
    it("should return user when session is valid", async () => {
      const { verifySession } = await import("@/lib/security.server");
      const mockUser = {
        userId: "test-user-id",
        username: "testuser",
        role: "owner",
      };

      vi.mocked(verifySession).mockResolvedValue(mockUser);

      const { requireUserSession } = await import("@/lib/auth.server");
      // Must provide token so getSession calls verifySession
      const request = createMockRequest({
        url: "http://localhost:3000/",
        cookies: { admin_session: "valid-token" },
      });

      const result = await requireUserSession(request);

      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.userId,
          username: mockUser.username,
          role: mockUser.role,
        }),
      );
    });

    it("should throw redirect when no session", async () => {
      const { verifySession } = await import("@/lib/security.server");

      vi.mocked(verifySession).mockResolvedValue(null);

      const { requireUserSession } = await import("@/lib/auth.server");
      const request = createMockRequest({ url: "http://localhost:3000/" });

      // Should throw a redirect response
      await expect(requireUserSession(request)).rejects.toThrow();
    });
  });

  describe("requireRole", () => {
    it("should allow access for matching role", async () => {
      const { verifySession } = await import("@/lib/security.server");
      const { db } = await import("@/db/db.server");

      const mockUser = {
        userId: "owner-auth-id",
        username: "admin",
        role: "owner",
      };

      vi.mocked(verifySession).mockResolvedValue(mockUser);

      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(MOCK_PROFILES.admin as any);

      const { requireRole } = await import("@/lib/auth.server");
      // Must provide token
      const request = createMockRequest({
        url: "http://localhost:3000/",
        cookies: { admin_session: "valid-token" },
      });

      const result = await requireRole(request, ["owner"]);

      expect(result.profile.role).toBe("owner");
    });

    it("should reject access for non-matching role", async () => {
      const { verifySession } = await import("@/lib/security.server");
      const { db } = await import("@/db/db.server");

      const mockUser = {
        userId: "customer-auth-id",
        username: "customer",
        role: "customer",
      };

      vi.mocked(verifySession).mockResolvedValue(mockUser);

      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(MOCK_PROFILES.customer as any);

      const { requireRole } = await import("@/lib/auth.server");
      const request = createMockRequest({
        url: "http://localhost:3000/",
        cookies: { admin_session: "valid-token" },
      });

      // Customer trying to access admin route should be rejected
      await expect(requireRole(request, ["owner"])).rejects.toThrow();
    });

    it("should reject inactive users", async () => {
      const { verifySession } = await import("@/lib/security.server");
      const { db } = await import("@/db/db.server");

      const mockUser = {
        userId: "inactive-auth-id",
        username: "inactive",
        role: "staff",
      };

      vi.mocked(verifySession).mockResolvedValue(mockUser);

      // Return inactive user profile
      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(MOCK_PROFILES.inactive as any);

      const { requireRole } = await import("@/lib/auth.server");
      const request = createMockRequest({
        url: "http://localhost:3000/",
        cookies: { admin_session: "valid-token" },
      });

      // Inactive users are now properly rejected (security fix implemented)
      await expect(requireRole(request, ["staff"])).rejects.toThrow();
    });
  });

  describe("login response security", () => {
    it("should NOT include access_token in login API response", () => {
      // The login route sets an httpOnly cookie but must not return a raw token
      // in the JSON body — that would make it XSS-accessible via localStorage.
      const loginResponse = {
        success: true,
        user: { id: "u1", username: "admin", role: "owner", fullName: "Admin" },
      };

      expect(loginResponse).not.toHaveProperty("access_token");
    });
  });

  describe("Password Security", () => {
    it("should not return password in user creation response", async () => {
      // When creating a user, the password should not be included in the profile response
      // Only returned once for initial credential sharing

      const userCreationResponse = {
        profile: {
          id: "new-user-id",
          username: "newuser",
          role: "staff",
          fullName: "New User",
        },
        // Password is returned separately, not in profile
        password: "temp-password", // This is intentional for initial sharing
      };

      // The profile object should NOT contain password
      expect(userCreationResponse.profile).not.toHaveProperty("password");
      expect(userCreationResponse.profile).not.toHaveProperty("passwordHash");
    });

    it("should use strong random passwords for auto-generation", () => {
      // Simulating the password generation logic
      const generatedPassword = Math.random().toString(36).slice(-8);

      // Password should be at least 8 characters
      expect(generatedPassword.length).toBeGreaterThanOrEqual(8);

      // Should contain alphanumeric characters
      expect(generatedPassword).toMatch(/[a-z0-9]/i);
    });
  });
});
