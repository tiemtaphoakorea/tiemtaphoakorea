import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestProducts, createProductWithVariants } from "../helpers/api";

test.describe("Product Inventory & Stock", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-INV-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-010: should allow changing stock type to preorder", async ({ page }) => {
    await page.goto("/products/new");
    await page.fill('input[name="name"]', `Preorder ${runId}`);
    await page.fill('input[name="basePrice"]', "100000");
    await page.click('button:has-text("Biến thể & Giá")');

    const stockTypeButton = page
      .locator('button:has-text("Có sẵn"), [id^="radix-"]:has-text("Có sẵn")')
      .first();
    await stockTypeButton.click();

    // The preorder option is likely in a portal, use a more global locator
    const preorderOption = page
      .locator('[role="menuitem"]:has-text("Đặt trước"), button:has-text("Đặt trước")')
      .last();
    await preorderOption.waitFor({ state: "visible" });
    await preorderOption.click();

    await expect(page.locator('button:has-text("Đặt trước")').first()).toBeVisible();
  });

  test("TC-PROD-016: should validate variant stock quantity (prevent negative)", async ({
    page,
  }) => {
    await page.goto("/products/new");
    await page.click('button:has-text("Biến thể & Giá")');
    const stockInput = page.getByTestId("variant-stock-0");

    await stockInput.fill("-10");
    await stockInput.blur();

    const value = await stockInput.inputValue();
    expect(Number(value)).toBeGreaterThanOrEqual(0);
  });

  test("TC-PROD-018: should update low stock threshold and affect filter", async ({ page }) => {
    // This test logic combines creation and verification of low stock behavior
    const productName = `Threshold ${runId}`;
    await createProductWithVariants(page, {
      name: productName,
      variants: [{ sku: `THR-${runId}`, stockQuantity: 5, lowStockThreshold: 10 }],
    });

    await page.goto("/products");
    await page.fill('input[placeholder*="Tìm kiếm"]', runId);

    // Check if low stock indicator is present
    await expect(page.locator("table tbody tr").filter({ hasText: runId })).toContainText(
      /low|thấp/i,
    );
  });
});
