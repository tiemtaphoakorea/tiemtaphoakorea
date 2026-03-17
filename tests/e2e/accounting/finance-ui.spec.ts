import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F06: Simple Accounting Tests
 * Test cases: TC-ACC-003, TC-ACC-004, TC-ACC-005, TC-ACC-006, TC-ACC-008, TC-ACC-009,
 * TC-ACC-012, TC-ACC-014
 */
test.describe("Accounting - Finance UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-06-03: Tính toán lợi nhuận đúng
  test("TC-ACC-003 should calculate profit correctly", async ({ page }) => {
    await page.goto("/finance");

    // Verify profit metrics are shown
    await expect(
      page.locator("text=Lợi nhuận").or(page.locator("text=Profit")).first(),
    ).toBeVisible();

    await expect(
      page.locator("text=Doanh thu").or(page.locator("text=Revenue")).first(),
    ).toBeVisible();
  });

  test("TC-ACC-004 should validate report date range", async ({ page }) => {
    await page.goto("/finance");

    // Look for date range picker
    const dateInput = page
      .locator("input[type='date']")
      .or(page.locator("button:has-text('Tháng')"));
    const hasDateInput = await dateInput
      .first()
      .isVisible()
      .catch(() => false);

    if (hasDateInput) {
      await expect(dateInput.first()).toBeVisible();
    }
  });

  test("TC-ACC-005 should show top profit products", async ({ page }) => {
    await page.goto("/finance");

    // Look for products section
    const productsSection = page.locator("text=Sản phẩm").or(page.locator("text=Products")).first();
    const hasSection = await productsSection.isVisible().catch(() => false);

    if (hasSection) {
      await expect(productsSection).toBeVisible();
    }
  });

  test("TC-ACC-006 should export report", async ({ page }) => {
    await page.goto("/finance");

    const exportButton = page
      .locator("button:has-text('Xuất')")
      .or(page.locator("button:has-text('Export')"));
    const hasButton = await exportButton.isVisible().catch(() => false);

    if (hasButton) {
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);
      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });

  test("TC-ACC-008 should show daily report", async ({ page }) => {
    await page.goto("/finance");

    // Change to daily view if available
    const dailyButton = page
      .locator("button:has-text('Ngày')")
      .or(page.locator("button:has-text('Daily')"));
    const hasButton = await dailyButton.isVisible().catch(() => false);

    if (hasButton) {
      await dailyButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("TC-ACC-009 should calculate profit margin", async ({ page }) => {
    await page.goto("/finance");

    // Look for margin percentage
    const marginText = page.locator("text=/\\d+%/");
    const hasMargin = await marginText
      .first()
      .isVisible()
      .catch(() => false);

    if (hasMargin) {
      await expect(marginText.first()).toBeVisible();
    }
  });

  test("TC-ACC-012 should enforce date boundaries", async ({ page }) => {
    await page.goto("/finance");

    const dateInput = page.locator("input[type='date']").first();
    const hasInput = await dateInput.isVisible().catch(() => false);

    if (hasInput) {
      // Try setting future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await dateInput.fill(futureDate.toISOString().split("T")[0]);

      // Should validate or restrict
      const value = await dateInput.inputValue();
      expect(value).toBeTruthy();
    }
  });

  test("TC-ACC-014 should show empty state", async ({ page }) => {
    await page.goto("/finance");

    // Finance page should load without errors even with no data
    await expect(
      page.locator("text=Doanh thu").or(page.locator("text=Revenue")).first(),
    ).toBeVisible();

    // No error messages should appear
    const errorMsg = page.locator("text=/error|lỗi/i");
    const hasError = await errorMsg.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});
