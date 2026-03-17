import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Expense - List
 * Test cases: TC-EXP-001
 */
test.describe("Expense - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-EXP-001 should list expenses", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page.locator("h1, h2").filter({ hasText: /chi phí|expense/i })).toBeVisible();
  });
});
