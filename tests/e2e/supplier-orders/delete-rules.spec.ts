import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  deleteSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-006
 */
test.describe("Supplier Orders - Delete Rules", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-006 should allow delete only for pending and cancelled orders", async ({
    page,
  }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Test 1: Cannot delete pending order (Must be cancelled first)
    const pendingOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(pendingOrder.supplierOrder?.id).toBeTruthy();

    const deletePending = await deleteSupplierOrder(page, pendingOrder.supplierOrder.id);
    expect(deletePending.status()).toBe(500);

    // Verify order still exists
    const fetchedPending = await getSupplierOrderDetails(page, pendingOrder.supplierOrder.id);
    expect(fetchedPending).not.toBeNull();
    expect(fetchedPending.id).toBe(pendingOrder.supplierOrder.id);

    // Test 2: Cannot delete ordered order
    const orderedOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(orderedOrder.supplierOrder?.id).toBeTruthy();

    await updateSupplierOrderStatus(page, orderedOrder.supplierOrder.id, "ordered");

    const deleteOrdered = await deleteSupplierOrder(page, orderedOrder.supplierOrder.id);
    expect(deleteOrdered.status()).toBe(500);

    // Test 3: Cannot delete received order
    const receivedOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(receivedOrder.supplierOrder?.id).toBeTruthy();

    await updateSupplierOrderStatus(page, receivedOrder.supplierOrder.id, "received");

    const deleteReceived = await deleteSupplierOrder(page, receivedOrder.supplierOrder.id);
    expect(deleteReceived.status()).toBe(500);

    // Test 4: Can delete cancelled order
    const cancelledOrder = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });
    expect(cancelledOrder.supplierOrder?.id).toBeTruthy();

    await updateSupplierOrderStatus(page, cancelledOrder.supplierOrder.id, "cancelled");

    const deleteCancelled = await deleteSupplierOrder(page, cancelledOrder.supplierOrder.id);
    expect(deleteCancelled.status()).toBe(200);
  });
});
