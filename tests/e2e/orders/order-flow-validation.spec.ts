import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getCustomers,
  getProductsWithVariants,
} from "../helpers/api";

/**
 * Order - Flow & UI Validation
 * Test cases: TC-ORD-017, TC-ORD-019, TC-ORD-020, TC-ORD-022, TC-ORD-023,
 *             TC-ORD-024, TC-ORD-025, TC-ORD-026
 *
 * SPEC NOTES (deviations from original spec due to actual implementation):
 *
 * TC-ORD-017 "Cannot skip status (Pending→Delivered)":
 *   The UI exposes direct action buttons (Xuất kho / Hủy đơn / Hoàn tất đơn),
 *   not a status dropdown. There is no "Delivered/Shipped/Confirmed" state.
 *   Test verifies: a PENDING order shows "Xuất kho" and "Hủy đơn" buttons but
 *   NOT "Hoàn tất đơn" (the terminal action only appears after stock_out + paid).
 *
 * TC-ORD-019 "Cancel order – dismiss confirm dialog":
 *   Cancel uses a native browser confirm() dialog, not a React Dialog component.
 *   Test dismisses it via page.on('dialog', d => d.dismiss()) and confirms the
 *   order fulfillment status remains "pending".
 *
 * TC-ORD-020 "Order stats widget":
 *   OrderStats renders: "Tổng đơn hàng", "Chờ xử lý", "Hoàn thành", "Tổng doanh thu".
 *   (NOT "Avg Order Value" as the spec description states — spec was inaccurate.)
 *
 * TC-ORD-022 "Pagination controls exist":
 *   Checks that pagination controls render on /orders. The DataTable renders
 *   pagination whenever totalPages > 0.
 *
 * TC-ORD-023 "Create order without customer → API error":
 *   The creation form at /orders/new requires customer selection.
 *   Test verifies the API rejects the request (400) when customerId is missing.
 *   UI-level: the "Tạo đơn hàng" button remains disabled until a customer is chosen.
 *
 * TC-ORD-024 "Create order with no items → API error":
 *   Verifies the API rejects orders with empty items array.
 *
 * TC-ORD-025 "Record payment amount = 0 → UI prevents submission":
 *   The PaymentDialog submit handler guards `if (paymentState.amount <= 0) return;`
 *   so clicking "Lưu thanh toán" with 0 does nothing (no API call made).
 *   Test opens the dialog, clears the amount, submits, and verifies the dialog
 *   stays open (no toast / navigation away).
 *
 * TC-ORD-026 "Order item quantity = 0 → API rejects":
 *   There is no separate UI quantity field on the create form for this scenario;
 *   the API-level guard is the enforcement point.
 *   edit-restrictions.spec.ts already covers the UI item-table having no editable
 *   fields once an order is submitted.
 *   This test validates the API guard directly (mirrors validation.spec.ts TC-ORD-026
 *   with explicit 400 check on quantity:0).
 */
test.describe("Order - Flow & UI Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-017 — Pending order only shows progression buttons, not terminal ones
  // ---------------------------------------------------------------------------
  test("TC-ORD-017 should show only valid actions for a pending order", async ({ page }) => {
    test.setTimeout(60000);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result.success).toBe(true);

    await page.goto(`/orders/${result.order.id}`);
    await page.waitForLoadState("networkidle");

    // "Xuất kho" and "Hủy đơn" must be visible for a pending order
    await expect(page.getByRole("button", { name: "Xuất kho" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Hủy đơn" })).toBeVisible();

    // "Hoàn tất đơn" must NOT be visible (only appears after stock_out + paid)
    await expect(page.getByRole("button", { name: "Hoàn tất đơn" })).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-019 — Cancel dialog dismissed: order stays as-is
  // ---------------------------------------------------------------------------
  test("TC-ORD-019 should not cancel order when confirm dialog is dismissed", async ({ page }) => {
    test.setTimeout(60000);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result.success).toBe(true);

    await page.goto(`/orders/${result.order.id}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Hủy đơn" })).toBeVisible({ timeout: 10000 });

    // Intercept the native confirm dialog and dismiss it
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Hủy đơn" }).click();

    // Page must remain on the same order detail URL
    await expect(page).toHaveURL(new RegExp(`/orders/${result.order.id}$`));

    // "Hủy đơn" button still visible → order not cancelled
    await expect(page.getByRole("button", { name: "Hủy đơn" })).toBeVisible();

    // "Đã hủy" badge must NOT appear
    await expect(page.getByText("Đã hủy")).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-020 — OrderStats widget presence on /orders
  // ---------------------------------------------------------------------------
  test("TC-ORD-020 should display order stats widget on orders list page", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    // OrderStats renders four cards with these headings
    await expect(page.getByRole("heading", { name: /Tổng đơn hàng/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("heading", { name: /Chờ xử lý/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Hoàn thành/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tổng doanh thu/i }).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-022 — Pagination controls visible on orders list
  // ---------------------------------------------------------------------------
  test("TC-ORD-022 should show pagination controls on orders list", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");

    // DataTable always renders pagination row; look for previous/next buttons or page indicator
    // The DataTable component renders buttons with aria labels or role="button" for navigation.
    // Use a loose selector that matches either pattern.
    const paginationArea = page
      .locator('[aria-label="pagination"], nav[aria-label], .pagination, [data-slot="pagination"]')
      .first();

    // Fallback: previous/next navigation buttons rendered by DataTable
    const prevBtn = page.getByRole("button", { name: /previous|prev|trước/i });
    const nextBtn = page.getByRole("button", { name: /next|sau/i });

    const paginationVisible =
      (await paginationArea.isVisible().catch(() => false)) ||
      (await prevBtn.isVisible().catch(() => false)) ||
      (await nextBtn.isVisible().catch(() => false));

    expect(paginationVisible).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-023 — Create order without customer → API returns 400
  // ---------------------------------------------------------------------------
  test("TC-ORD-023 should reject order creation without a customer", async ({ page }) => {
    const products = await getProductsWithVariants(page);
    const variantId = products[0]?.variants?.[0]?.id;
    expect(variantId).toBeTruthy();

    const { response } = await apiPost<any>(page, "/api/admin/orders", {
      items: [{ variantId, quantity: 1 }],
      // customerId intentionally omitted
    });

    expect(response.ok()).toBe(false);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-024 — Create order with no items → API returns 400
  // ---------------------------------------------------------------------------
  test("TC-ORD-024 should reject order creation with no items", async ({ page }) => {
    const customers = await getCustomers(page);
    expect(customers.length).toBeGreaterThan(0);

    const { response } = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customers[0].id,
      // items intentionally omitted / empty
      items: [],
    });

    expect(response.ok()).toBe(false);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-025 — Record payment amount = 0: dialog stays open (UI guard)
  // ---------------------------------------------------------------------------
  test("TC-ORD-025 should keep payment dialog open when amount is zero", async ({ page }) => {
    test.setTimeout(60000);

    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(result.success).toBe(true);

    await page.goto(`/orders/${result.order.id}`);
    await page.waitForLoadState("networkidle");

    // Open the payment dialog via the "Thanh toán" button (visible on pending + unpaid)
    const paymentBtn = page.getByRole("button", { name: "Thanh toán" });
    await paymentBtn.waitFor({ state: "visible", timeout: 10000 });
    await paymentBtn.click();

    // Wait for dialog to open
    const dialogTitle = page.getByRole("heading", { name: "Ghi nhận thanh toán" });
    await dialogTitle.waitFor({ state: "visible", timeout: 5000 });

    // Clear the amount field — NumberInput renders an <input type="text"> inside
    const amountInput = page.locator('input[inputmode="numeric"], input[type="text"]').first();
    await amountInput.fill("0");

    // Attempt to save
    await page.getByRole("button", { name: "Lưu thanh toán" }).click();

    // Dialog must still be open (handler returns early on amount <= 0)
    await expect(dialogTitle).toBeVisible({ timeout: 2000 });

    // No success toast should have appeared
    await expect(page.getByText("Đã ghi nhận thanh toán")).not.toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // TC-ORD-026 — Order item quantity = 0: API rejects with 400
  // ---------------------------------------------------------------------------
  test("TC-ORD-026 should reject order creation with item quantity zero", async ({ page }) => {
    const customers = await getCustomers(page);
    const products = await getProductsWithVariants(page);
    expect(customers.length).toBeGreaterThan(0);
    expect(products[0]?.variants?.[0]?.id).toBeTruthy();

    const { response } = await apiPost<any>(page, "/api/admin/orders", {
      customerId: customers[0].id,
      items: [{ variantId: products[0].variants[0].id, quantity: 0 }],
    });

    expect(response.ok()).toBe(false);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
