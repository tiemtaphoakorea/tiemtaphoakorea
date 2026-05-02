import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Home
 * Test cases: TC-CATALOG-004
 */
test.describe("Guest Storefront - Home", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  // GUEST-01: Trang chủ hiển thị hero và sản phẩm nổi bật
  test("TC-CATALOG-004 should display home page sections", async ({ page }) => {
    await page.goto("/");

    // Hero h1 "NÂNG TẦM VẺ ĐẸP HÀN" or Featured h2 "Bán chạy nhất" (strict: pick first match)
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /NÂNG TẦM|Bán chạy|sản phẩm|Danh mục/i })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid="featured-products"]')
        .or(page.locator("#featured-products"))
        .or(page.locator("text=Bán chạy nhất"))
        .first(),
    ).toBeVisible();
  });
});
