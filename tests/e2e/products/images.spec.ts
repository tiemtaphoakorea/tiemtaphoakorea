import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, cleanupTestProducts, createProductWithVariants } from "../helpers/api";

test.describe("Product Images Persistence", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-IMG-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("should persist image for selected variant on create", async ({ page }) => {
    const productName = `Image Create ${runId}`;
    const firstSku = `IMG-C1-${runId}`;
    const secondSku = `IMG-C2-${runId}`;
    const secondVariantName = `Variant Upload ${runId}`;
    const uploadedUrl = `https://example.com/${runId}-create.png`;

    await page.route("**/api/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: uploadedUrl }),
      });
    });

    await page.goto("/products/new");
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="basePrice"]', "100000");

    await page.click('button:has-text("Biến thể & Giá")');
    await page.locator('input[placeholder="SKU-..."]').first().fill(firstSku);
    await page.getByTestId("variant-price-0").fill("100000");

    await page.click('button:has-text("Thêm thủ công")');
    const secondRow = page.locator("table tbody tr").nth(1);
    await secondRow.locator("input").nth(0).fill(secondVariantName);
    await secondRow.locator('input[placeholder="SKU-..."]').fill(secondSku);
    await page.getByTestId("variant-price-1").fill("120000");

    await page.click('button:has-text("Hình ảnh")');
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: secondVariantName }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: "create-test.png",
      mimeType: "image/png",
      buffer: Buffer.from("create-image"),
    });

    await expect(page.locator('img[alt="Upload 0"]')).toBeVisible({ timeout: 10000 });

    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });

    const { data } = await apiGet<{ products: any[] }>(
      page,
      "/api/admin/products?include=variants",
    );
    const created = data.products.find((p) => p.name === productName);
    const targetVariant = created?.variants?.find((v: any) => v.sku === secondSku);
    expect(targetVariant).toBeTruthy();
    expect(targetVariant.images?.[0]?.imageUrl).toBe(uploadedUrl);
  });

  test("should save temp variant with image on edit (no uuid error)", async ({ page }) => {
    const productName = `Image Edit ${runId}`;
    const baseSku = `IMG-E1-${runId}`;
    const newSku = `IMG-E2-${runId}`;
    const newVariantName = `Temp Variant ${runId}`;
    const uploadedUrl = `https://example.com/${runId}-edit.png`;

    const created = await createProductWithVariants(page, {
      name: productName,
      variants: [{ sku: baseSku, price: 100000 }],
    });
    const productId = created.product.id as string;

    await page.route("**/api/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: uploadedUrl }),
      });
    });

    await page.goto(`/products/${productId}/edit`);
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 15000 });

    await page.click('button:has-text("Biến thể & Giá")');
    await page.click('button:has-text("Thêm thủ công")');
    const secondRow = page.locator("table tbody tr").nth(1);
    await secondRow.locator("input").nth(0).fill(newVariantName);
    await secondRow.locator('input[placeholder="SKU-..."]').fill(newSku);
    await page.getByTestId("variant-price-1").fill("130000");

    await page.click('button:has-text("Hình ảnh")');
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: newVariantName }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "edit-test.png",
      mimeType: "image/png",
      buffer: Buffer.from("edit-image"),
    });

    await expect(page.locator('img[alt="Upload 0"]')).toBeVisible({ timeout: 10000 });
    await page.click('button[type="submit"]:has-text("Lưu thay đổi")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });

    const { data } = await apiGet<{ product: any }>(page, `/api/admin/products/${productId}`);
    const targetVariant = data.product?.variants?.find((v: any) => v.sku === newSku);
    expect(targetVariant).toBeTruthy();
    expect(targetVariant.images?.[0]?.imageUrl).toBe(uploadedUrl);
  });
});
