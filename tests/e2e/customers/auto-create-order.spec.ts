import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  cleanupTestProducts,
  createProductWithVariants,
  getCustomerByPhone,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Customer - Auto-Create from Order
 * Test cases: TC-CUST-008
 */
test.describe("Customer - Auto-Create from Order", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-ORDER-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);

    // Ensure there is at least one product with an in-stock variant for this test
    const products = await getProductsWithVariants(page);
    const hasInStockVariant = products.some((p: any) =>
      p?.variants.some((v: any) => (v.stockQuantity || 0) > 0),
    );

    if (!hasInStockVariant) {
      const productName = `CUST-008 Auto Customer ${TEST_PRODUCTS.basicTee.name}`;
      await createProductWithVariants(page, {
        name: productName,
        slug: `${TEST_PRODUCTS.basicTee.slug}-cust-008-${runId}`,
        isActive: true,
        variants: [
          {
            sku: `${TEST_PRODUCTS.basicTee.skuInStock}-cust-008-${runId}`,
            stockQuantity: 5,
            retailPrice: 100,
            costPrice: 50,
          },
        ],
      });
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up any products created for this test (matched by name pattern)
    await cleanupTestProducts(page, "CUST-008 Auto Customer");
  });

  test("TC-CUST-008 should auto-create customer from order", async ({ page }) => {
    const uniquePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;

    // Create order with new customer info
    const products = await getProductsWithVariants(page);

    // Find a product with variants that have stock
    const productWithStock = products.find(
      (p: any) =>
        p.variants &&
        p.variants.length > 0 &&
        p.variants.some(
          (v: any) =>
            (v.stockType === "in_stock" || v.stockType == null) && (v.stockQuantity || 0) > 0,
        ),
    );

    if (!productWithStock) {
      throw new Error("No products with in-stock variants available for test");
    }

    const variantWithStock = productWithStock.variants.find(
      (v: any) => (v.stockType === "in_stock" || v.stockType == null) && (v.stockQuantity || 0) > 0,
    );

    const orderResponse = await apiPost<any>(page, "/api/admin/orders", {
      customerPhone: uniquePhone,
      customerName: "Auto-Created Customer",
      items: [{ variantId: variantWithStock.id, quantity: 1 }],
    });

    expect(orderResponse.response.ok()).toBe(true);
    const orderData = orderResponse.data;

    // Verify customer was auto-created
    const customer = await getCustomerByPhone(page, uniquePhone);
    expect(customer).toBeDefined();
    expect(customer.phone).toBe(uniquePhone);

    // Verify customer code is generated (should start with KH)
    expect(customer.customerCode).toBeTruthy();
    expect(customer.customerCode).toMatch(/^KH/);

    // Verify order links to the newly created customer
    expect(orderData.order.customerId).toBe(customer.id);
  });
});
