import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { cleanupTestSupplierOrders, getProductsWithVariants } from "../helpers/api";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-001
 */
test.describe("Supplier Orders - Create", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-SUP-ORDER-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSupplierOrders(page, runId);
  });

  test("TC-SUP-ORDER-001 should create supplier order", async ({ page }) => {
    // Use API to find any existing product variant we can order
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    await page.goto("/supplier-orders");

    // Open "Tạo đơn nhập" sheet
    await page.getByRole("button", { name: "Tạo đơn nhập" }).click();
    await expect(page.getByText("Tạo đơn nhập hàng")).toBeVisible();

    // Select variant via SKU search in combobox (first combobox in the sheet)
    await page.getByRole("combobox").first().click();
    // Wait for popover to be visible
    await expect(page.getByPlaceholder(/Tìm sản phẩm, SKU/i)).toBeVisible({
      timeout: 5000,
    });
    await page.getByPlaceholder(/Tìm sản phẩm, SKU/i).fill(String(variant.sku));
    // Choose first matching option
    await page
      .getByRole("option", { name: new RegExp(String(variant.sku)) })
      .first()
      .click();

    // Wait for popover to close and variant to be selected
    // Verify variant is selected by checking the combobox shows the variant
    await expect(
      page
        .getByRole("combobox")
        .first()
        .getByText(new RegExp(String(variant.sku))),
    ).toBeVisible({ timeout: 3000 });

    // Quantity: keep default (1). Note used for test cleanup
    const note = `E2E Supplier Order ${runId}`;
    await page.getByLabel("Ghi chú").fill(note);

    // Check for any validation errors before submitting
    const errorMessages = page.locator("text=/Vui lòng|Lỗi|error/i");
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      const errors = await errorMessages.allTextContents();
      throw new Error(`Form validation errors: ${errors.join(", ")}`);
    }

    // Submit and wait for the request to complete
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/supplier-orders") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Xác nhận tạo đơn" }).click(),
    ]);

    // Wait for sheet to close and navigation
    await expect(page).toHaveURL(/\/supplier-orders/, { timeout: 10000 });
    expectAdminSubdomain(page);

    // Wait for success toast - check for the toast title "Thành công"
    await expect(page.getByRole("status").getByText("Thành công")).toBeVisible({
      timeout: 5000,
    });

    // Ensure the new order appears in list (best-effort check via note text)
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(note);
    await page.waitForTimeout(500);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });
});
