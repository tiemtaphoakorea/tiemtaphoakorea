import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-002, TC-SUP-ORDER-003, TC-SUP-ORDER-004
 */
test.describe("Supplier Orders - Status Update", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-002 should receive stock", async ({ page }) => {
    // Create a pending supplier order via API so the UI test is deterministic
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Open supplier orders list filtered by this SKU so we can easily find the row
    await page.goto("/supplier-orders");
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(String(variant.sku));

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 5000 });

    // Open actions menu -> "Cập nhật trạng thái"
    await row.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Cập nhật trạng thái" }).click();

    // In dialog, change status to "Đã nhận hàng"
    await expect(page.getByRole("heading", { name: "Cập nhật trạng thái" })).toBeVisible();
    await page.getByLabel("Đã nhận hàng").click();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();

    // Toast + row badge should reflect "Đã nhận hàng"
    await expect(page.locator("table tbody tr").first().getByText("Đã nhận hàng")).toBeVisible();

    // Double-check via API that status is actually "received"
    const updated = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(updated.status).toBe("received");
    expect(updated.receivedAt).toBeTruthy();
  });

  test("TC-SUP-ORDER-003 should transition status to ordered with orderedAt timestamp", async ({
    page,
  }) => {
    // Create a pending supplier order via API
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Open supplier orders list and find the row
    await page.goto("/supplier-orders");
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(String(variant.sku));

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 5000 });

    // Open actions menu -> "Cập nhật trạng thái"
    await row.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Cập nhật trạng thái" }).click();

    // Change status to "Đã đặt hàng"
    await expect(page.getByRole("heading", { name: "Cập nhật trạng thái" })).toBeVisible();
    await page.getByLabel("Đã đặt hàng").click();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();

    // Verify UI update
    await expect(page.locator("table tbody tr").first().getByText("Đã đặt hàng")).toBeVisible();

    // Verify via API that status is "ordered" and orderedAt is set
    const updated = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(updated.status).toBe("ordered");
    expect(updated.orderedAt).toBeTruthy();
  });

  test("TC-SUP-ORDER-004 should transition status to cancelled", async ({ page }) => {
    // Ensure we have at least one product variant to create a supplier order for
    const products = await getProductsWithVariants(page);
    if (products.length === 0) {
      throw new Error(
        "Precondition failed: no products found. Seed the database with at least one product with variants before running E2E tests.",
      );
    }

    const variant =
      products.flatMap((p: any) => p.variants || []).find((v: any) => v.sku) ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: 1,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Open supplier orders list and find the row
    await page.goto("/supplier-orders");
    await page.getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...").fill(String(variant.sku));

    const row = page.locator("table tbody tr").first();
    await expect(row).toBeVisible({ timeout: 5000 });

    // Open actions menu -> "Cập nhật trạng thái"
    await row.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Cập nhật trạng thái" }).click();

    // Change status to "Đã hủy"
    await expect(page.getByRole("heading", { name: "Cập nhật trạng thái" })).toBeVisible();
    await page.getByLabel("Đã hủy").click();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();

    // Wait for dialog to close (indicates mutation completed)
    await expect(page.getByRole("heading", { name: "Cập nhật trạng thái" })).not.toBeVisible();

    // Verify UI update
    await expect(page.locator("table tbody tr").first().getByText("Đã hủy")).toBeVisible();

    // Verify via API that status is "cancelled"
    const updated = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(updated.status).toBe("cancelled");
  });
});
