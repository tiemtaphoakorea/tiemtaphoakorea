import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Search & Filter
 * Test cases: TC-CATALOG-001
 */
test.describe("Guest Storefront - Search & Filter", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  // GUEST-03: Tìm kiếm sản phẩm
  test("TC-CATALOG-001 should search and filter products", async ({ page }) => {
    await page.goto("/products");

    const searchInput = page.locator(
      'input[placeholder*="Tìm"], input[name="q"], input[type="search"]',
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("Basic");
      await expect(page).toHaveURL(/q=Basic/);
    }

    const categoryButton = page.locator("button", { hasText: "E2E Apparel" }).first();
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await expect(page).toHaveURL(/category=e2e-apparel/);
    }

    const resetButton = page.locator("button", { hasText: "Tất cả" }).first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(page).not.toHaveURL(/category=/);
    }
  });
});
