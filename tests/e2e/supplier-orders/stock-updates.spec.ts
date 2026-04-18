import { expect, loginAsAdmin, test } from "../fixtures/auth";
import {
  createSupplierOrder,
  getProductsWithVariants,
  getSupplierOrderDetails,
  updateSupplierOrderStatus,
} from "../helpers/api";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-008, TC-SUP-ORDER-015, TC-SUP-ORDER-019
 */
test.describe("Supplier Orders - Stock Updates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-008 should update stock when receiving in_stock items", async ({ page }) => {
    // Find a product with in_stock variant
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const inStockVariant = products
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.sku && v.stockType === "in_stock");

    // Skip test if no in_stock variant found
    if (!inStockVariant) {
      throw new Error(
        "Precondition failed: no in-stock variant found. Seed the database with at least one product with an in-stock variant.",
      );
    }

    const initialStock = Number(inStockVariant.stockQuantity || 0);
    const quantityToAdd = 5;

    // Create supplier order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: inStockVariant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Receive the order via UI
    await page.goto("/supplier-orders");
    await page
      .getByPlaceholder("Tìm mã đơn, SKU, tên sản phẩm...")
      .fill(String(inStockVariant.sku));
    await page.waitForResponse((response) => {
      const url = response.url();
      return (
        url.includes("/api/admin/supplier-orders") &&
        url.includes(`search=${encodeURIComponent(String(inStockVariant.sku))}`) &&
        response.request().method() === "GET" &&
        response.status() === 200
      );
    });

    // Find and update the specific order we just created
    const targetRow = page.locator("table tbody tr", { hasText: "Chờ xử lý" }).first();
    await expect(targetRow).toBeVisible();

    // Open actions menu and update status
    await targetRow.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Cập nhật trạng thái" }).click();

    await expect(page.getByRole("heading", { name: "Cập nhật trạng thái" })).toBeVisible();
    await page.getByLabel("Đã nhận hàng").click();
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();

    // Wait for success toast
    await expect(page.getByRole("status").getByText("Thành công")).toBeVisible();

    // Verify stock increased via API
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === inStockVariant.id);

    expect(Number(variantAfter?.stockQuantity || 0)).toBe(initialStock + quantityToAdd);
  });

  test("TC-SUP-ORDER-015 should not update stock for pre_order items when received", async ({
    page,
  }) => {
    // Find a product with pre_order variant
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const preOrderVariant = products
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.sku && v.stockType === "pre_order");

    // Skip if no pre_order variant found
    if (!preOrderVariant) {
      throw new Error(
        "Precondition failed: no pre-order variant found. Seed the database with at least one product with a pre-order variant.",
      );
    }

    const initialStock = Number(preOrderVariant.stockQuantity || 0);
    const quantityToAdd = 5;

    // Create supplier order for pre_order variant
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: preOrderVariant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Receive the order via API
    const patchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(patchResponse.status()).toBe(200);

    // Verify stock did NOT increase (pre_order items don't update stock)
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === preOrderVariant.id);

    expect(Number(variantAfter?.stockQuantity || 0)).toBe(initialStock);

    // Verify order status is received
    const orderDetails = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(orderDetails.status).toBe("received");
  });

  test("TC-SUP-ORDER-019 should handle manual restocking orders", async ({ page }) => {
    // Manual restocking = supplier order without orderItemId
    // This is created via the UI/API directly, not from an order
    const products = await getProductsWithVariants(page);
    expect(products.length).toBeGreaterThan(0);

    const variant =
      products
        .flatMap((p: any) => p.variants || [])
        .find((v: any) => v.sku && v.stockType === "in_stock") ||
      products.flatMap((p: any) => p.variants || [])[0];

    expect(variant?.id).toBeTruthy();

    const initialStock = Number(variant.stockQuantity || 0);
    const quantityToAdd = 10;

    // Create manual supplier order
    const { supplierOrder } = await createSupplierOrder(page, {
      variantId: variant.id,
      quantity: quantityToAdd,
    });

    expect(supplierOrder?.id).toBeTruthy();

    // Verify via API that order has no orderItemId (manual restocking)
    const orderDetails = await getSupplierOrderDetails(page, supplierOrder.id);
    expect(orderDetails.order?.id).toBeFalsy(); // No linked order

    // Receive the order
    const patchResponse = await updateSupplierOrderStatus(page, supplierOrder.id, "received");
    expect(patchResponse.status()).toBe(200);

    // Verify stock increased (manual restocking always updates stock)
    const productsAfter = await getProductsWithVariants(page);
    const variantAfter = productsAfter
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.id === variant.id);

    expect(Number(variantAfter?.stockQuantity || 0)).toBe(initialStock + quantityToAdd);
  });
});
