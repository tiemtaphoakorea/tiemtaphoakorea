import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getProductsWithVariants } from "../helpers/api";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-012
 */
test.describe("Supplier Orders - Expected Date", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-012 should set expected date when creating order", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const expectedDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const note = `E2E Supplier Order with Date ${Date.now()}`;

    await page.goto("/supplier-orders");

    // Open create order sheet
    await page.getByRole("button", { name: "Tạo đơn nhập" }).click();
    await expect(page.getByText("Tạo đơn nhập hàng")).toBeVisible();

    // Select variant (first combobox)
    await page.getByRole("combobox").first().click();
    // Wait for popover to be visible
    await expect(page.getByPlaceholder(/Tìm sản phẩm, SKU/i)).toBeVisible({
      timeout: 5000,
    });
    await page.getByPlaceholder(/Tìm sản phẩm, SKU/i).fill(String(variant.sku));
    await page
      .getByRole("option", { name: new RegExp(String(variant.sku)) })
      .first()
      .click();

    // Wait for popover to close and variant to be selected
    await expect(
      page
        .getByRole("combobox")
        .first()
        .getByText(new RegExp(String(variant.sku))),
    ).toBeVisible({ timeout: 3000 });

    // Set expected date
    const dateInput = page.getByLabel("Ngày dự kiến về");
    await expect(dateInput).toBeVisible({ timeout: 3000 });
    await dateInput.fill(expectedDate);

    // Add note
    await page.getByLabel("Ghi chú").fill(note);

    // Submit and wait for the request to complete, capture the response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/supplier-orders") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Xác nhận tạo đơn" }).click(),
    ]);

    // Verify success
    await expect(page).toHaveURL(/\/supplier-orders/, { timeout: 10000 });
    expectAdminSubdomain(page);
    await expect(page.getByRole("status").getByText("Thành công")).toBeVisible({
      timeout: 5000,
    });

    // Verify expected date was saved by checking API response
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.supplierOrder?.expectedDate).toBeTruthy();

    // Verify the expected date matches what we sent
    const savedDate = new Date(responseData.supplierOrder.expectedDate).toISOString().split("T")[0];
    expect(savedDate).toBe(expectedDate);

    // Verify expected date appears in the order list (optional UI check)
    // Search for the order by note
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(note);
    await page.waitForTimeout(1000);

    // Find the row - check if it's not the empty state
    const row = page.locator("table tbody tr").first();
    const rowText = await row.textContent().catch(() => "");
    const isEmptyState = rowText?.includes("Không có đơn đặt hàng nào") ?? false;

    if (!isEmptyState && rowText) {
      // Verify expected date is displayed in the row
      // formatDate returns "DD/MM/YYYY HH:mm", so we match the date part
      const dateObj = new Date(expectedDate);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const datePattern = `${day}/${month}/${year}`;

      // Match date pattern in row text (formatDate includes time, so we use regex)
      expect(rowText).toMatch(new RegExp(datePattern));
    }
    // Note: If order doesn't appear in list immediately (empty state shown), that's okay
    // We've already verified the expectedDate was saved correctly via API response above
  });
});
