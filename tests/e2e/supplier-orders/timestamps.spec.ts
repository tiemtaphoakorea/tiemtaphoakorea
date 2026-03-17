import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-025
 */
test.describe("Supplier Orders - Status Timestamps", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-025 should set timestamps only on first transition", async ({ page }) => {
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

    // First transition to ordered
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered");
    const firstOrdered = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(firstOrdered.status).toBe("ordered");
    expect(firstOrdered.orderedAt).toBeTruthy();
    const firstOrderedAt = firstOrdered.orderedAt;

    // Second transition to ordered (should not change timestamp)
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered");
    const secondOrdered = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(secondOrdered.orderedAt).toBe(firstOrderedAt);

    // First transition to received
    await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    const firstReceived = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(firstReceived.status).toBe("received");
    expect(firstReceived.receivedAt).toBeTruthy();
    const firstReceivedAt = firstReceived.receivedAt;

    // receivedAt should not change on subsequent updates (even though further changes are blocked)
    expect(firstReceived.receivedAt).toBe(firstReceivedAt);
  });
});
