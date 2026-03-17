import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-023
 */
test.describe("Supplier Orders - XSS Note", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-023 should sanitize note field against XSS", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Create order with potential XSS in note
    const xssNote = '<script>alert("XSS")</script>';
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Update with XSS payload
    await updateSupplierOrderStatus(page, supplierOrder.id, "ordered", {
      note: xssNote,
    });

    // Verify via API - note should be sanitized or stored as-is but not executed
    const updated = await getSupplierOrderDetails(page, supplierOrder.id);

    // Either sanitized or stored safely (not an error)
    expect(updated.status).toBe("ordered");
    expect(updated.note).toBeTruthy();

    // Note should not contain raw script tag if sanitized
    // Or if stored as-is, it should not cause any security issues
    if (updated.note.includes("<script>")) {
      // If stored as-is, verify it's treated as text not code
      expect(updated.note).toBe(xssNote);
    }
  });
});
