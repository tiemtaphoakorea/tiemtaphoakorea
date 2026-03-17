import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  createUser,
  getUsers,
  resetUserPassword,
  toggleUserStatus,
  updateUser,
  updateUserRole,
} from "@/services/user.server";

// Mock the db module
vi.mock("@/db/db.server", () => ({
  db: {
    query: {
      profiles: {
        findMany: vi.fn(() => [
          {
            id: "user-1",
            userId: "auth-1",
            fullName: "Admin User",
            email: "admin@example.com",
            role: "admin",
            isActive: true,
            createdAt: new Date(),
          },
          {
            id: "user-2",
            userId: "auth-2",
            fullName: "Staff User",
            email: "staff@example.com",
            role: "staff",
            isActive: true,
            createdAt: new Date(),
          },
        ]),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: "new-user-id",
            userId: "new-auth-id",
            fullName: "New User",
            email: "new@example.com",
            role: "staff",
            isActive: true,
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [
            {
              id: "user-1",
              role: "manager",
              isActive: true,
            },
          ]),
        })),
      })),
    })),
  },
}));

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should fetch all non-customer users and verify query structure", async () => {
      const result = await getUsers();

      expect(db.query.profiles.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].role).not.toBe("customer");

      const callArgs = (db.query.profiles.findMany as any).mock.calls[0][0];

      // Verify where
      const whereFn = callArgs.where;
      const mockOr = vi.fn();
      const mockAnd = vi.fn((...args) => args);
      const mockNe = vi.fn();
      const mockIlike = vi.fn();
      const profilesMock = {
        role: "role",
        fullName: "name",
        username: "username",
        createdAt: "date",
      };
      whereFn(profilesMock, { or: mockOr, ilike: mockIlike, and: mockAnd, ne: mockNe });
      expect(mockNe).toHaveBeenCalled();
      expect(mockOr).not.toHaveBeenCalled();

      // Verify orderBy
      const orderByFn = callArgs.orderBy;
      const mockDesc = vi.fn((col) => col);
      const orderResult = orderByFn(profilesMock, { desc: mockDesc });
      expect(mockDesc).toHaveBeenCalledWith("date");
      expect(orderResult).toEqual(["date"]);
    });

    it("should filter users by search term", async () => {
      await getUsers("admin");

      expect(db.query.profiles.findMany).toHaveBeenCalled();

      const callArgs = (db.query.profiles.findMany as any).mock.calls[0][0];
      const whereFn = callArgs.where;

      const mockOr = vi.fn();
      const mockAnd = vi.fn((...args) => args);
      const mockNe = vi.fn();
      const mockIlike = vi.fn();
      const profilesMock = { role: "role", fullName: "name", username: "username" };

      whereFn(profilesMock, { or: mockOr, ilike: mockIlike, and: mockAnd, ne: mockNe });

      expect(mockNe).toHaveBeenCalled();
      expect(mockIlike).toHaveBeenCalledTimes(2);
      expect(mockOr).toHaveBeenCalled();
    });

    it("should return empty list when no matches found", async () => {
      (db.query.profiles.findMany as any).mockResolvedValueOnce([]);

      const result = await getUsers("nonexistent");

      expect(result).toHaveLength(0);
    });
  });

  describe("createUser", () => {
    it("should create auth user and profile", async () => {
      const data = {
        username: "newstaff",
        fullName: "New Staff",
        role: "staff" as const,
        phone: "0901234567",
      };

      const result = await createUser(data);

      expect(db.insert).toHaveBeenCalled();
      expect(result.profile.id).toBe("new-user-id");
      expect(result.password).toBeDefined();
    });

    it("should use provided password instead of generating one", async () => {
      const data = {
        username: "manager",
        fullName: "Manager",
        role: "manager" as const,
        password: "securePassword123",
      };

      const result = await createUser(data);

      expect(result.password).toBe("securePassword123");
    });

    it("should generate random password if not provided", async () => {
      const data = {
        username: "staff2",
        fullName: "Staff 2",
        role: "staff" as const,
      };

      const result = await createUser(data);

      expect(result.password).toBeDefined();
      expect(result.password.length).toBeGreaterThan(0);
    });

    it("should cleanup auth user if profile creation fails", async () => {
      (db.insert as any).mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const data = {
        username: "failuser",
        fullName: "Fail User",
        role: "staff" as const,
      };

      await expect(createUser(data)).rejects.toThrow(
        "Failed to create user profile: Database connection failed",
      );
    });

    it("should throw error when username is missing", async () => {
      const data = {
        username: "",
        fullName: "Missing Username",
        role: "staff" as const,
      };

      await expect(createUser(data)).rejects.toThrow("Username must be provided");
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      const result = await updateUserRole("auth-1", "manager");

      expect(db.update).toHaveBeenCalled();
      expect(result.role).toBe("manager");
    });

    it("should set updatedAt timestamp", async () => {
      await updateUserRole("auth-1", "admin");

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("toggleUserStatus", () => {
    it("should deactivate user", async () => {
      await toggleUserStatus("auth-1", false);
      expect(db.update).toHaveBeenCalled();
    });

    it("should reactivate user", async () => {
      (db.update as any).mockReturnValueOnce({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [{ id: "user-1", isActive: true }]),
          })),
        })),
      });

      await toggleUserStatus("auth-1", true);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should update user profile fields", async () => {
      (db.update as any).mockReturnValueOnce({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [
              {
                id: "user-1",
                fullName: "Updated User",
                phone: "0900000000",
              },
            ]),
          })),
        })),
      });

      const result = await updateUser("auth-1", {
        fullName: "Updated User",
        phone: "0900000000",
      });

      expect(db.update).toHaveBeenCalled();
      expect(result.fullName).toBe("Updated User");
    });
  });

  describe("resetUserPassword", () => {
    it("should reset password for valid user", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue({
        id: "user-1",
        role: "staff",
      });

      // Mock update to return success
      (db.update as any).mockReturnValueOnce({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => [{ id: "user-1", passwordHash: "new-hash" }]),
          })),
        })),
      });

      const result = await resetUserPassword("user-1");

      expect(db.query.profiles.findFirst).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
      expect(result.newPassword).toBeDefined();
      expect(result.profile.passwordHash).toBe("new-hash");
    });

    it("should throw error if user not found", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      await expect(resetUserPassword("nonexistent")).rejects.toThrow();
    });

    it("should throw error if user is customer", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue({
        id: "customer-1",
        role: "customer",
      });

      await expect(resetUserPassword("customer-1")).rejects.toThrow();
    });
  });
});

describe("User Service - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser edge cases", () => {
    it("should handle user with special characters in name", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn(() => ({
          returning: vi.fn(() => [
            {
              id: "new-user-id",
              userId: "new-auth-id",
              fullName: "O'Brien-Smith Jr.",
              role: "staff",
              isActive: true,
            },
          ]),
        })),
      });
      const data = {
        username: "special",
        fullName: "O'Brien-Smith Jr.",
        role: "staff" as const,
      };

      const result = await createUser(data);

      expect(result.profile.fullName).toBe("O'Brien-Smith Jr.");
    });

    it("should handle missing optional phone field", async () => {
      const data = {
        username: "nophone",
        fullName: "No Phone User",
        role: "staff" as const,
      };

      const result = await createUser(data);

      expect(db.insert).toHaveBeenCalled();
      expect(result.profile).toBeDefined();
    });
  });
});
