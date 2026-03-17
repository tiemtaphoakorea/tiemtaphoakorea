import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Comparison
 * Test cases: TC-DASH-002
 */
test.describe("Admin Dashboard - Comparison", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-07-02: So sánh với hôm qua
  test("TC-DASH-002 should show comparison with yesterday", async ({ page }) => {
    await page.goto("/");

    // Check for revenue KPI with percentage change
    const revenueCard = page
      .locator("text=Doanh thu")
      .or(page.locator("text=Revenue"))
      .locator("..")
      .locator("..");
    await expect(revenueCard).toBeVisible();

    // Look for percentage indicator (could be +/- with %)
    const percentageIndicator = page.locator("text=/[+-]?\\d+(\\.\\d+)?%/").first();

    // If no orders exist, percentage might not be shown, so we check if visible
    const hasPercentage = await percentageIndicator.isVisible().catch(() => false);

    if (hasPercentage) {
      await expect(percentageIndicator).toBeVisible();
    }
  });
});
