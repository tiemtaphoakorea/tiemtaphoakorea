import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, getCustomers, getProductsWithVariants } from "../helpers/api";

/**
 * Order - Validation
 * Test cases: TC-ORD-002, TC-ORD-026
 */
test.describe("Order - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-002 should show validation errors for order creation", async ({ page }) => {
    // Try to create order without customer
    const products = await getProductsWithVariants(page);
    const response1 = await apiPost<any>(page, "/api/admin/orders", {
      items: [{ variantId: products[0]?.variants?.[0]?.id, quantity: 1 }],
      // customerId missing
    });

    expect(response1.response.ok()).toBe(false);

    // Try to create order without items
    const customers = await getCustomers(page);
    const response2 = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customers[0]?.id,
      // items missing
    });

    expect(response2.response.ok()).toBe(false);

    // Try to create order with invalid quantity
    const response3 = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customers[0]?.id,
      items: [{ variantId: products[0]?.variants?.[0]?.id, quantity: 0 }],
    });

    expect(response3.response.ok()).toBe(false);
  });

  test("TC-ORD-026 should reject zero items order", async ({ page }) => {
    const customers = await getCustomers(page);
    const { response } = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customers[0]?.id,
      items: [],
    });
    expect(response.status()).toBe(400);
  });
});
