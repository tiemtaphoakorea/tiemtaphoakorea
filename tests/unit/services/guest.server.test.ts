import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import { ensureGuestProfile } from "@/services/guest.server";

// Create a spy for values function
const mockValues = vi.fn(() => ({
  returning: vi.fn(() => [
    {
      id: "new-guest-id",
      role: "customer",
      fullName: "Khách abc12",
      customerCode: "guest_abc1234567890",
      email: "guest_abc1234567890@anon.local",
      isActive: true,
    },
  ]),
}));

// Mock the db module
vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: mockValues,
    })),
  },
}));

describe("Guest Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureGuestProfile", () => {
    it("should return existing guest profile if found", async () => {
      const existingProfile = {
        id: "existing-guest-id",
        role: "customer",
        fullName: "Khách 12345",
        customerCode: "guest_12345abcdefg",
        email: "guest_12345abcdefg@anon.local",
        isActive: true,
      };

      // Mock finding existing profile
      const mockLimit = vi.fn().mockResolvedValue([existingProfile]);
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await ensureGuestProfile("12345abcdefg");

      expect(db.select).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
      expect(result.id).toBe("existing-guest-id");
      expect(result.customerCode).toBe("guest_12345abcdefg");
    });

    it("should create new guest profile if not found", async () => {
      // Mock not finding existing (return empty array)
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await ensureGuestProfile("abc1234567890");

      expect(db.select).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(result.customerCode).toBe("guest_abc1234567890");
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "guest_abc1234567890",
        }),
      );
    });

    it("should generate guest name from session ID prefix", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValue({ from: mockFrom });

      await ensureGuestProfile("xyz789session");

      // Check that insert values was called with correct data
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Khách xyz78", // First 5 chars of session ID
          customerCode: "guest_xyz789session",
        }),
      );
    });

    it("should use customer role for guest profiles", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValue({ from: mockFrom });

      await ensureGuestProfile("newguest");

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "customer",
          isActive: true,
        }),
      );
    });

    it("should generate anon.local email for guest", async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValue({ from: mockFrom });

      await ensureGuestProfile("session123");

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "guest_session123@anon.local",
        }),
      );
    });
  });
});

describe("Guest Service - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle very short session IDs", async () => {
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    (db.select as any).mockReturnValue({ from: mockFrom });

    await ensureGuestProfile("ab");

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Khách ab", // Uses full ID if less than 5 chars
        customerCode: "guest_ab",
      }),
    );
  });

  it("should handle session IDs with special characters", async () => {
    const sessionId = "abc-123_xyz";
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    (db.select as any).mockReturnValue({ from: mockFrom });

    await ensureGuestProfile(sessionId);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        customerCode: `guest_${sessionId}`,
      }),
    );
  });

  it("should hash long guest session IDs to fit customer_code length", async () => {
    const longSessionId = "15c32617-dab6-49d4-9687-e22dfa4b3195";
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn(() => ({ limit: mockLimit }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    (db.select as any).mockReturnValue({ from: mockFrom });

    await ensureGuestProfile(longSessionId);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        customerCode: expect.stringMatching(/^guest_[a-f0-9]{14}$/),
        username: expect.stringMatching(/^guest_[a-f0-9]{14}$/),
      }),
    );
  });
});
