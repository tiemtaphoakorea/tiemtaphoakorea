import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Supplier - Search
 * Test cases: TC-SUP-004
 */
test.describe("Supplier - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // SUP-03: Tìm kiếm nhà cung cấp
  test("TC-SUP-004 should search suppliers", async ({ page }) => {
    await page.goto("/suppliers");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill("NCC");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("search");
  });
});
