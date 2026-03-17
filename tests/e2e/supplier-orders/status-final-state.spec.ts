import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-005
 */
test.describe("Supplier Orders - Final State Rules", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-005 should block status change from final states (received/cancelled)", async ({
    page,
  }) => {
    // Create and receive a supplier order
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Test 1: Cannot change from received to other status
    const receivedOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(receivedOrder.supplierOrder?.id).toBeTruthy();

    // Change to received via API
    await updateSupplierOrderStatus(page, receivedOrder.supplierOrder.id, "received");

    // Try to change from received to pending via API - should fail
    const updateFromReceived = await updateSupplierOrderStatus(
      page,
      receivedOrder.supplierOrder.id,
      "pending",
    );
    expect(updateFromReceived.status()).toBe(500);

    // Test 2: Cannot change from cancelled to other status
    const cancelledOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(cancelledOrder.supplierOrder?.id).toBeTruthy();

    // Change to cancelled via API
    await updateSupplierOrderStatus(page, cancelledOrder.supplierOrder.id, "cancelled");

    // Try to change from cancelled to pending via API - should fail
    const updateFromCancelled = await updateSupplierOrderStatus(
      page,
      cancelledOrder.supplierOrder.id,
      "pending",
    );
    expect(updateFromCancelled.status()).toBe(500);
  });
});
