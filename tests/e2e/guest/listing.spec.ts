import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Listing
 * Test cases: TC-CATALOG-001
 */
test.describe("Guest Storefront - Listing", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  // GUEST-02: Xem danh sách sản phẩm
  test("TC-CATALOG-001 should display product listing", async ({ page }) => {
    await page.goto("/products");

    await expect(page.locator("h1, h2").filter({ hasText: /sản phẩm|products/i })).toBeVisible();
    await expect(
      page.locator('[data-testid="product-list"]').or(page.locator("article").first()),
    ).toBeVisible();
  });
});
