import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";
import { apiPost, getCustomers } from "../helpers/api";

/**
 * Customer - Order History
 * Test cases: TC-CUST-007
 */
test.describe("Customer - Order History", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    if (customers.length === 0) {
      await apiPost<any>(page, "/api/admin/customers", {
        fullName: TEST_CUSTOMERS.primary.fullName,
        phone: TEST_CUSTOMERS.primary.phone,
        customerType: "retail",
      });
    }
  });

  test("TC-CUST-007 should show customer order history", async ({ page }) => {
    await page.goto("/customers");
    await page.fill('input[placeholder*="Tìm kiếm"]', TEST_CUSTOMERS.primary.phone);
    await page.waitForTimeout(500);

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible();

    // Navigate to customer details by clicking the row
    await row.click();

    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Lịch sử đơn hàng")).toBeVisible();
  });
});
