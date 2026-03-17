import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Finance - Dashboard
 * Test cases: TC-FIN-001
 */
test.describe("Finance - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // FIN-01: Xem dashboard tài chính
  test("TC-FIN-001 should display finance dashboard", async ({ page }) => {
    await page.goto("/finance");

    await expect(page.locator("h1, h2").filter({ hasText: /tài chính|finance/i })).toBeVisible();
    // At least one of P&L, Lợi nhuận, Doanh thu (strict: use .first() when multiple match)
    await expect(
      page
        .locator("text=P&L")
        .or(page.locator("text=Lợi nhuận"))
        .or(page.locator("text=Doanh thu"))
        .first(),
    ).toBeVisible();
  });
});
