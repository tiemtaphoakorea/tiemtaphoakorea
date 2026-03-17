import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";

/**
 * Customer - Search
 * Test cases: TC-CUST-004
 */
test.describe("Customer - Search", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // CUST-03: Tìm kiếm khách hàng
  test("TC-CUST-004 should search customers by name or phone", async ({ page }) => {
    await page.goto("/customers");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill(TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    // Wait for results to update
    await page.waitForTimeout(500);

    // Verify search was applied
    expect(page.url()).toContain("search");
  });
});
