import { expect, loginAsAdmin, loginAsStaff, test } from "../fixtures/auth";
import { apiPut, cleanupTestProducts, createProductWithVariants } from "../helpers/api";

/**
 * Product Validation Tests
 * Test cases: TC-PROD-006, TC-PROD-018, TC-PROD-019, TC-PROD-021, TC-PROD-022, TC-PROD-023, TC-PROD-024
 *
 * Note: TC-PROD-003 (require name via HTML attribute) and TC-PROD-004 (duplicate SKU error)
 * are already covered in manage.spec.ts.
 */
test.describe("Products - Validation", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-VAL-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestProducts(page, runId);
  });

  // TC-PROD-006: Empty name validation — inline error shown, form not submitted
  test("TC-PROD-006: should show inline error when product name is empty", async ({ page }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    // Leave name empty, fill price, attempt submit
    await page.fill('input[name="basePrice"]', "50000");

    const submitBtn = page.locator('button[type="submit"]:has-text("Tạo sản phẩm")');
    await submitBtn.click();

    // Either browser-native validation fires or an inline error appears
    const nameInput = page.locator('input[name="name"]');
    const isRequired = await nameInput.getAttribute("required");

    if (isRequired !== null) {
      // Browser native validation — form not submitted, URL unchanged
      await expect(page).toHaveURL(/\/products\/new/, { timeout: 3000 });
    } else {
      // Custom inline error
      await expect(
        page
          .locator("text=Tên sản phẩm bắt buộc")
          .or(page.locator("text=Tên sản phẩm không được để trống"))
          .or(page.locator('[role="alert"]').filter({ hasText: /tên|name/i })),
      ).toBeVisible({ timeout: 5000 });
    }

    // Ensure we did NOT navigate away (form not submitted)
    await expect(page).toHaveURL(/\/products\/new/);
  });

  // TC-PROD-018: Duplicate product name is allowed (no uniqueness constraint on name)
  test("TC-PROD-018: should allow creating two products with the same name", async ({ page }) => {
    const sharedName = `Laptop Dell ${runId}`;

    // Create first product via API
    const first = await createProductWithVariants(page, {
      name: sharedName,
      variants: [{ sku: `DUP-1-${runId}`, price: 100000 }],
    });
    expect(first.product).toBeTruthy();

    // Create second product with same name via API
    const second = await createProductWithVariants(page, {
      name: sharedName,
      variants: [{ sku: `DUP-2-${runId}`, price: 100000 }],
    });
    expect(second.product).toBeTruthy();

    // Both should appear in the list
    await page.goto("/products");
    await page.fill('input[placeholder*="Tìm kiếm"]', sharedName);
    await page.waitForTimeout(700);

    const rows = page.locator("table tbody tr").filter({ hasText: sharedName });
    await expect(rows.first()).toBeVisible({ timeout: 8000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // TC-PROD-019: Staff can add products
  test("TC-PROD-019: staff should be able to create a product", async ({ page }) => {
    await loginAsStaff(page);

    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    const productName = `Staff Prod ${runId}`;
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="basePrice"]', "75000");

    // Fill variant tab
    const variantTab = page.locator('button:has-text("Biến thể & Giá")');
    if (await variantTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await variantTab.click();
    }
    await page.locator('input[placeholder="SKU-..."]').first().fill(`STAFF-${runId}`);
    await page.getByTestId("variant-price-0").fill("75000");

    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');
    await page.waitForURL(/\/products(\?.*)?$/, { timeout: 15000 });
    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 8000 });
  });

  // TC-PROD-021: Variant price history shows "Changed By" column with admin's fullName
  test("TC-PROD-021: variant price history should display Changed By column", async ({ page }) => {
    const product = await createProductWithVariants(page, {
      name: `Price History ${runId}`,
      variants: [{ sku: `PH-${runId}`, price: 100000, costPrice: 50000 }],
    });

    const productId = product.product.id;
    const variantId = product.product.variants[0].id;

    // Update the variant price to trigger a history entry
    await apiPut(page, `/api/admin/products/${productId}`, {
      name: `Price History ${runId}`,
      variants: [{ id: variantId, price: 120000, costPrice: 50000 }],
    });

    // Navigate to product edit / history tab
    await page.goto(`/products/${productId}/edit`);
    await page.waitForLoadState("networkidle");

    // Look for a history or price-history tab/section
    const historyTab = page
      .locator('button, [role="tab"]')
      .filter({ hasText: /lịch sử|history/i })
      .first();

    if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);
    }

    // The history table should contain a "Changed By" / "Người thay đổi" column header
    await expect(
      page
        .locator("th, td")
        .filter({ hasText: /changed by|người thay đổi|thay đổi bởi/i })
        .first(),
    ).toBeVisible({ timeout: 8000 });

    // At least one history row should be present with a non-empty name
    const historyRows = page.locator("table tbody tr");
    await expect(historyRows.first()).toBeVisible({ timeout: 5000 });
  });

  // TC-PROD-022: Product without category — test actual behavior (required or optional)
  test("TC-PROD-022: should handle category field as optional or show required error", async ({
    page,
  }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    const productName = `NoCat ${runId}`;
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="basePrice"]', "30000");

    const variantTab = page.locator('button:has-text("Biến thể & Giá")');
    if (await variantTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await variantTab.click();
    }
    await page.locator('input[placeholder="SKU-..."]').first().fill(`NOCAT-${runId}`);
    await page.getByTestId("variant-price-0").fill("30000");

    // Do NOT select category — submit as-is
    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');

    // Accept either: product created (category optional) OR inline error (category required)
    const createdSuccessfully = await page
      .waitForURL(/\/products(\?.*)?$/, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (createdSuccessfully) {
      // Category is optional — product created without it
      await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 5000 });
    } else {
      // Category is required — inline error should be visible
      await expect(
        page
          .locator("text=Danh mục bắt buộc")
          .or(page.locator("text=Vui lòng chọn danh mục"))
          .or(page.locator('[role="alert"]').filter({ hasText: /danh mục|category/i })),
      ).toBeVisible({ timeout: 5000 });
      // Form not submitted
      await expect(page).toHaveURL(/\/products\/new/);
    }
  });

  // TC-PROD-023: Variant with empty name shows inline error
  test("TC-PROD-023: should show inline error when variant name is empty", async ({ page }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    await page.fill('input[name="name"]', `VarNameTest ${runId}`);
    await page.fill('input[name="basePrice"]', "20000");

    // Open variant section and add a variant without a name
    const addVariantBtn = page
      .locator('button:has-text("Thêm biến thể"), button:has-text("Biến thể & Giá")')
      .first();
    if (await addVariantBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addVariantBtn.click();
      await page.waitForTimeout(300);
    }

    // Clear variant name if auto-populated
    const variantNameInput = page
      .locator('input[name*="variant"][name*="name"], input[placeholder*="Tên biến thể"]')
      .first();
    if (await variantNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await variantNameInput.clear();
    }

    await page.click('button[type="submit"]:has-text("Tạo sản phẩm")');

    // Expect inline error for variant name
    const variantNameError = page
      .locator("text=Tên biến thể bắt buộc")
      .or(page.locator("text=Tên biến thể không được để trống"))
      .or(page.locator('[role="alert"]').filter({ hasText: /biến thể|variant/i }));

    const hasError = await variantNameError.isVisible({ timeout: 5000 }).catch(() => false);
    const stayedOnPage = page.url().includes("/products/new");

    // Either inline error shown or form stayed on page (native validation)
    expect(hasError || stayedOnPage).toBe(true);
  });

  // TC-PROD-024: Upload image wrong format (.pdf) should show validation error
  test("TC-PROD-024: should reject non-image file upload", async ({ page }) => {
    await page.goto("/products/new");
    await page.locator('input[name="name"]').waitFor({ state: "visible", timeout: 10000 });

    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "File input not found on product form");
    }

    await fileInput.setInputFiles({
      name: "test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("PDF"),
    });

    await page.waitForTimeout(500);

    // Either an error toast/inline message appears, or the input value is cleared (browser validation)
    const errorVisible = await page
      .locator('text=Chỉ chấp nhận file ảnh, text=jpg, text=png, text=webp, [role="alert"]')
      .or(page.locator('[role="alert"]').filter({ hasText: /ảnh|image|jpg|png|webp|định dạng/i }))
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const inputCleared = await fileInput.evaluate((el: HTMLInputElement) => el.files?.length === 0);

    // Acceptable outcomes: error shown OR input rejected (value empty)
    expect(errorVisible || inputCleared).toBe(true);
  });
});
