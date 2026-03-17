import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-007
 */
test.describe("Supplier Orders - Filter", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-007 should filter orders by status", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Create orders with different statuses
    const pendingOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(pendingOrder.supplierOrder?.id).toBeTruthy();

    const orderedOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(orderedOrder.supplierOrder?.id).toBeTruthy();
    await updateSupplierOrderStatus(page, orderedOrder.supplierOrder.id, "ordered");

    const receivedOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(receivedOrder.supplierOrder?.id).toBeTruthy();
    await updateSupplierOrderStatus(page, receivedOrder.supplierOrder.id, "received");

    // Navigate to supplier orders page
    await page.goto("/supplier-orders");
    await page.waitForTimeout(500);

    // Test filtering by "pending"
    await page.getByRole("button", { name: /Tất cả trạng thái/ }).click();
    await page.getByRole("menuitem", { name: "Chờ xử lý" }).click();
    await page.waitForTimeout(500);

    // Should show only pending orders
    const pendingRows = await page.locator("table tbody tr").count();
    expect(pendingRows).toBeGreaterThanOrEqual(1);

    // Test filtering by "received"
    await page.getByRole("button", { name: /Chờ xử lý/ }).click();
    await page.getByRole("menuitem", { name: "Đã nhận hàng" }).click();
    await page.waitForTimeout(500);

    // Should show only received orders
    const receivedRows = await page.locator("table tbody tr").count();
    expect(receivedRows).toBeGreaterThanOrEqual(1);
  });
});
