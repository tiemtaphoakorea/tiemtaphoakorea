import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-024
 */
test.describe("Supplier Orders - Past Expected Date", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-024 should handle past expected dates", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Test with past date
    const pastDate = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
      expectedDate: pastDate,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Order should still be created (validation might allow or reject past dates)
    const orderDetails = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(orderDetails).toBeTruthy();
  });
});
