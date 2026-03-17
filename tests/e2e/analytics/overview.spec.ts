import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F09: Analytics Dashboard Tests
 * Test cases: ANA-01
 */
test.describe("Analytics - Overview", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ANA-01: Xem trang phân tích (trang load client-side, data gọi API)
  test("TC-ANALYTIC-001 should display analytics overview", async ({ page }) => {
    await page.goto("/analytics");

    // Chờ dữ liệu analytics load xong (skeleton biến mất, nội dung hiện)
    await expect(
      page
        .locator("text=Tổng doanh thu")
        .or(page.locator("text=Doanh thu"))
        .or(page.locator("text=Tổng đơn hàng"))
        .first(),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.locator("h1, h2").filter({ hasText: /phân tích|báo cáo|analytics/i }),
    ).toBeVisible();
    await expect(
      page
        .locator("text=Top")
        .or(page.locator("text=Sản phẩm"))
        .or(page.locator("text=Doanh thu"))
        .first(),
    ).toBeVisible();
  });
});
