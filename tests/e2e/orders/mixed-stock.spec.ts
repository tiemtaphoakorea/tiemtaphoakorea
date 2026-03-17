import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  createProductWithVariants,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getOrderDetails,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Mixed Stock Types
 * Test cases: TC-ORD-003
 * Seed E2E only has users; ensure customer + in_stock + preorder products exist.
 */
test.describe("Order - Mixed Stock Types", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
    const products = await getProductsWithVariants(page);
    const hasTestTshirt = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.testTshirt.sku),
    );
    if (!hasTestTshirt) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.testTshirt.name,
        slug: TEST_PRODUCTS.testTshirt.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.testTshirt.sku,
            stockQuantity: 10,
            retailPrice: 100,
            costPrice: 50,
          },
        ],
      });
    }
    const hasPreorder = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.preorder.sku),
    );
    if (!hasPreorder) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.preorder.name,
        slug: TEST_PRODUCTS.preorder.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.preorder.sku,
            stockQuantity: 0,
            retailPrice: 150,
            costPrice: 80,
          },
        ],
      });
    }
  });

  test("TC-ORD-003 should handle order with mixed stock types", async ({ page }) => {
    // Use existing fixtures (in_stock + pre_order) to avoid variant visibility timing issues
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const inStockVariantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const preOrderVariantId = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);
    expect(customer?.id).toBeTruthy();
    expect(inStockVariantId).toBeTruthy();
    expect(preOrderVariantId).toBeTruthy();

    const orderData = await createOrder(page, {
      customerId: customer!.id,
      items: [
        { variantId: inStockVariantId!, quantity: 2 },
        { variantId: preOrderVariantId!, quantity: 1 },
      ],
    });

    expect(orderData.success).toBe(true);

    // Verify order contains both types
    const order = await getOrderDetails(page, orderData.order?.id);
    expect(order.items?.length).toBe(2);
  });
});
