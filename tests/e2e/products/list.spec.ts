import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, cleanupTestProducts, createProductWithVariants } from "../helpers/api";

const BASELINE_PRODUCT_NAME = "E2E Baseline Product";
const BASELINE_SKU = "E2E-LIST-BASE";

test.describe("Product List & Search", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);

    // Seed baseline data
    await createProductWithVariants(page, {
      name: BASELINE_PRODUCT_NAME,
      variants: [{ sku: BASELINE_SKU, price: 100000 }],
    });

    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await cleanupTestProducts(page, "E2E-LIST");
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-PROD-002: should display product list", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("h1, h2").filter({ hasText: /sản phẩm|product/i })).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="product-list"]')),
    ).toBeVisible();
  });

  test("TC-PROD-002: should support search by name", async ({ page }) => {
    await page.goto("/products");
    await page.fill('input[placeholder*="Tìm kiếm"]', BASELINE_PRODUCT_NAME);
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${BASELINE_PRODUCT_NAME}`)).toBeVisible();
  });

  test("TC-PROD-019: should search product by SKU in admin", async ({ page }) => {
    await page.goto("/products");
    await page.fill('input[placeholder*="Tìm kiếm"]', BASELINE_SKU);
    await page.waitForTimeout(500);
    await expect(page.locator(`text=${BASELINE_SKU}`)).toBeVisible();
  });

  test("TC-PROD-013: should show only active products in customer catalog", async ({ page }) => {
    const runId = `CAT-${Date.now()}`;
    const activeProductName = `Active Catalog ${runId}`;
    const inactiveProductName = `Inactive Catalog ${runId}`;

    // Create active product via API
    await apiPost<any>(page, "/api/admin/products", {
      name: activeProductName,
      isActive: true, // Explicitly active
      categoryId: null,
      variants: [
        {
          sku: `ACT-${runId}`,
          name: "Default",
          stockType: "in_stock",
          stockQuantity: 10,
          price: 100,
          costPrice: 50,
        },
      ],
    });

    // Create inactive product via API
    await apiPost<any>(page, "/api/admin/products", {
      name: inactiveProductName,
      isActive: false, // Explicitly inactive
      categoryId: null,
      variants: [
        {
          sku: `INACT-${runId}`,
          name: "Default",
          stockType: "in_stock",
          stockQuantity: 10,
          price: 100,
          costPrice: 50,
        },
      ],
    });

    // View customer catalog (public URL)
    await page.goto("http://localhost:3000/products");
    await page.waitForLoadState("networkidle");

    // Search for active product - should be visible
    const searchInput = page.locator(
      'input[placeholder*="Tìm kiếm"], input[placeholder*="Search"]',
    );
    await searchInput.fill(activeProductName);
    await page.waitForURL(/\/products\?.*q=/, { timeout: 5000 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator(`text=${activeProductName}`)).toBeVisible();

    // Search for inactive product - should not be visible
    await searchInput.fill(inactiveProductName);
    await searchInput.press("Enter");
    await page.waitForTimeout(500);
    await expect(
      page.locator("text=Không tìm thấy").or(page.locator("text=No products")),
    ).toBeVisible();

    // Cleanup
    await cleanupTestProducts(page, runId);
  });

  test("TC-PROD-017: should filter categories by active products only", async ({ page }) => {
    const runId = `CAT-FIL-${Date.now()}`;

    // Create a category
    const category = await apiPost<any>(page, "/api/admin/categories", {
      name: `Test Cat ${runId}`,
      slug: `test-cat-${runId}`,
    });
    const categoryId = category.data.category?.id;

    // Create only inactive products in this category
    await apiPost<any>(page, "/api/admin/products", {
      name: `Inactive in Cat ${runId}`,
      slug: `inactive-cat-${runId}`,
      categoryId,
      isActive: false,
    });

    // Navigate to customer catalog
    await page.goto("/products");
    await page.waitForTimeout(1000);

    // Category should not appear if no active products
    // (Assuming the UI filters out empty categories or categories with no active products)
    const categoryFilter = page.locator(`text=${category.data.category?.name}`);
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(
        page.locator("text=Không có sản phẩm").or(page.locator("text=No products")),
      ).toBeVisible();
    }

    // Cleanup
    await cleanupTestProducts(page, runId);
  });
});
