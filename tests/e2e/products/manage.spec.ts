import { STOREFRONT_BASE_URL } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestProducts, createProductWithVariants } from "../helpers/api";

test.describe("Product Management (Create/Edit/Deactivate)", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-MANAGE-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-001: should create a new product with variant", async ({ page }) => {
    await page.goto("/products/new");
    const productName = `Product ${runId}`;
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="basePrice"]', "100000");

    await page.click('button:has-text("Biến thể & Giá")');
    await page.locator('input[placeholder="SKU-..."]').first().fill(`SKU-${runId}`);
    await page.getByTestId("variant-price-0").fill("100000");

    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });
    await expect(page.locator(`text=${productName}`)).toBeVisible();
  });

  test("TC-PROD-006: should edit product information", async ({ page }) => {
    const product = await createProductWithVariants(page, {
      name: `Edit Target ${runId}`,
      variants: [{ sku: `EDIT-${runId}`, price: 100000 }],
    });

    const productId = product.product.id;
    await page.goto(`/products/${productId}/edit`);

    await page.waitForURL(/\/products\/.*\/edit/);
    await page.waitForLoadState("networkidle");
    await page.fill('input[name="name"]', `Updated ${runId}`);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/products/);
    await page.waitForLoadState("networkidle");
    await page.fill('input[placeholder*="Tìm kiếm"]', `Updated ${runId}`);
    await expect(page.locator("table tbody tr").first()).toContainText(`Updated ${runId}`);
  });

  test("TC-PROD-012: should deactivate product and hide from catalog", async ({ page }) => {
    const productName = `Deactivate ${runId}`;
    const product = await createProductWithVariants(page, {
      name: productName,
      isActive: true,
      variants: [{ sku: `DEACT-${runId}`, price: 100000 }],
    });

    // Deactivate via edit
    await page.goto(`/products/${product.product.id}/edit`);
    await page.waitForLoadState("networkidle");

    // Find the switch. It might be within a Label or just a button.
    const activeSwitch = page.locator('button[role="switch"]').first();
    await expect(activeSwitch).toBeVisible();
    await activeSwitch.click();

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/products(\?.*)?$/);
    await page.waitForLoadState("networkidle");

    // Verify hidden from storefront
    await page.goto(`${STOREFRONT_BASE_URL}/products/${product.product.slug}`);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("TC-PROD-003: should require product name", async ({ page }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute("required", "");
  });

  test("TC-PROD-004: should show error for duplicate SKU", async ({ page }) => {
    // Create a product with the SKU we want to test
    await createProductWithVariants(page, {
      name: `Original SKU Product ${runId}`,
      variants: [{ sku: "ABC-30", price: 100000 }],
    });

    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    await page.fill('input[name="name"]', `Duplicate SKU ${runId}`);
    await page.fill('input[name="basePrice"]', "100000");
    await page.click('button:has-text("Biến thể & Giá")');
    await page.locator('input[placeholder="SKU-..."]').first().fill("ABC-30");
    await page.getByTestId("variant-price-0").fill("100000");
    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');

    await expect(page.locator('[role="alert"]').filter({ hasText: "SKU" })).toContainText(
      'SKU "ABC-30" đã tồn tại',
    );
  });

  test("TC-PROD-015: should handle slug uniqueness", async ({ page }) => {
    const uniqueProductName = `Slug Test Product ${runId}`;
    const expectedBaseSlug = "slug-test-product";

    // Create first product via API
    await createProductWithVariants(page, {
      name: uniqueProductName,
      variants: [{ sku: `SLUG-1-${runId}`, price: 100000 }],
    });

    // Create second product with same name to trigger slug uniqueness
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });
    await page.fill('input[name="name"]', uniqueProductName);
    await page.click('button:has-text("Biến thể & Giá")');
    await page.locator('input[placeholder="SKU-..."]').first().fill(`SLUG-2-${runId}`);
    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Search for the products
    await page.goto(`/products?search=${encodeURIComponent(uniqueProductName)}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);

    // Should show both products with different slugs
    const slugSuffix = runId.replace(/[^a-zA-Z0-9-]/g, "-");
    const slugRegex = new RegExp(`\\/${expectedBaseSlug}-${slugSuffix}(-\\d+)?`);
    const slugElements = page.getByText(slugRegex);

    // Verify at least 2 products with unique slugs exist
    await expect(slugElements.first()).toBeVisible({ timeout: 10000 });
    const count = await slugElements.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
