import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Order - Payment Status Filters
 * Test cases: TC-ORD-004, TC-ORD-005, TC-ORD-006, TC-ORD-008
 *
 * NOTE: TC-ORD-004/005/006 reuse IDs that exist in status.spec.ts / stock.spec.ts / payment.spec.ts
 * for different scenarios (API-level). These tests cover UI filter interactions.
 *
 * Payment filter button label: "Tất cả thanh toán" when no filter selected.
 * URL param written by the toolbar: paymentStatus=<value> | deleted when "All"
 * Debt filter: toggle button "Công nợ" → sets debtOnly=true in URL.
 */
test.describe("Order - Payment Status Filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
  });

  test("TC-ORD-004 should show all orders when All payment filter is selected", async ({
    page,
  }) => {
    // Open payment filter dropdown and select "Tất cả"
    const paymentFilterBtn = page.getByRole("button", { name: /Tất cả thanh toán/ });
    await paymentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await paymentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Tất cả" }).click();

    // URL should NOT have paymentStatus param (toolbar deletes it for "All")
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).not.toMatch(/paymentStatus=/);
  });

  test("TC-ORD-005 should filter to unpaid orders when Chưa thanh toán is selected", async ({
    page,
  }) => {
    const paymentFilterBtn = page.getByRole("button", { name: /Tất cả thanh toán/ });
    await paymentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await paymentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Chưa thanh toán" }).click();

    await expect(page).toHaveURL(/paymentStatus=unpaid/, { timeout: 5000 });

    // If any rows are visible they must all be unpaid (badge text "Chưa thanh toán")
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Each row's status cell should contain the unpaid badge
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText("Chưa thanh toán")).toBeVisible();
      }
    }
  });

  test("TC-ORD-006 should filter to paid orders when Đã thanh toán is selected", async ({
    page,
  }) => {
    const paymentFilterBtn = page.getByRole("button", { name: /Tất cả thanh toán/ });
    await paymentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await paymentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Đã thanh toán" }).click();

    await expect(page).toHaveURL(/paymentStatus=paid/, { timeout: 5000 });

    // If any rows are visible they must all be paid
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText("Đã thanh toán")).toBeVisible();
      }
    }
  });

  test("TC-ORD-008 should filter to debt orders when Công nợ toggle is active", async ({
    page,
  }) => {
    const debtBtn = page.getByRole("button", { name: /Công nợ/ });
    await debtBtn.waitFor({ state: "visible", timeout: 10000 });
    await debtBtn.click();

    // URL should reflect debtOnly=true
    await expect(page).toHaveURL(/debtOnly=true/, { timeout: 5000 });

    // Toggle off resets the param
    await debtBtn.click();
    await page.waitForTimeout(300);
    const url = page.url();
    expect(url).not.toMatch(/debtOnly=true/);
  });
});
