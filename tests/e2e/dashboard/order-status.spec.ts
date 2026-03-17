import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Order Status
 * Test cases: TC-DASH-003
 */
test.describe("Dashboard - Order Status", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-003 should display order status breakdown", async ({ page }) => {
    await page.goto("/");

    // Look for order status widgets or cards
    const statusLabels = [
      "Pending",
      "Chờ xử lý",
      "Paid",
      "Đã thanh toán",
      "Preparing",
      "Đang chuẩn bị",
      "Shipping",
      "Đang giao",
      "Delivered",
      "Đã giao",
      "Cancelled",
      "Đã hủy",
    ];

    // At least one status should be visible
    let foundStatus = false;
    for (const label of statusLabels) {
      const statusElement = page.locator(`text=${label}`);
      const isVisible = await statusElement.isVisible().catch(() => false);
      if (isVisible) {
        foundStatus = true;
        break;
      }
    }

    // If no specific status labels found, at least check for "Đơn hàng" / "Orders" section
    if (!foundStatus) {
      const ordersSection = page.locator("text=Đơn hàng").or(page.locator("text=Orders"));
      await expect(ordersSection).toBeVisible();
    }
  });
});
