import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  cancelOrder,
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
  recordPayment,
} from "../helpers/api";

/**
 * Order - Payment
 * Test cases: TC-ORD-006, TC-ORD-022, TC-ORD-024
 */
test.describe("Order - Payment", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-006 should derive payment status", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await recordPayment(page, result.order.id, {
      amount: Number(result.order.total),
      method: "cash",
    });

    await page.goto("/orders");
    await page.fill('input[placeholder*="Tìm mã đơn hàng"]', result.order.orderNumber);
    await page.waitForTimeout(500);
    await page.locator("table tbody tr").first().click();
    await expect(page.locator("text=Đã thanh toán")).toBeVisible();
  });

  test("TC-ORD-022 should keep payment history on cancel paid order", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await recordPayment(page, result.order.id, {
      amount: Number(result.order.total),
      method: "cash",
    });
    const { response: cancelRes } = await cancelOrder(page, result.order.id);
    expect(cancelRes.status()).toBe(200);

    const updated = await getOrderDetails(page, result.order.id);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.CANCELLED);
    expect(updated.payments?.length || 0).toBeGreaterThan(0);
  });

  test("TC-ORD-024 should derive payment status by paid amount", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    await recordPayment(page, result.order.id, {
      amount: Number(result.order.total),
      method: "cash",
    });

    const updated = await getOrderDetails(page, result.order.id);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(Number(updated.paidAmount)).toBe(Number(updated.total));
  });
});
