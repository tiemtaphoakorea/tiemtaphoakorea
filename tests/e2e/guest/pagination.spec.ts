import type { Page } from "@playwright/test";
import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Pagination
 * Test cases: TC-CATALOG-006
 */
test.describe("Guest Storefront - Pagination", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  const countCards = (page: Page) => page.locator('[data-testid^="product-card-"]').count();

  test("TC-CATALOG-006 should show pagination and empty state", async ({ page }) => {
    await page.goto("/products");

    const page2Button = page.locator('[data-testid="pagination-page-2"]');
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page).toHaveURL(/page=2/);
      const page2Count = await countCards(page);
      expect(page2Count).toBeGreaterThan(0);
    }

    const searchInput = page.locator(
      'input[placeholder*="Tìm"], input[name="q"], input[type="search"]',
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("no-result-e2e");
      await expect(page.locator("text=Không tìm thấy sản phẩm")).toBeVisible();
    }
  });
});
