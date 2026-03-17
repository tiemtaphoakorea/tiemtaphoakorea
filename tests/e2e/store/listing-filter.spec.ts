import { expect, test } from "../fixtures/auth";
import { TEST_PRODUCTS } from "../fixtures/data";
import { STOREFRONT_BASE_URL } from "../helpers/api";

test.describe("Storefront - Listing Filter", () => {
  // Use a clean session for shopping flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-STORE-003 should filter products on listing page", async ({ page }) => {
    await page.goto(`${STOREFRONT_BASE_URL}/products`);

    // Verify product list is visible
    await expect(page.getByTestId("product-list")).toBeVisible();

    // Verify we have at least one product before filtering
    const initialCards = page.locator('[data-testid^="product-card-"]');
    await expect(initialCards.first()).toBeVisible();

    // Use search filter to find a specific product
    const searchInput = page.getByPlaceholder("Tìm kiếm trong danh mục...");
    await searchInput.fill(TEST_PRODUCTS.basicTee.name);

    // URL should contain the search query param
    await expect(page).toHaveURL(/\/products\?.*q=Basic(%20|\+)Tee/);

    // At least one product matching the query should be visible
    await expect(page.getByText(TEST_PRODUCTS.basicTee.name).first()).toBeVisible();
  });
});
