import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { createSupplierOrder, getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-010
 */
test.describe("Supplier Orders - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-010 should search orders by SKU and product name", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Create a supplier order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Navigate to supplier orders page
    await page.goto("/supplier-orders");
    await page.waitForTimeout(500);

    // Test search by SKU
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(String(variant.sku));
    await page.waitForTimeout(500);

    // Should find the order
    const rowsBySku = await page.locator("table tbody tr").count();
    expect(rowsBySku).toBeGreaterThanOrEqual(1);

    // Clear search
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill("");
    await page.waitForTimeout(500);

    // Test search by product name (if product name exists)
    const productName = supplierOrder?.item?.productName || variant.name;
    if (productName) {
      await page
        .getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...")
        .fill(String(productName).substring(0, 10));
      await page.waitForTimeout(500);

      const rowsByName = await page.locator("table tbody tr").count();
      expect(rowsByName).toBeGreaterThanOrEqual(1);
    }

    // Test search with non-existent term
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill("XYZ-NONEXISTENT-999");
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.getByText("Không có đơn đặt hàng nào")).toBeVisible();
  });
});
