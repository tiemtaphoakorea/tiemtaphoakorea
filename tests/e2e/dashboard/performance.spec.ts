import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Performance
 * Test cases: TC-DASH-007
 */
test.describe("Admin Dashboard - Performance", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-07-01: Dashboard load nhanh
  test("TC-DASH-007 should load dashboard quickly", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");

    // Dashboard should be visible
    await expect(page.locator("h1, h2").first()).toBeVisible();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });
});
