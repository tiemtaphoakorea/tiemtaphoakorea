import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import { createOrder, findVariantIdBySku, getCustomerByPhone, recordPayment } from "../helpers/api";

/**
 * Order - Detail View
 * Test cases: TC-ORD-009 (UI section visibility)
 *
 * NOTE: edit-restrictions.spec.ts covers TC-ORD-009 for edit-restriction behaviour.
 * This spec covers the visible sections on the order detail page.
 */
test.describe("Order - Detail View", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-009 should display all key sections on order detail page", async ({ page }) => {
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

    // Record a payment so the payment history section renders
    await recordPayment(page, result.order.id, {
      amount: Math.ceil(Number(result.order.total) / 2),
      method: "cash",
    });

    await page.goto(`/orders/${result.order.id}`);
    await page.waitForLoadState("networkidle");

    // Order number in header
    await expect(page.getByText(result.order.orderNumber)).toBeVisible({ timeout: 10000 });

    // Items section — "Chi tiết sản phẩm"
    await expect(page.getByRole("heading", { name: /Chi tiết sản phẩm/i })).toBeVisible();

    // Items table has at least one row
    const itemsTable = page.locator("table").first();
    await expect(itemsTable.locator("tbody tr")).toHaveCount(1);

    // Customer info section — "Khách hàng"
    await expect(page.getByRole("heading", { name: /Khách hàng/i })).toBeVisible();
    await expect(page.getByText(TEST_CUSTOMERS.primary.fullName)).toBeVisible();

    // Payment history section — "Lịch sử thanh toán" (visible because we recorded a payment)
    await expect(page.getByRole("heading", { name: /Lịch sử thanh toán/i })).toBeVisible();

    // Status history / timeline section — "Lịch sử trạng thái"
    await expect(page.getByRole("heading", { name: /Lịch sử trạng thái/i })).toBeVisible();
  });
});
