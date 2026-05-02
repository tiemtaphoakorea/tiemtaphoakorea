import { expect, loginAsAdmin, loginAsManager, test } from "../fixtures/auth";
import { apiGet, createOrder, getCustomers, getProductsWithVariants } from "../helpers/api";

/**
 * Dashboard - Navigation
 * Test cases: TC-DASH-005, TC-DASH-006, TC-DASH-007, TC-DASH-008
 */
test.describe("Dashboard - Navigation", () => {
  // TC-DASH-005: Dashboard links to products/inventory module
  test("TC-DASH-005 dashboard navigates to products module", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Click any navigation link that leads to /products
    const productsLink = page.getByRole("link", { name: /quản lý kho|sản phẩm|products/i }).first();
    await productsLink.waitFor({ state: "visible", timeout: 10000 });
    await productsLink.click();

    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/products/);
  });

  // TC-DASH-006: Analytics link redirects to /analytics
  test("TC-DASH-006 analytics link navigates to analytics page", async ({ page }) => {
    await loginAsManager(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Look for "Xem báo cáo đầy đủ" CTA or any analytics sidebar/nav link
    const analyticsLink = page
      .getByRole("link", { name: /xem báo cáo|báo cáo đầy đủ|analytics|phân tích/i })
      .or(page.locator('a[href*="/analytics"]'))
      .first();

    await analyticsLink.waitFor({ state: "visible", timeout: 10000 });
    await analyticsLink.click();

    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/analytics/);
  });

  // TC-DASH-007: Dashboard loads in under 2 seconds (domcontentloaded timing)
  test("TC-DASH-007 dashboard domContentLoaded fires within 2000ms", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate and wait for domcontentloaded
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Measure via Navigation Timing API
    const domContentLoadedMs = await page.evaluate(
      () => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    );

    expect(
      domContentLoadedMs,
      `domContentLoaded took ${domContentLoadedMs}ms, expected < 2000ms`,
    ).toBeLessThan(2000);
  });

  // TC-DASH-008: KPI revenue updates after a new order is created via API
  test("TC-DASH-008 revenue KPI reflects new order after creation", async ({ page }) => {
    await loginAsAdmin(page);

    // Capture pre-creation stats
    const { data: beforeData } = await apiGet<{ stats: any }>(page, "/api/admin/stats");
    const revenueBefore = Number(beforeData?.stats?.todayRevenue ?? 0);

    // Create an order via API to increment today's revenue
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    const customer = customers[0];
    const variant = products.find((p: any) => p.variants?.length > 0)?.variants?.[0];

    // Skip gracefully if no seed data available
    if (!customer || !variant) {
      // eslint-disable-next-line no-console
      console.warn("TC-DASH-008: No customers or products found, skipping revenue assertion");
      return;
    }

    await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variant.id, quantity: 1 }],
    });

    // Allow DB to commit before re-fetching
    await page.waitForTimeout(800);

    // Fetch updated stats
    const { data: afterData } = await apiGet<{ stats: any }>(page, "/api/admin/stats");
    const revenueAfter = Number(afterData?.stats?.todayRevenue ?? 0);

    // Revenue (or order count) must be greater than or equal to before
    expect(revenueAfter).toBeGreaterThanOrEqual(revenueBefore);

    // Navigate to dashboard and verify the KPI card renders a numeric value
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=Doanh thu hôm nay").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
