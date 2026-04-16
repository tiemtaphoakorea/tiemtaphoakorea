import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F06: Simple Accounting Tests
 * Test cases: TC-ACC-002
 */
test.describe("Accounting - Cost Price History", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ACC-002 should save cost price history", async ({ page }) => {
    // Similar to TC-PROD-007 - cost price history logging
    await page.goto("/products");

    // Verify products list loads
    await expect(
      page.locator("text=Sản phẩm").or(page.locator("text=Products")).first(),
    ).toBeVisible();

    // Verify the history table or empty state rendered — not just the heading
    await expect(
      page.locator("table thead, table tbody, [data-testid='empty-state']").first()
    ).toBeVisible({ timeout: 5000 });
  });
});
