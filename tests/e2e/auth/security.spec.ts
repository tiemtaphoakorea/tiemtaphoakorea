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
});
