import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPut, cleanupTestProducts, createProductWithVariants } from "../helpers/api";

test.describe("Product Cost Price History", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-HIST-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-007: should log cost price history when updated", async ({ page }) => {
    const productName = `Cost History ${runId}`;
    const product = await createProductWithVariants(page, {
      name: productName,
      variants: [{ sku: `HIST-${runId}`, costPrice: 180000, price: 500000 }],
    });

    const productId = product.product.id;
    const variantId = product.product.variants[0].id;

    // Update cost price via API for speed
    await apiPut(page, `/api/admin/products/${productId}`, {
      name: productName,
      variants: [{ id: variantId, costPrice: 200000 }],
    });

    const historyRes = await apiGet<{ history: any[] }>(
      page,
      `/api/admin/products/variants/${variantId}/cost-history`,
    );
    expect(historyRes.data.history.length).toBeGreaterThan(0);
    expect(historyRes.data.history[0].costPrice).toBe(180000); // Old price logged
  });
});
