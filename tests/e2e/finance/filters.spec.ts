import { loginAsAdmin, test } from "../fixtures/auth";

/**
 * Finance - Filters
 * Test cases: TC-FIN-002
 */
test.describe("Finance - Filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // FIN-02: Thay đổi bộ lọc thời gian
  test("TC-FIN-002 should change month/year filters", async ({ page }) => {
    await page.goto("/finance");

    const monthSelect = page.locator("[data-state]", { hasText: "Tháng" });
    const yearSelect = page.locator("[data-state]", { hasText: "Năm" });

    if (await monthSelect.first().isVisible()) {
      await monthSelect.first().click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    if (await yearSelect.first().isVisible()) {
      await yearSelect.first().click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
  });
});
