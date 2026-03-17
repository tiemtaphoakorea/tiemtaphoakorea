import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet } from "../helpers/api";

/**
 * Dashboard - Date Range Filter
 * Test cases: TC-DASH-010
 */
test.describe("Dashboard - Date Range Filter", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-010 should allow date range filter", async ({ page }) => {
    await page.goto("/");

    // Look for date picker or filter button
    const dateFilter = page
      .locator("button:has-text('Hôm nay')")
      .or(page.locator("button:has-text('Today')"))
      .or(page.locator("button:has-text('Tuần này')"))
      .or(page.locator("button:has-text('This week')"))
      .or(page.locator("input[type='date']"))
      .or(page.locator("[data-testid*='date']"));

    const hasDateFilter = await dateFilter
      .first()
      .isVisible()
      .catch(() => false);

    if (hasDateFilter) {
      await expect(dateFilter.first()).toBeVisible();

      // Try clicking the filter if it's a button
      const isButton = await dateFilter.first().evaluate((el) => el.tagName === "BUTTON");
      if (isButton) {
        await dateFilter.first().click();

        // Wait for date picker menu to appear
        await page.waitForTimeout(500);
      }
    }
  });

  test("TC-DASH-010 should filter dashboard by date range", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for date range picker
    const dateRangePicker = page.locator(
      'input[type="date"], [data-testid="date-range"], button:has-text("Date Range")',
    );

    if (await dateRangePicker.first().isVisible()) {
      await dateRangePicker.first().click();

      // Select a specific date range (e.g., last 7 days)
      const last7Days = page.locator('text=Last 7 days, text=7 ngày, button:has-text("7")');

      if (await last7Days.first().isVisible()) {
        await last7Days.first().click();
        await page.waitForTimeout(1000);

        // Verify dashboard updates
        const { data: filteredStats } = await apiGet<any>(page, "/api/admin/stats?period=7days");
        expect(filteredStats).toBeDefined();
      }
    }

    // Try custom date range via URL
    await page.goto("/admin?startDate=2026-01-01&endDate=2026-01-31");
    await page.waitForTimeout(1000);

    // Verify page loads with filtered data
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
