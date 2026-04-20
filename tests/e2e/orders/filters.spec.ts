import { FULFILLMENT_STATUS } from "@/lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Order - Filters & Pagination
 * Test cases: TC-ORD-007
 */
test.describe("Order - Filters & Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-007 should filter orders by status", async ({ page }) => {
    await page.goto("/orders");
    // Wait for toolbar and open status filter dropdown
    const statusFilterBtn = page.getByRole("button", {
      name: /Tất cả trạng thái/,
    });
    await statusFilterBtn.waitFor({ state: "visible", timeout: 10000 });
    await statusFilterBtn.click();
    // Select "Chờ xử lý" (pending) from dropdown
    await page.getByRole("menuitem", { name: "Chờ xử lý" }).click();
    await expect(page).toHaveURL(new RegExp(`status=${FULFILLMENT_STATUS.PENDING}`));

    // Pagination: when multiple pages exist, go to page 2
    await page.goto("/orders?limit=2");
    const paginationLabel = page.getByText("Trang", { exact: false });
    await paginationLabel.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await paginationLabel.isVisible()) {
      const page2Btn = page.getByRole("button", { name: "2", exact: true });
      if (await page2Btn.isVisible()) {
        await page2Btn.click();
        await expect(page).toHaveURL(/page=2/);
      }
    }
  });
});
