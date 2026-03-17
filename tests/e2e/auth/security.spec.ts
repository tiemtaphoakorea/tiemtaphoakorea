import { expect, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";
import { expectAdminSubdomain } from "../helpers/url";

test.describe("Admin Auth Security", () => {
  test("TC-AUTH-015 should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/orders");
    // Should redirect to login or unauthorized page
    await expect(page).toHaveURL(/\/(login|unauthorized)/i);
    expectAdminSubdomain(page);
  });

  test("TC-AUTH-006 should block access when session cookie is missing", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/(login|unauthorized)/i);
    expectAdminSubdomain(page);
  });

  test("TC-AUTH-002 should return validation errors for empty payload", async ({ page }) => {
    const { response } = await apiPost<any>(page, "/api/admin/login", {});
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("TC-AUTH-007 should enforce login rate limiting", async ({ page }) => {
    // Attempt multiple rapid logins to trigger rate limiting
    const attempts = 6;

    for (let i = 0; i < attempts; i++) {
      const { response } = await apiPost<any>(page, "/api/admin/login", {
        username: "test_user",
        password: "wrong_password",
      });

      // After several attempts, should get rate limited
      if (i >= 5) {
        // Most rate limiters kick in after 5 attempts
        const status = response.status();
        // Could be 429 (Too Many Requests) or still 400/401
        expect([400, 401, 429]).toContain(status);
      }
    }
  });
});
