import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-021
 */
test.describe("Supplier Orders - Invalid Variant", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-021 should reject invalid variantId", async ({ page }) => {
    // Try to create order with non-existent variantId
    const invalidVariantResponse = await page.request.post("/api/admin/supplier-orders", {
      data: {
        variantId: "00000000-0000-0000-0000-000000000000",
        quantity: 1,
      },
    });

    // Should fail with 500 or 400 error
    expect(invalidVariantResponse.status()).toBeGreaterThanOrEqual(400);
  });
});
