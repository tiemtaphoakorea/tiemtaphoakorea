import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - Search
 * Test cases: TC-EXTRA
 */
test.describe("User - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
  });

  // USER-03: Tìm kiếm nhân viên
  test("TC-EXTRA should search users", async ({ page }) => {
    await page.goto("/users");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill("admin");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("search");
  });
});
