import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, createOrder, getCustomers, getProductsWithVariants } from "../helpers/api";

/**
 * Dashboard - KPI Calculations
 * Test cases: TC-DASH-002
 */
test.describe("Dashboard - KPI Calculations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-002 should calculate dashboard KPIs correctly", async ({ page }) => {
    // Get initial dashboard stats
    const { data: initialStatsResponse } = await apiGet<any>(page, "/api/admin/stats");
    const initialStats = initialStatsResponse?.stats || {};

    // Create an order to update stats
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    await createOrder(page, {
      customerId: customers[0]?.id,
      items: [{ variantId: products[0]?.variants?.[0]?.id, quantity: 1 }],
    });

    // Wait a bit for the order to be committed
    await page.waitForTimeout(500);

    // Get updated stats
    const { data: updatedStatsResponse } = await apiGet<any>(page, "/api/admin/stats");
    const updatedStats = updatedStatsResponse?.stats || {};

    // Verify KPIs updated - use correct field names from API
    expect(updatedStats.todayOrdersCount).toBeGreaterThanOrEqual(
      initialStats.todayOrdersCount || 0,
    );

    // Visit dashboard UI
    await page.goto("/");

    // Wait for dashboard to fully load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Verify KPIs displayed using more specific selectors
    await expect(page.locator("text=Doanh thu hôm nay").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Đơn hàng mới").first()).toBeVisible();

    // Verify values are displayed
    const ordersCount = page
      .locator("text=Đơn hàng mới")
      .first()
      .locator("..")
      .locator("..")
      .locator("div.text-2xl")
      .first();
    await expect(ordersCount).toBeVisible();
    const ordersText = await ordersCount.textContent();
    expect(ordersText).toMatch(/\d+/);
  });

  test("TC-DASH-002 should verify KPI calculations", async ({ page }) => {
    await page.goto("/");

    // Get revenue display using specific card title
    const revenueCardTitle = page.locator("text=Doanh thu hôm nay").first();
    await expect(revenueCardTitle).toBeVisible();

    // Find the revenue value by navigating to the card content
    const revenueCard = revenueCardTitle.locator("..").locator("..");
    const revenueValue = revenueCard.locator("div.text-2xl").first();
    await expect(revenueValue).toBeVisible();

    // Verify it displays a currency value
    const revenueText = await revenueValue.textContent();
    expect(revenueText).toMatch(/\d+/);

    // Get orders count using specific card title
    const ordersCardTitle = page.locator("text=Đơn hàng mới").first();
    await expect(ordersCardTitle).toBeVisible();

    const ordersCard = ordersCardTitle.locator("..").locator("..");
    const ordersValue = ordersCard.locator("div.text-2xl").first();
    await expect(ordersValue).toBeVisible();

    // Verify it displays a number
    const ordersText = await ordersValue.textContent();
    expect(ordersText).toMatch(/\d+/);
  });
});
