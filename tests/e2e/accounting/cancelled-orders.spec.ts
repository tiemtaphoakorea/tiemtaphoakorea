import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getFinanceSummary,
  getProductsWithVariants,
  updateOrderStatus,
} from "../helpers/api";

/**
 * F06: Simple Accounting Tests
 * Test cases: TC-ACC-011
 */
test.describe("Accounting - Cancelled Orders", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Ensure customer exists
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
    // Ensure preorder product exists (create test-scoped product if needed)
    const products = await getProductsWithVariants(page);
    const hasPreorder = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.preorder.sku),
    );
    if (!hasPreorder) {
      await createProductWithVariants(page, {
        name: `ACC-CANCEL ${TEST_PRODUCTS.preorder.name}`,
        slug: `${TEST_PRODUCTS.preorder.slug}-acc-cancel`,
        isActive: true,
        variants: [
          {
            // Keep SKU consistent so findVariantIdBySku(TEST_PRODUCTS.preorder.sku) works
            sku: TEST_PRODUCTS.preorder.sku,
            stockQuantity: 0,
            retailPrice: 150,
            costPrice: 80,
          },
        ],
      });
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up products created specifically for this spec
    await cleanupTestProducts(page, "ACC-CANCEL");
  });

  test("TC-ACC-011 should exclude cancelled orders", async ({ page }) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const statsBefore = await getFinanceSummary(page, { month, year });

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);
    const order = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 20 }],
    });
    const cancelledTotal = Number(order.order.total || 0);
    await updateOrderStatus(page, order.order.id, "cancelled");

    const statsAfter = await getFinanceSummary(page, { month, year });

    const revenueDelta = statsAfter.revenue - statsBefore.revenue;
    expect(revenueDelta).toBeLessThan(cancelledTotal);
  });
});
