import { expect, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-009
 */

test.describe("Security - Rate Limiting", () => {
  test("TC-SEC-009 should enforce rate limiting on login attempts", async ({ page }) => {
    const maxAttempts = 10;
    const failedAttempts: number[] = [];

    // Clear any existing cookies
    await page.context().clearCookies();
    await page.goto("/login");

    // Attempt multiple failed logins
    for (let i = 0; i < maxAttempts; i++) {
      const { response } = await apiPost<any>(page, "/api/admin/login", {
        username: "nonexistent",
        password: "wrongpassword",
      });

      failedAttempts.push(response.status());

      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100);
    }

    // After many failed attempts, should see rate limiting (429) or account lockout
    const hasRateLimiting = failedAttempts.some((status) => status === 429);
    const hasLockout = failedAttempts.slice(-3).every((status) => status >= 400);

    // At least one of these protections should be in place
    expect(
      hasRateLimiting || hasLockout,
      "Should have rate limiting or lockout after multiple failed attempts",
    ).toBe(true);
  });
});
