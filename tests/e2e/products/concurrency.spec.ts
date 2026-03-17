import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiPost,
  apiPut,
  cleanupTestProducts,
  createOrder,
  createProductWithVariants,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

test.describe("Product Concurrency", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CONC-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-021: should handle concurrent stock updates from two sessions", async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsAdmin(page1);
    await loginAsAdmin(page2);

    const product = await createProductWithVariants(page1, {
      name: `Concurrent ${runId}`,
      variants: [{ sku: `CONC-${runId}`, stockQuantity: 100, price: 100 }],
    });

    const productId = product.product.id;
    const variantId = product.product.variants[0].id;

    const [res1, res2] = await Promise.all([
      apiPut(page1, `/api/admin/products/${productId}`, {
        name: product.product.name,
        variants: [{ id: variantId, stockQuantity: 80 }],
      }),
      apiPut(page2, `/api/admin/products/${productId}`, {
        name: product.product.name,
        variants: [{ id: variantId, stockQuantity: 90 }],
      }),
    ]);

    expect(res1.response.ok() || res2.response.ok()).toBe(true);

    const products = await getProductsWithVariants(page1);
    const finalVariant = products
      .find((p: any) => p.id === productId)
      ?.variants?.find((v: any) => v.id === variantId);
    expect([80, 90]).toContain(finalVariant?.stockQuantity);

    await context1.close();
    await context2.close();
  });

  test("TC-PROD-020: should handle concurrent stock update vs order creation", async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsAdmin(page1);
    await loginAsAdmin(page2);

    // Create product with stock
    const result = await apiPost<any>(page1, "/api/admin/products", {
      name: `Concurrent Update ${runId}`,
      categoryId: null,
      variants: [
        {
          sku: `CU-${runId}`,
          name: "Black",
          stockType: "in_stock",
          stockQuantity: 10,
          price: 100,
          costPrice: 50,
        },
      ],
    });

    const variantId = result.data.product?.variants?.[0]?.id;
    const productId = result.data.product?.id;

    const customers = await getCustomers(page1);
    const customerId = customers[0]?.id;
    expect(customerId).toBeDefined();

    // Session 1: Update stock
    // Session 2: Create order
    const [updateResult, orderResult] = await Promise.all([
      apiPut<any>(page1, `/api/admin/products/${productId}`, {
        name: result.data.product?.name,
        variants: [
          {
            id: variantId,
            stockQuantity: 5, // Decrease stock
          },
        ],
      }),
      createOrder(page2, {
        customerId: customerId!,
        items: [{ variantId: variantId!, quantity: 3 }],
      }),
    ]);

    // Both operations should complete without data corruption
    expect(updateResult.response.ok() || orderResult?.success).toBe(true);

    // Verify final stock is consistent
    const products = await getProductsWithVariants(page1);
    const finalVariant = products
      .find((p: any) => p.id === productId)
      ?.variants?.find((v: any) => v.id === variantId);

    // Stock should be non-negative and consistent
    expect(finalVariant?.stockQuantity).toBeGreaterThanOrEqual(0);

    await context1.close();
    await context2.close();
  });
});
