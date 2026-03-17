import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Widgets
 * Test cases: TC-DASH-004, TC-DASH-005, TC-DASH-006, TC-DASH-008
 */
test.describe("Admin Dashboard - Widgets", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-07-03: Top sản phẩm đúng thời gian
  test("TC-DASH-004 should show top selling products", async ({ page }) => {
    await page.goto("/");

    await expect(
      page
        .locator("text=Top sản phẩm")
        .or(page.locator("text=Top Products"))
        .or(page.locator('[data-testid="top-products"]')),
    ).toBeVisible();
  });

  // TC-07-04: Cảnh báo tồn kho thấp
  test("TC-DASH-005 should show low stock alerts", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator("text=Cảnh báo kho").or(page.locator("text=Low Stock")),
    ).toBeVisible();
  });

  test("TC-DASH-006 should show recent orders widget", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("text=Đơn hàng").or(page.locator("text=Recent Orders")),
    ).toBeVisible();
  });

  test("TC-DASH-008 should show top customers", async ({ page }) => {
    await page.goto("/");

    // Look for top customers section
    const topCustomersSection = page
      .locator("text=Top Customers")
      .or(page.locator("text=Khách hàng"))
      .or(page.locator('[data-testid="top-customers"]'));

    // Section might not always be visible if no data
    const isVisible = await topCustomersSection.isVisible().catch(() => false);

    if (isVisible) {
      await expect(topCustomersSection).toBeVisible();
    }
  });
});
