import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, test } from "../fixtures/auth";

test.describe("Storefront - Homepage", () => {
  // Use a clean session for shopping flow
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-STORE-001 should display featured products on homepage", async ({ page }) => {
    await page.goto(STOREFRONT_BASE_URL);
    await expect(page).toHaveTitle(/Store|Shop|K-SMART/i);

    // Check for featured products section
    await expect(page.getByRole("heading", { name: /Featured|Sản phẩm nổi bật/i })).toBeVisible();

    // Check if at least one product is visible
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });
});
