import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-022
 */
test.describe("Supplier Orders - Quantity Constraints", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-022 should validate quantity constraints", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    // Test zero quantity
    const zeroQuantity = await page.request.post("/api/admin/supplier-orders", {
      data: {
        variantId: variant.id,
        quantity: 0,
      },
    });
    expect(zeroQuantity.status()).toBe(400);

    // Test negative quantity
    const negativeQuantity = await page.request.post("/api/admin/supplier-orders", {
      data: {
        variantId: variant.id,
        quantity: -5,
      },
    });
    expect(negativeQuantity.status()).toBe(400);
  });
});
