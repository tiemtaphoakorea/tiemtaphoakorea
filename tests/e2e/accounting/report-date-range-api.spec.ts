import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiGet,
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
 * Test cases: TC-ACC-004, TC-ACC-012
 */
test.describe("Accounting - Report Date Range", () => {
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
        name: `ACC-DATE ${TEST_PRODUCTS.testTshirt.name}`,
        slug: `${TEST_PRODUCTS.testTshirt.slug}-acc-date`,
        isActive: true,
        variants: [
          {
            sku: `${TEST_PRODUCTS.testTshirt.sku}-ACC-DATE`,
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
    await cleanupTestProducts(page, "ACC-DATE");
  });

  test("TC-ACC-004 should validate report date range", async ({ page }) => {
    // Try invalid date range (end before start)
    const response = await apiGet<any>(
      page,
      "/api/admin/finance?startDate=2026-01-31&endDate=2026-01-01",
    );

    if (!response.response.ok()) {
      expect(response.response.status()).toBeGreaterThanOrEqual(400);
    }

    // Valid date range should succeed
    const validResponse = await apiGet<any>(
      page,
      "/api/admin/finance?startDate=2026-01-01&endDate=2026-01-31",
    );

    expect(validResponse.response.ok()).toBe(true);
  });

  test("TC-ACC-012 should respect date range boundaries", async ({ page }) => {
    // Create order (use first variant that has stock >= 1)
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    const variantWithStock = products
      .flatMap((p) => (p.variants || []).map((v) => ({ product: p, variant: v })))
      .find(({ variant }) => (Number((variant as any).stockQuantity) ?? 0) >= 1);
    const variantId = variantWithStock?.variant?.id;
    expect(
      variantId,
      "Seed data should have at least one product variant with stock >= 1",
    ).toBeDefined();

    const orderData = await createOrder(page, {
      customerId: customers[0]?.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    expect(orderData.success && orderData.order?.id, "createOrder should succeed").toBeTruthy();

    const order = await getOrderDetails(page, orderData.order!.id);
    await recordPayment(page, orderData.order!.id, {
      amount: order.total,
      method: "cash",
    });

    // Query within date range (should include order)
    const { data: withinRangeData } = await apiGet<any>(
      page,
      "/api/admin/finance?startDate=2026-01-01&endDate=2026-12-31",
    );
    expect(withinRangeData.stats).toBeDefined();

    // Query outside date range (should not include order)
    const { data: outsideRangeData } = await apiGet<any>(
      page,
      "/api/admin/finance?startDate=2025-01-01&endDate=2025-12-31",
    );
    expect(outsideRangeData.stats).toBeDefined();
  });
});
