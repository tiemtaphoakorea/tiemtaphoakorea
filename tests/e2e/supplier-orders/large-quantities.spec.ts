import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-026
 */
test.describe("Supplier Orders - Large Quantities", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-026 should handle very large quantities", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const initialStock = Number(variant.stockQuantity || 0);
    const largeQuantity = 10000;

    // Create order with large quantity
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: largeQuantity,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Receive the order
    await updateSupplierOrderStatus(page, supplierOrder.id, "received");

    // Verify stock increased by large amount
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === variant.id);

    expect(Number(variantAfter?.stockQuantity || 0)).toBe(initialStock + largeQuantity);
  });
});
