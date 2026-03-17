import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  getCustomers,
  getOrderDetails,
  getProductsWithVariants,
  recordPayment,
} from "../helpers/api";

/**
 * Advanced Accounting Tests
 * Test cases: TC-ACC-009
 */
test.describe("Accounting - Profit Margin", () => {
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
    // Ensure product with stock exists (create test-scoped product if needed)
    const products = await getProductsWithVariants(page);
    const hasProduct = products.some((p: any) =>
      p.variants?.some((v: any) => (Number((v as any).stockQuantity) ?? 0) >= 1),
    );
    if (!hasProduct) {
      await createProductWithVariants(page, {
        name: `ACC-PROFIT ${TEST_PRODUCTS.testTshirt.name}`,
        slug: `${TEST_PRODUCTS.testTshirt.slug}-acc-profit`,
        isActive: true,
        variants: [
          {
            sku: `${TEST_PRODUCTS.testTshirt.sku}-ACC-PROFIT`,
            stockQuantity: 10,
            retailPrice: 100,
            costPrice: 50,
          },
        ],
      });
    }
  });

  test.afterEach(async ({ page }) => {
    // Clean up products created specifically for this spec
    await cleanupTestProducts(page, "ACC-PROFIT");
  });

  test("TC-ACC-009 should calculate profit margin correctly", async ({ page }) => {
    // Use existing product/variant from seed (avoids flaky variant creation API)
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    const variantWithStock = products
      .flatMap((p) => (p.variants || []).map((v) => ({ product: p, variant: v })))
      .find(({ variant }) => (Number((variant as any).stockQuantity) ?? 0) >= 1);
    const variant = variantWithStock?.variant as
      | { id: string; price: string; costPrice?: string | null }
      | undefined;
    expect(variant?.id, "Seed should have at least one variant with stock >= 1").toBeDefined();

    const price = Number(variant!.price || 0);
    const cost = Number(variant!.costPrice ?? 0);
    const expectedMargin = price > 0 ? ((price - cost) / price) * 100 : 0;

    const orderData = await createOrder(page, {
      customerId: customers[0]?.id,
      items: [{ variantId: variant!.id, quantity: 1 }],
    });

    expect(orderData.success && orderData.order?.id, "createOrder should succeed").toBeTruthy();

    const order = await getOrderDetails(page, orderData.order!.id);
    await recordPayment(page, orderData.order!.id, {
      amount: order.total,
      method: "cash",
    });

    // Verify profit margin on the order (order-level margin)
    const orderMargin =
      Number(order.total) > 0 ? (Number(order.profit) / Number(order.total)) * 100 : 0;
    expect(orderMargin).toBeCloseTo(expectedMargin, 1);

    // Finance page should load and show P&L section
    await page.goto("/finance");
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="profit-margin"]')).toBeVisible();
  });
});
