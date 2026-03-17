import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Customer - List
 * Test cases: TC-CUST-004
 */
test.describe("Customer - List", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // CUST-01: Xem danh sách khách hàng
  test("TC-CUST-004 should display customer list", async ({ page }) => {
    await page.goto("/customers");

    await expect(page.locator("h1, h2").filter({ hasText: /khách hàng|customer/i })).toBeVisible();
    await expect(
      page.locator("table").or(page.locator('[data-testid="customer-list"]')),
    ).toBeVisible();
  });
});
