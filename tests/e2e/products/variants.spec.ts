import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestProducts } from "../helpers/api";

test.describe("Product Variants Management", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-VAR-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-005: should generate variant matrix", async ({ page }) => {
    await page.goto("/products/new");
    await page.fill('input[name="name"]', `Matrix ${runId}`);
    await page.fill('input[name="basePrice"]', "100000");
    await page.click('button:has-text("Biến thể & Giá")');

    // Add attributes and generate
    await page.fill('input[placeholder*="Đỏ"]', "Red, Blue");
    await page.fill('input[placeholder*="S, M"]', "S, M");
    await page.click('button:has-text("Tạo danh sách biến thể")');

    await expect(page.locator("table tbody tr")).toHaveCount(4);
  });

  test("TC-PROD-008: should add and remove variant manually", async ({ page }) => {
    await page.goto("/products/new");
    await page.click('button:has-text("Biến thể & Giá")');

    await expect(page.locator("table tbody tr")).toHaveCount(1);
    await page.click('button:has-text("Thêm thủ công")');
    await expect(page.locator("table tbody tr")).toHaveCount(2);

    await page.locator("table tbody tr").last().locator("button:has(svg.lucide-trash2)").click();
    await expect(page.locator("table tbody tr")).toHaveCount(1);
  });
});
