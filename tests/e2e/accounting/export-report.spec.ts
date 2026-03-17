import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Advanced Accounting Tests
 * Test cases: TC-ACC-006
 */
test.describe("Accounting - Export Report", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ACC-006 should export report to Excel", async ({ page }) => {
    // Navigate to finance page
    await page.goto("/finance");
    await page.waitForTimeout(1000);

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Xuất Excel")');

    if (await exportButton.isVisible()) {
      // Click export and verify download starts
      const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);

      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.xlsx|\.xls|\.csv/);
    }
  });
});
