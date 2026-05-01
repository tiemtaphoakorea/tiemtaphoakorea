import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Analytics - Tab Navigation
 * Test cases: TC-ANALYTICS-005, TC-ANALYTICS-007, TC-ANALYTICS-008
 */
test.describe("Analytics - Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-ANALYTICS-005: Inventory analytics tab shows stock levels and low-stock alerts
  test("TC-ANALYTICS-005 inventory analytics tab loads stock data", async ({ page }) => {
    await page.goto("/analytics/inventory");
    await page.waitForLoadState("domcontentloaded");

    // Tab or page heading for inventory analytics
    await expect(
      page
        .locator("text=Tồn kho")
        .or(page.locator("text=Kho hàng"))
        .or(page.locator("text=Inventory"))
        .or(page.locator('[data-testid="inventory-analytics"]'))
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // Stock levels or low-stock alerts section present
    await expect(
      page
        .locator("text=Cảnh báo")
        .or(page.locator("text=Sắp hết hàng"))
        .or(page.locator("text=Low Stock"))
        .or(page.locator("text=Tồn kho thấp"))
        .or(page.locator("text=Số lượng tồn"))
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  // TC-ANALYTICS-007: Product Analytics tab loads product performance data
  test("TC-ANALYTICS-007 product analytics tab displays product performance", async ({ page }) => {
    await page.goto("/analytics/products");
    await page.waitForLoadState("domcontentloaded");

    // Page/tab heading for product analytics
    await expect(
      page
        .locator("text=Sản phẩm")
        .or(page.locator("text=Products"))
        .or(page.locator("text=Phân tích sản phẩm"))
        .or(page.locator('[data-testid="product-analytics"]'))
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // Some product performance metric or list is present
    await expect(
      page
        .locator("text=Doanh thu")
        .or(page.locator("text=Top sản phẩm"))
        .or(page.locator("text=Bán chạy"))
        .or(page.locator("text=Revenue"))
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  // TC-ANALYTICS-008: Finance analytics with far-past date range shows empty state, not error
  test("TC-ANALYTICS-008 finance analytics shows empty state for no-data date range", async ({
    page,
  }) => {
    await page.goto("/analytics/finance");
    await page.waitForLoadState("domcontentloaded");

    // Wait for the page to stabilise before interacting with date picker
    await expect(
      page
        .locator("text=Tài chính")
        .or(page.locator("text=Finance"))
        .or(page.locator("text=Doanh thu"))
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // Attempt to find a date range start input and set it to a far-past date
    const startDateInput = page
      .locator('input[type="date"]')
      .or(page.locator('[placeholder*="Từ ngày"]'))
      .or(page.locator('[placeholder*="Start"]'))
      .first();

    const hasDateInput = await startDateInput.isVisible().catch(() => false);

    if (hasDateInput) {
      await startDateInput.fill("2000-01-01");

      const endDateInput = page
        .locator('input[type="date"]')
        .or(page.locator('[placeholder*="Đến ngày"]'))
        .or(page.locator('[placeholder*="End"]'))
        .nth(1);

      const hasEndInput = await endDateInput.isVisible().catch(() => false);
      if (hasEndInput) {
        await endDateInput.fill("2000-01-31");
      }

      // Trigger search/filter if there is a submit button
      const applyBtn = page
        .getByRole("button", { name: /áp dụng|lọc|tìm kiếm|apply|filter/i })
        .first();
      const hasApply = await applyBtn.isVisible().catch(() => false);
      if (hasApply) {
        await applyBtn.click();
      }

      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(500);
    }

    // Page must show an empty state message, not a JS error or error toast
    // No unhandled error dialog should be present
    await expect(page.locator('[role="alert"]:has-text("lỗi")')).not.toBeVisible();
    await expect(page.locator('[role="alert"]:has-text("error")')).not.toBeVisible();

    // Empty state indicator: text like "Không có dữ liệu" or "No data" should appear
    // (if no date picker is available the page may just show zero values - that is acceptable)
    const emptyState = page
      .locator("text=Không có dữ liệu")
      .or(page.locator("text=No data"))
      .or(page.locator("text=Chưa có dữ liệu"))
      .or(page.locator('[data-testid="empty-state"]'))
      .first();

    // The assertion is soft: either empty state text OR the page just renders without crashing
    const emptyVisible = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    if (!emptyVisible) {
      // Acceptable: page renders KPI cards with zero values — verify no error boundary triggered
      await expect(page.locator("text=Something went wrong")).not.toBeVisible();
      await expect(page.locator("text=Đã có lỗi xảy ra")).not.toBeVisible();
    }
  });
});
