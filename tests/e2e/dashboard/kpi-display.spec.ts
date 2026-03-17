import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - KPI Display
 * Test cases: TC-DASH-001
 */
test.describe("Dashboard - KPI Display", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-001 should display key metrics", async ({ page }) => {
    await page.goto("/");

    // Verify key metrics are displayed using specific card titles
    await expect(page.locator("text=Doanh thu hôm nay").first()).toBeVisible();
    await expect(page.locator("text=Đơn hàng mới").first()).toBeVisible();
    await expect(page.locator("text=Khách hàng mới").first()).toBeVisible();
    await expect(page.locator("text=Cảnh báo kho").first()).toBeVisible();
  });
});
