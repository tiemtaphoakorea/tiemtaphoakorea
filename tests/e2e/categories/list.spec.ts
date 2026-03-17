import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F07: Category Management Tests
 * Test cases: CAT-01
 */
test.describe("Category Management - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // CAT-01: Xem danh sách danh mục
  test("TC-PROD-014 should display category list", async ({ page }) => {
    await page.goto("/categories");

    await expect(page.locator("h1, h2").filter({ hasText: /danh mục|category/i })).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="category-list"]')),
    ).toBeVisible();
  });
});
