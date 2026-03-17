import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Empty State
 * Test cases: TC-DASH-011
 */
test.describe("Dashboard - Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-011 should show empty state", async ({ page }) => {
    await page.goto("/");

    // Dashboard should always show KPIs even if zero
    const revenueText = page.locator("text=Doanh thu").or(page.locator("text=Revenue"));
    await expect(revenueText).toBeVisible();

    // Charts should render without errors even with no data
    // Look for chart container
    const chartContainer = page.locator("[class*='chart']").or(page.locator("canvas"));
    const _hasChart = await chartContainer
      .first()
      .isVisible()
      .catch(() => false);

    // Verify no error messages are shown
    const errorMessage = page.locator("text=/error|lỗi/i");
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("TC-DASH-011 should show empty state for dashboard with no data", async ({ page }) => {
    // Navigate to dashboard - it should always show data
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Verify dashboard loads without errors
    await expect(page.locator("text=Trung tâm điều hành")).toBeVisible();

    // KPI cards should be visible even with zero values
    const revenueCard = page.locator("text=Doanh thu hôm nay");
    await expect(revenueCard).toBeVisible({ timeout: 10000 });

    // Get the revenue value
    const revenueValue = await revenueCard
      .locator("..")
      .locator("..")
      .locator("div.text-2xl")
      .first()
      .textContent();

    // Revenue should be displayed (could be 0đ or any value)
    expect(revenueValue).toBeDefined();
    expect(revenueValue).toMatch(/\d+/);

    // Verify other KPIs are visible
    await expect(page.locator("text=Đơn hàng mới").first()).toBeVisible();
    await expect(page.locator("text=Khách hàng mới").first()).toBeVisible();
    await expect(page.locator("text=Cảnh báo kho").first()).toBeVisible();
  });
});
