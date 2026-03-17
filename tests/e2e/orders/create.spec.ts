import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  createProductWithVariants,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Create
 * Test cases: TC-ORD-001, TC-ORD-011
 * Seed E2E only has users; ensure customer + product exist before tests.
 */
test.describe("Order - Create", () => {
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
    const hasProduct = products.some((p: any) =>
      p.variants?.some((v: any) => v.sku === TEST_PRODUCTS.testTshirt.sku),
    );
    if (!hasProduct) {
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

  test("TC-ORD-001 should create order with in_stock items", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result.success).toBe(true);

    await page.goto("/orders");
    await page.fill('input[placeholder*="Tìm mã đơn hàng"]', result.order.orderNumber);
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${result.order.orderNumber}`)).toBeVisible();
  });

  test("TC-ORD-011 should generate order number format", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    // Format: ORD-YYYYMMDD-XXXXXX (6 random uppercase letters/digits)
    expect(result.order.orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{6}$/);
  });
});
