import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-028
 */
test.describe("Supplier Orders - Rapid Status", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-028 should maintain data consistency on rapid status changes", async ({
    page,
  }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Rapid status changes
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered");
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered"); // Duplicate
    await updateSupplierOrderStatus(page, supplierOrder.id, "received");

    // Verify final state is correct
    const finalState = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(finalState.status).toBe("received");
    expect(finalState.orderedAt).toBeTruthy();
    expect(finalState.receivedAt).toBeTruthy();
  });
});
