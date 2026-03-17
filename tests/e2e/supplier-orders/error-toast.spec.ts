import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  deleteSupplierOrder,
  getProductsWithVariants,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-020
 */
test.describe("Supplier Orders - Error Toast", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-020 should show error toast on failed operations", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Create and receive an order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // First change to ordered
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered");

    // Navigate to UI
    await page.goto("/supplier-orders");
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(String(variant.sku));
    await page.waitForTimeout(500);

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible();

    // Try to delete ordered order via UI actions (if delete action exists)
    await row.getByRole("button").last().click();

    // Check if there's a delete option
    const deleteMenuItem = page.getByRole("menuitem", { name: "Xóa" });
    if (await deleteMenuItem.isVisible().catch(() => false)) {
      await deleteMenuItem.click();

      // Should show error toast
      await expect(page.getByText("Lỗi").or(page.getByText("Cannot delete"))).toBeVisible();
    } else {
      // Close menu and verify via API that delete fails
      await page.keyboard.press("Escape");

      // Delete via API should fail
      const deleteResponse = await deleteSupplierOrder(page, supplierOrder.id);
      expect(deleteResponse.status()).toBe(500);
    }
  });
});
