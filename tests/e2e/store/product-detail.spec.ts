import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, test } from "../fixtures/auth";
import { TEST_PRODUCTS } from "../fixtures/data";

test.describe("Storefront - Product Detail", () => {
  // Use a clean session for shopping flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-STORE-002 should view product details", async ({ page }) => {
    await page.goto(STOREFRONT_BASE_URL);

    // Click on the basic tee product
    // Assuming we have a product card with a link
    const productCard = page
      .getByTestId("product-card")
      .filter({ hasText: TEST_PRODUCTS.basicTee.name })
      .first();

    // Fallback if specific product not found, take the first one
    if (await productCard.isVisible()) {
      await productCard.click();
    } else {
      await page.getByTestId("product-card").first().click();
    }

    // Verify product detail page loads with heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Verify price is displayed
    await expect(page.getByTestId("product-price")).toBeVisible();

    // Verify stock status is displayed
    await expect(page.getByTestId("stock-status-label")).toBeVisible();

    // Verify contact order button exists
    await expect(
      page.getByRole("button", { name: /Liên hệ đặt hàng ngay|Hết hàng/i }),
    ).toBeVisible();
  });
});
