import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  createProductWithVariants,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Totals
 * Test cases: TC-ORD-025
 * Seed E2E only has users; ensure customer + basicTee + testTshirt products exist.
 */
test.describe("Order - Totals", () => {
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
    const hasBasicTee = products.some((p: any) =>
      p.variants?.some(
        (v: any) =>
          v.sku === TEST_PRODUCTS.basicTee.skuInStock ||
          v.sku === TEST_PRODUCTS.basicTee.skuOutOfStock,
      ),
    );
    if (!hasBasicTee) {
      await createProductWithVariants(page, {
        name: TEST_PRODUCTS.basicTee.name,
        slug: TEST_PRODUCTS.basicTee.slug,
        isActive: true,
        variants: [
          {
            sku: TEST_PRODUCTS.basicTee.skuInStock,
            stockQuantity: 5,
            retailPrice: 80,
            costPrice: 40,
          },
          {
            sku: TEST_PRODUCTS.basicTee.skuOutOfStock,
            stockQuantity: 0,
            retailPrice: 80,
            costPrice: 40,
          },
        ],
      });
    }
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
  });

  test("TC-ORD-025 should recalculate order total with multiple items", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const products = await getProductsWithVariants(page);
    const first = products
      .flatMap((p) => p.variants || [])
      .find((v) => v.sku === TEST_PRODUCTS.basicTee.skuInStock);
    const second = products
      .flatMap((p) => p.variants || [])
      .find((v) => v.sku === TEST_PRODUCTS.testTshirt.sku);
    expect(first?.id).toBeTruthy();
    expect(second?.id).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [
        { variantId: first.id, quantity: 1 },
        { variantId: second.id, quantity: 2 },
      ],
    });

    const expectedTotal = Number(first.price) * 1 + Number(second.price) * 2;
    expect(Number(result.order.total)).toBe(expectedTotal);
  });
});
