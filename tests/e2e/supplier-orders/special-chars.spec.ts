import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-027
 */
test.describe("Supplier Orders - Special Characters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-027 should handle special characters in product names", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    // Search with special characters
    await page.goto("/supplier-orders");
    await page.waitForTimeout(500);

    // Test search with special characters (should not crash)
    const specialChars = ["<", ">", "&", "'", '"', "%", "*", "?"];

    for (const char of specialChars) {
      await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(char);
      await page.waitForTimeout(200);

      // Page should not crash, either show results or empty state
      const hasTable = await page
        .locator("table")
        .isVisible()
        .catch(() => false);
      const hasEmptyState = await page
        .getByText("Không có đơn đặt hàng nào")
        .isVisible()
        .catch(() => false);

      expect(hasTable || hasEmptyState).toBe(true);
    }
  });
});
