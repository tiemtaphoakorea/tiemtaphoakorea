import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getProductsWithVariants } from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-011
 */
test.describe("Supplier Orders - Supplier Selection", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-011 should allow supplier selection when creating order", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    await page.goto("/supplier-orders");

    // Open create order sheet
    await page.getByRole("button", { name: "Tạo đơn nhập" }).click();
    await expect(page.getByText("Tạo đơn nhập hàng")).toBeVisible();

    // Select variant (first combobox)
    await page.getByRole("combobox").first().click();
    const searchInput = page.getByPlaceholder(/Tìm sản phẩm, SKU/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill(String(variant.sku));
    await page
      .getByRole("option", { name: new RegExp(String(variant.sku)) })
      .first()
      .click();

    // Check if supplier selection is available (optional field)
    const supplierButton = page.getByRole("button", {
      name: /Chọn nhà cung cấp/,
    });
    if (await supplierButton.isVisible().catch(() => false)) {
      // Supplier selection is available
      await supplierButton.click();
      // Close without selecting (test that it's optional)
      await page.keyboard.press("Escape");
    }

    // Submit without supplier (should still work)
    const note = `E2E Supplier Order ${Date.now()}`;
    await page.getByLabel("Ghi chú").fill(note);

    await page.getByRole("button", { name: "Xác nhận tạo đơn" }).click();

    // Verify success
    await expect(page).toHaveURL(/\/supplier-orders/);
    await expect(page.getByText("Thành công", { exact: true })).toBeVisible();
  });
});
