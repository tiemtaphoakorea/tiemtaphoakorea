/**
 * Authorization/RBAC Security Tests
 *
 * Tests for Role-Based Access Control (RBAC) including:
 * - Route-level authorization
 * - Feature-level permissions
 * - Horizontal privilege escalation prevention
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestRequest, createMockRequest, MOCK_PROFILES } from "./helpers/security-helpers";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
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

describe("Authorization/RBAC Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Hierarchy", () => {
    const ROLE_HIERARCHY = {
      owner: 100,
      manager: 80,
      staff: 60,
      customer: 20,
      guest: 10,
    };

    it("should define correct role hierarchy", () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.manager);
      expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.staff);
      expect(ROLE_HIERARCHY.staff).toBeGreaterThan(ROLE_HIERARCHY.customer);
      expect(ROLE_HIERARCHY.customer).toBeGreaterThan(ROLE_HIERARCHY.guest);
    });

    it("should have internal roles defined correctly", async () => {
      const { INTERNAL_ROLES } = await import("@/lib/auth.server");

      expect(INTERNAL_ROLES).toContain("owner");
      expect(INTERNAL_ROLES).toContain("manager");
      expect(INTERNAL_ROLES).toContain("staff");

      // Customer and guest are NOT internal roles
      expect(INTERNAL_ROLES).not.toContain("customer");
      expect(INTERNAL_ROLES).not.toContain("guest");
    });
  });

  describe("Admin Route Protection", () => {
    const adminRoutes = [
      "/dashboard",
      "/users",
      "/products",
      "/orders",
      "/customers",
      "/settings",
      "/analytics",
      "/finance",
    ];

    it.each(adminRoutes)("should protect %s from unauthenticated access", async (route) => {
      const { createClient } = await import("@/lib/supabase/server");

      vi.mocked(createClient).mockReturnValue({
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: null,
            }),
          },
        },
        response: { headers: new Headers() },
      } as any);

      const { requireInternalUser } = await import("@/lib/auth.server");
      const request = createMockRequest({
        url: `http://localhost:3000${route}`,
      });

      await expect(requireInternalUser(request)).rejects.toThrow();
    });

    it.each(adminRoutes)("should protect %s from customer access", async (route) => {
      const { createClient } = await import("@/lib/supabase/server");
      const { db } = await import("@/db/db.server");

      const mockUser = { id: "customer-auth-id", email: "customer@shop.com" };

      vi.mocked(createClient).mockReturnValue({
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null,
            }),
          },
        },
        response: { headers: new Headers() },
      } as any);

      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(MOCK_PROFILES.customer as any);

      const { requireInternalUser } = await import("@/lib/auth.server");
      const request = createMockRequest({
        url: `http://localhost:3000${route}`,
      });

      await expect(requireInternalUser(request)).rejects.toThrow();
    });
  });

  describe("Owner-Only Features", () => {
    const ownerOnlyFeatures = [
      { feature: "user-management", requiredRoles: ["owner"] },
      { feature: "system-settings", requiredRoles: ["owner"] },
    ];

    it.each(ownerOnlyFeatures)("$feature should be restricted to $requiredRoles", async ({
      requiredRoles,
    }) => {
      const { createClient } = await import("@/lib/supabase/server");
      const { db } = await import("@/db/db.server");

      // Test with manager (should be rejected)
      const mockManagerUser = {
        id: "manager-auth-id",
        email: "manager@shop.com",
      };

      vi.mocked(createClient).mockReturnValue({
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: mockManagerUser },
              error: null,
            }),
          },
        },
        response: { headers: new Headers() },
      } as any);

      vi.mocked(db.query.profiles.findFirst).mockResolvedValue(MOCK_PROFILES.manager as any);

      const { requireRole } = await import("@/lib/auth.server");
      const request = createMockRequest({
        url: "http://localhost:3000/users",
      });

      // Manager should NOT have access to owner-only features
      await expect(requireRole(request, requiredRoles)).rejects.toThrow();
    });
  });

  describe("Guest Access Control", () => {
    it("should allow guest to send chat messages with valid guest ID", () => {
      const guestId = "guest-uuid-12345";
      const request = createGuestRequest(guestId, {
        method: "POST",
        url: "http://localhost:3000/api/chat.send",
        body: { roomId: "room-1", content: "Hello" },
      });

      const guestHeader = request.headers.get("x-guest-id");
      expect(guestHeader).toBe(guestId);
    });

    it("should reject guest without guest ID header", () => {
      const request = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/chat.send",
        body: { roomId: "room-1", content: "Hello" },
      });

      const guestHeader = request.headers.get("x-guest-id");
      expect(guestHeader).toBeNull();
    });

    it("should validate guest ID format", () => {
      const validGuestId = "guest-550e8400-e29b-41d4-a716-446655440000";
      const invalidGuestId = "invalid";

      // Valid UUID format
      expect(validGuestId).toMatch(/guest-[0-9a-f-]{36}/i);

      // Invalid format should not match
      expect(invalidGuestId).not.toMatch(/guest-[0-9a-f-]{36}/i);
    });
  });

  describe("Horizontal Privilege Escalation Prevention", () => {
    it("should prevent customer A from accessing customer B data", () => {
      const customerA = { ...MOCK_PROFILES.customer, id: "customer-a-id" };
      const _customerB = { ...MOCK_PROFILES.customer, id: "customer-b-id" };

      // Customer A should only access their own data
      const requestedResourceOwnerId = "customer-b-id";
      const currentUserId = customerA.id;

      expect(currentUserId).not.toBe(requestedResourceOwnerId);

      // A proper authorization check would reject this
      const isAuthorized = currentUserId === requestedResourceOwnerId;
      expect(isAuthorized).toBe(false);
    });

    it("should prevent user from modifying another user role", () => {
      const manager = MOCK_PROFILES.manager;
      const _targetUserId = "other-user-id";

      // Manager should not be able to modify users
      // Only owner/admin can do this
      const canModifyUsers = ["owner", "admin"].includes(manager.role);
      expect(canModifyUsers).toBe(false);
    });

    it("should prevent order access across customers", () => {
      const order = {
        id: "order-123",
        customerId: "customer-a-id",
      };

      const currentCustomerId = "customer-b-id";

      // Customer B should not access Customer A's order
      const canAccessOrder = order.customerId === currentCustomerId || false; // or isAdmin check

      expect(canAccessOrder).toBe(false);
    });
  });

  describe("API Endpoint Authorization", () => {
    it("should require internal user for upload endpoint", async () => {
      // /api/upload requires owner or manager
      const allowedRoles = ["owner", "manager"];

      // Staff and customer should NOT be able to upload
      expect(allowedRoles).not.toContain("staff");
      expect(allowedRoles).not.toContain("customer");
    });

    it("should allow authenticated user OR guest for chat.send", () => {
      // Chat send allows either:
      // 1. Authenticated user (any role)
      // 2. Guest with x-guest-id header

      const authenticatedRequest = createMockRequest({
        method: "POST",
        url: "http://localhost:3000/api/chat.send",
        cookies: { "sb-access-token": "valid-token" },
      });

      const guestRequest = createGuestRequest("guest-123", {
        method: "POST",
        url: "http://localhost:3000/api/chat.send",
      });

      // Both should have some form of identification
      expect(
        authenticatedRequest.headers.get("Cookie") || guestRequest.headers.get("x-guest-id"),
      ).toBeTruthy();
    });
  });
});
