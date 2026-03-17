import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS } from "../fixtures/data";
import { apiPost, getCustomerDetails, getCustomers } from "../helpers/api";

/**
 * Customer - Stats
 * Test cases: TC-CUST-009
 */
test.describe("Customer - Stats", () => {
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

  test("TC-CUST-009 should compute customer stats", async ({ page }) => {
    const customers = await getCustomers(page, TEST_CUSTOMERS.primary.phone);
    const customer = customers[0];
    expect(customer?.id).toBeTruthy();

    const detail = await getCustomerDetails(page, customer.id);
    const totalSpent = (detail.orders || []).reduce(
      (acc: number, order: any) => acc + Number(order.total || 0),
      0,
    );
    const orderCount = detail.orders?.length || 0;

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(val);

    await page.goto(`/customers/${customer.id}`);
    await expect(page.locator("text=Thống kê tài chính")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page
        .locator("text=Tổng chi tiêu")
        .locator("..")
        .locator("div")
        .filter({ hasText: formatCurrency(totalSpent) })
        .first(),
    ).toBeVisible();
    await expect(
      page
        .locator("text=Số đơn hàng")
        .locator("..")
        .locator("div")
        .filter({ hasText: orderCount.toString() })
        .first(),
    ).toBeVisible();
  });
});
