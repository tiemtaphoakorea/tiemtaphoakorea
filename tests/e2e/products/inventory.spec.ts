import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  apiGet,
  cleanupTestProducts,
  createProductWithVariants,
  getProductsWithVariants,
  waitForProductVisible,
} from "../helpers/api";

test.describe("Product Inventory & Stock", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-INV-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-010: should show inventory controls for the default variant", async ({ page }) => {
    await page.goto("/products/new");
    await page.fill('input[name="name"]', `Preorder ${runId}`);
    await page.fill('input[name="basePrice"]', "100000");

    await expect(page.getByTestId("variant-stock-0")).toBeVisible();
    await expect(page.getByTestId("variant-low-stock-threshold-0")).toBeVisible();
  });

  test("TC-PROD-016: should validate variant stock quantity (prevent negative)", async ({
    page,
  }) => {
    await page.goto("/products/new");
    const stockInput = page.getByTestId("variant-stock-0");

    await stockInput.fill("-10");
    await stockInput.blur();

    const value = await stockInput.inputValue();
    expect(Number(value)).toBeGreaterThanOrEqual(0);
  });

  test("TC-PROD-018: should persist low stock threshold through product API", async ({ page }) => {
    // This test logic combines creation and verification of low stock behavior
    const productName = `Threshold ${runId}`;
    await createProductWithVariants(page, {
      name: productName,
      variants: [{ sku: `THR-${runId}`, stockQuantity: 5, lowStockThreshold: 10 }],
    });

    const products = await getProductsWithVariants(page);
    const match = products.find((p: { variants?: { sku: string }[] }) =>
      p.variants?.some((v) => v.sku === `THR-${runId}`),
    );
    expect(match, "product with threshold variant should exist").toBeTruthy();
    const variant = match!.variants!.find((v: { sku: string }) => v.sku === `THR-${runId}`)!;
    expect(Number(variant.lowStockThreshold)).toBe(10);
    expect(Number(variant.onHand ?? variant.stockQuantity)).toBe(5);
  });

  test("TC-PROD-025: should persist per-variant low stock threshold when creating via UI", async ({
    page,
  }) => {
    const sku = `LST-UI-${runId}`;
    const productName = `LST UI Create ${runId}`;

    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="basePrice"]', "50000");

    await page.locator('input[placeholder="SKU-..."]').first().fill(sku);
    await page.getByTestId("variant-price-0").fill("50000");
    await page.getByTestId("variant-stock-0").fill("12");
    await page.getByTestId("variant-low-stock-threshold-0").fill("7");

    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });
    await page.waitForTimeout(800);

    const products = await getProductsWithVariants(page);
    const match = products.find((p: { variants?: { sku: string }[] }) =>
      p.variants?.some((v) => v.sku === sku),
    );
    expect(match, "product with SKU should exist after UI create").toBeTruthy();
    const variant = match!.variants!.find((v: { sku: string }) => v.sku === sku)!;
    expect(Number(variant.lowStockThreshold)).toBe(7);
    expect(Number(variant.onHand ?? variant.stockQuantity)).toBe(12);
  });

  test("TC-PROD-026: should persist low stock threshold when updating product via edit form", async ({
    page,
  }) => {
    const sku = `ELST-${runId}`;
    const { product } = await createProductWithVariants(page, {
      name: `Edit LST ${runId}`,
      variants: [{ sku, stockQuantity: 20, lowStockThreshold: 5, price: 100000 }],
    });
    const productId = product.id as string;
    await waitForProductVisible(page, productId);

    await page.goto(`/products/${productId}/edit`);
    await page.waitForURL(/\/products\/.*\/edit/);
    await page.waitForLoadState("networkidle");

    const thresholdInput = page.getByTestId("variant-low-stock-threshold-0");
    await expect(thresholdInput).toBeVisible({ timeout: 10000 });
    await thresholdInput.fill("15");

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });
    await page.waitForTimeout(500);

    const { data, response } = await apiGet<{
      product: { variants: { sku: string; lowStockThreshold: number | null }[] };
    }>(page, `/api/admin/products/${productId}`);
    expect(response.ok()).toBeTruthy();
    const v = data.product.variants.find((x) => x.sku === sku);
    expect(v).toBeTruthy();
    expect(Number(v!.lowStockThreshold)).toBe(15);
  });

  test("TC-PROD-027: should default low stock threshold to 5 for new product variant", async ({
    page,
  }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });
    const thresholdInput = page.getByTestId("variant-low-stock-threshold-0");
    await expect(thresholdInput).toBeVisible();
    const raw = await thresholdInput.inputValue();
    const n = Number(raw.replace(/\./g, "").replace(",", "."));
    expect(n).toBe(5);
  });
});
