import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Advanced Accounting Tests
 * Test cases: TC-ACC-014
 */
test.describe("Accounting - Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ACC-014 should show profit report page (empty or with data)", async ({ page }) => {
    await page.goto("/finance");
    await page.waitForTimeout(1000);

    // Finance page shows P&L section (single element: heading)
    await expect(page.getByRole("heading", { name: "Tài chính & Lợi nhuận" })).toBeVisible();
  });
});
