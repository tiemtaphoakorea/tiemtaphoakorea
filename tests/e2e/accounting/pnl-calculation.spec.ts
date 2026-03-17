import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiGet,
  apiPost,
  cleanupTestProducts,
  createExpense,
  createOrder,
  createProductWithVariants,
  getCustomers,
  getOrderDetails,
  getProductsWithVariants,
  recordPayment,
} from "../helpers/api";

/**
 * Advanced Accounting Tests
 * Test cases: TC-ACC-001
 */
test.describe("Accounting - Expense Entry & P&L", () => {
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
        name: `ACC-PNL ${TEST_PRODUCTS.testTshirt.name}`,
        slug: `${TEST_PRODUCTS.testTshirt.slug}-acc-pnl`,
        isActive: true,
        variants: [
          {
            sku: `${TEST_PRODUCTS.testTshirt.sku}-ACC-PNL`,
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
    await cleanupTestProducts(page, "ACC-PNL");
  });

  test("TC-ACC-001 should calculate P&L correctly with expenses", async ({ page }) => {
    // Get initial stats
    const { data: initialStats } = await apiGet<any>(page, "/api/admin/finance?month=1&year=2026");

    // Create expense
    const expenseAmount = 500000;
    const expenseData = await createExpense(page, {
      description: "Test Expense",
      amount: expenseAmount,
      type: "fixed",
      date: "2026-01-15",
    });

    expect(expenseData.success).toBe(true);

    // Create and pay for an order (use first variant with stock >= 1)
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    const variantWithStock = products
      .flatMap((p) => (p.variants || []).map((v) => ({ variant: v })))
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

    const order = await getOrderDetails(page, orderData.order?.id);
    await recordPayment(page, orderData.order?.id, {
      amount: order.total,
      method: "cash",
    });

    // Get updated stats
    const { data: updatedStats } = await apiGet<any>(page, "/api/admin/finance?month=1&year=2026");

    // Verify P&L calculation includes expense (API returns: revenue, cogs, expenses, netProfit)
    expect(updatedStats.stats.expenses).toBeGreaterThan(initialStats.stats?.expenses ?? 0);
    expect(updatedStats.stats.netProfit).toBe(
      updatedStats.stats.revenue - updatedStats.stats.cogs - updatedStats.stats.expenses,
    );
  });
});
