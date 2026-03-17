import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-013
 */
test.describe("Supplier Orders - Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-013 should show empty state when no orders", async ({ page }) => {
    // Navigate to supplier orders with a search that returns no results
    await page.goto("/supplier-orders");
    await page.waitForTimeout(500);

    // Search for something that doesn't exist
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill("ZZZ-NO-ORDERS-99999");
    await page.waitForTimeout(500);

    // Verify empty state is shown
    await expect(page.getByText("Không có đơn đặt hàng nào")).toBeVisible();
    await expect(page.getByText("Các đơn hàng Pre-order sẽ xuất hiện tại đây")).toBeVisible();

    // Verify truck icon is present in empty state (check for svg with data-icon attribute)
    const emptyStateCell = page
      .locator("table tbody tr td")
      .filter({ hasText: "Không có đơn đặt hàng nào" });
    await expect(emptyStateCell.locator("svg[data-icon='truck']")).toBeVisible();
  });
});
