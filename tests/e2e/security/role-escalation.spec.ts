import { expect, loginAsStaff, test } from "../fixtures/auth";
import { apiGet, apiPut } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-002
 */

test.describe("Security - Role Escalation", () => {
  test("TC-SEC-002 should block role escalation attempts from staff", async ({ page }) => {
    await loginAsStaff(page);

    // Attempt to update own role to admin/owner
    const staffProfile = await apiGet<any>(page, "/api/admin/profile");
    const staffUserId = staffProfile.data?.user?.id;

    if (staffUserId) {
      // Try to escalate own role
      const escalateOwnRole = await apiPut<any>(page, `/api/admin/users/${staffUserId}`, {
        role: "admin",
      });
      expect(escalateOwnRole.response.status()).toBeGreaterThanOrEqual(401);
      expect(escalateOwnRole.response.status()).toBeLessThanOrEqual(403);

      // Try to update another user's role
      const updateOtherRole = await apiPut<any>(page, "/api/admin/users/other-user-id", {
        role: "owner",
      });
      expect(updateOtherRole.response.status()).toBeGreaterThanOrEqual(401);
      expect(updateOtherRole.response.status()).toBeLessThanOrEqual(403);
    }

    // Verify staff cannot access user management APIs
    const { response: usersResponse } = await apiGet<any>(page, "/api/admin/users");
    expect(usersResponse.status()).toBeGreaterThanOrEqual(401);
    expect(usersResponse.status()).toBeLessThanOrEqual(403);
  });
});
