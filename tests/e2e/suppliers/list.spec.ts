import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Supplier - List
 * Test cases: TC-SUP-001
 */
test.describe("Supplier - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // SUP-01: Xem danh sách nhà cung cấp
  test("TC-SUP-001 should display supplier list", async ({ page }) => {
    await page.goto("/suppliers");

    await expect(
      page.locator("h1, h2").filter({ hasText: /nhà cung cấp|supplier/i }),
    ).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="supplier-list"]')),
    ).toBeVisible();
  });
});
