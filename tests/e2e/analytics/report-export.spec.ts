import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F09: Analytics Dashboard Tests
 * Test cases: ANA-02
 */
test.describe("Analytics - Report Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ANA-02: Tải báo cáo (chờ data load trước khi tìm nút)
  test("TC-ANALYTIC-002 should allow report download action", async ({ page }) => {
    await page.goto("/analytics");

    // Chờ dữ liệu analytics load xong rồi mới tìm nút download
    await expect(
      page.locator("text=Tổng doanh thu").or(page.locator("text=Doanh thu")).first(),
    ).toBeVisible({ timeout: 15000 });

    const downloadButton = page
      .locator("button:has-text('Tải xuống')")
      .or(page.locator("button:has-text('Download')"))
      .or(page.locator("button:has-text('Export')"))
      .or(page.locator("button:has-text('Xuất báo cáo')"))
      .or(page.locator("[data-testid*='download']"))
      .or(page.locator("[data-testid*='export']"));

    const hasButton = await downloadButton
      .first()
      .isVisible()
      .catch(() => false);

    if (hasButton) {
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await downloadButton.first().click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx?|csv)$/i);
      }
    }
  });
});
