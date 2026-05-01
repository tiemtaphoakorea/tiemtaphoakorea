import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, test } from "../fixtures/auth";

/**
 * Guest Storefront - Stock Labels
 * Test cases: TC-CATALOG-003
 */
test.describe("Guest Storefront - Stock Labels", () => {
  test.use({ baseURL: STOREFRONT_BASE_URL });

  test("TC-CATALOG-003 should show correct stock labels", async ({ page }) => {
    await page.goto("/products/basic-tee");
    const stockLabel = page.locator('[data-testid="stock-status-label"]').first();
    await expect(stockLabel).toBeVisible();
    await expect(stockLabel).toHaveText(/Sẵn sàng giao|Tạm hết hàng/i);

    const blueVariant = page.locator("button", { hasText: "Basic Tee - Blue" }).first();
    if (await blueVariant.isVisible()) {
      await blueVariant.click();
      await expect(stockLabel).toHaveText(/Tạm hết hàng/i);
    }

    await page.goto("/products/preorder-tee");
    const preorderLabel = page.locator('[data-testid="stock-status-label"]').first();
    await expect(preorderLabel).toBeVisible();
    await expect(preorderLabel).toHaveText(/Đặt hàng \(7-10 ngày\)/i);
  });
});
