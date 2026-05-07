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
    await expect(page.getByRole("heading", { name: "Tạo đơn nhập hàng" })).toBeVisible();

    const dialog = page.getByRole("dialog");
    const productSelect = dialog.locator("select");
    await expect(productSelect).toBeEnabled();
    await productSelect.selectOption(String(variant.id));

    // Quantity: keep default (1). Note used for test cleanup
    const note = `E2E Supplier Order ${runId}`;
    await dialog.getByPlaceholder("VD: Đặt gấp cho đơn #123").fill(note);

    // Submit and wait for the request to complete
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/supplier-orders") &&
          response.request().method() === "POST",
      ),
      dialog.getByRole("button", { name: "Tạo đơn" }).click(),
    ]);

    // Wait for sheet to close and navigation
    await expect(page).toHaveURL(/\/supplier-orders/, { timeout: 10000 });
    expectAdminSubdomain(page);

    await expect(page.getByText("Đã tạo đơn nhập")).toBeVisible({
      timeout: 5000,
    });

    // Ensure the new order appears in list (best-effort check via note text)
    await page.getByPlaceholder("Tìm theo SKU, sản phẩm, ghi chú...").fill(note);
    await page.waitForTimeout(500);
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });
});
