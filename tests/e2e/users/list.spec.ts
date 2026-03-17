import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - List
 * Test cases: TC-EXTRA
 */
test.describe("User - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
  });

  // USER-01: Xem danh sách nhân viên
  test("TC-EXTRA should display user list", async ({ page }) => {
    await page.goto("/users");

    await expect(page.locator("h1, h2").filter({ hasText: /nhân viên|user/i })).toBeVisible();
    await expect(page.locator("table").or(page.locator('[data-testid="user-list"]'))).toBeVisible();
  });
});
