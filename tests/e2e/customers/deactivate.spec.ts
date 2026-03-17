import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";

/**
 * Customer - Deactivate
 * Test cases: TC-CUST-006
 */
test.describe("Customer - Deactivate", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // CUST-05: Vô hiệu hóa khách hàng
  test("TC-CUST-006 should deactivate customer", async ({ page }) => {
    await page.goto("/customers");
    await page.fill('input[placeholder*="Tìm"]', TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    // Click first customer
    await page.locator("table tbody tr").first().click();

    // Find deactivate toggle or button
    const deactivateBtn = page.locator(
      'button:has-text("Vô hiệu"), button:has-text("Deactivate"), [data-testid="toggle-status"]',
    );
    if (await deactivateBtn.isVisible()) {
      await deactivateBtn.click();

      await expect(
        page.locator("text=đã vô hiệu").or(page.locator("text=deactivated")),
      ).toBeVisible({ timeout: 10000 });
      // Toggle back to avoid impacting other tests
      await deactivateBtn.click();
    }
  });
});
