import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Order - Fulfillment Status Filters
 * Test cases: TC-ORD-027, TC-ORD-028, TC-ORD-029
 *
 * SPEC NOTE: The task requested "Confirmed / Delivered" statuses but this codebase
 * defines FULFILLMENT_STATUS = { pending, stock_out, completed, cancelled }.
 * Tests are mapped to actual statuses:
 *   TC-ORD-027 → "Chờ xử lý"   (pending)     — as specified
 *   TC-ORD-028 → "Đã xuất kho" (stock_out)   — closest to "Confirmed" (order confirmed → stock dispatched)
 *   TC-ORD-029 → "Hoàn tất"    (completed)   — closest to "Delivered" (order fully completed)
 *
 * Fulfillment filter button label: "Tất cả xử lý" when no filter selected.
 * URL param: fulfillmentStatus=<value> | deleted when "All"
 *
 * filters.spec.ts already covers TC-ORD-007 (pending via status filter button).
 * These tests cover the remaining fulfillment filter values via the second dropdown.
 */
test.describe("Order - Fulfillment Status Filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
  });

  test("TC-ORD-027 should filter to pending fulfillment orders", async ({ page }) => {
    // The fulfillment dropdown trigger shows "Tất cả xử lý" by default
    const fulfillmentFilterBtn = page.getByRole("button", { name: /Tất cả xử lý/ });
    await fulfillmentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await fulfillmentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Chờ xử lý" }).click();

    await expect(page).toHaveURL(/fulfillmentStatus=pending/, { timeout: 5000 });

    // Spot-check visible rows: all must show the "Chờ xử lý" fulfillment badge
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText("Chờ xử lý")).toBeVisible();
      }
    }
  });

  test("TC-ORD-028 should filter to stock_out fulfillment orders", async ({ page }) => {
    const fulfillmentFilterBtn = page.getByRole("button", { name: /Tất cả xử lý/ });
    await fulfillmentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await fulfillmentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Đã xuất kho" }).click();

    await expect(page).toHaveURL(/fulfillmentStatus=stock_out/, { timeout: 5000 });

    // Spot-check visible rows
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText("Đã xuất kho")).toBeVisible();
      }
    }
  });

  test("TC-ORD-029 should filter to completed fulfillment orders", async ({ page }) => {
    const fulfillmentFilterBtn = page.getByRole("button", { name: /Tất cả xử lý/ });
    await fulfillmentFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await fulfillmentFilterBtn.click();

    await page.getByRole("menuitem", { name: "Hoàn tất" }).click();

    await expect(page).toHaveURL(/fulfillmentStatus=completed/, { timeout: 5000 });

    // Spot-check visible rows
    await page.waitForLoadState("networkidle");
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await expect(rows.nth(i).getByText("Hoàn tất")).toBeVisible();
      }
    }
  });
});
