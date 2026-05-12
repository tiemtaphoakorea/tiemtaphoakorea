import { describe, expect, it, vi } from "vitest";

const { getInternalUser } = vi.hoisted(() => ({
  getInternalUser: vi.fn(),
}));

vi.mock("@workspace/database/lib/auth", () => ({
  getInternalUser,
}));

describe("AdminLoginPage", () => {
  it("redirects authenticated users to the dashboard", async () => {
    getInternalUser.mockResolvedValueOnce({
      user: { id: "owner-id", username: "admin", role: "owner" },
      profile: { id: "owner-id", role: "owner", isActive: true },
    });

    const { default: AdminLoginPage } = await import("../../../apps/admin/app/(public)/login/page");

    await expect(AdminLoginPage()).rejects.toMatchObject({
      digest: expect.stringContaining(";replace;/;"),
    });
  });
});
