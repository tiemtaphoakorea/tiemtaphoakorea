import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F07: Category Management Tests
 * Test cases: CAT-03
 */
test.describe("Category Management - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // CAT-03: Tìm kiếm danh mục
  test("TC-PROD-014 should search categories", async ({ page }) => {
    await page.goto("/categories");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[placeholder*="tìm"]');
    await searchInput.fill("E2E");

    // Wait for URL to update with search parameter
    await page.waitForURL(/.*search=E2E.*/, { timeout: 5000 });
    expect(page.url()).toContain("search=E2E");
  });
});
