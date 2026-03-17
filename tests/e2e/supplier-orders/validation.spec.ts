import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { createSupplierOrder, getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-017
 */
test.describe("Supplier Orders - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-017 should validate API input and return errors", async ({ page }) => {
    // Test missing variantId
    const missingVariant = await page.request.post("/api/admin/supplier-orders", {
      data: {
        quantity: 1,
      },
    });
    expect(missingVariant.status()).toBe(400);

    // Test missing quantity
    const products = await getProductsWithVariants(page);
    if (products.length > 0) {
      const variant = products.flatMap((p: any) => p.variants || [])[0];
      if (variant?.id) {
        const missingQuantity = await page.request.post("/api/admin/supplier-orders", {
          data: {
            variantId: variant.id,
          },
        });
        expect(missingQuantity.status()).toBe(400);
      }
    }

    // Test invalid status update
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId:
        products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku)?.id ||
        products[0]?.variants?.[0]?.id,
      quantity: 1,
    });

    // Try to update with invalid status
    const invalidStatus = await page.request.patch(
      `/api/admin/supplier-orders/${supplierOrder.id}`,
      {
        data: {
          status: "invalid_status",
        },
      },
    );
    expect(invalidStatus.status()).toBe(500);
  });
});
