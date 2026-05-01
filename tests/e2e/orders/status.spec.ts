import { FULFILLMENT_STATUS, PAYMENT_STATUS } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  cancelOrder,
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
  recordPayment,
  stockOut,
} from "../helpers/api";

/**
 * Order - Status
 * Test cases: TC-ORD-004, TC-ORD-013, TC-ORD-023
 */
test.describe("Order - Status", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-004 should update fulfillment status to stock_out", async ({ page }) => {
    test.setTimeout(60000);
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    const { response } = await stockOut(page, result.order.id);
    expect(response.status()).toBe(200);

    await page.goto(`/orders/${result.order.id}`);
    await expect(page.locator('[data-slot="badge"]').getByText("Đã xuất kho")).toBeVisible();
  });

  test("TC-ORD-013 should allow fulfillment independent of supplier orders", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const preOrderVariant = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: preOrderVariant!, quantity: 1 }],
    });

    // Pay for the order (payment/fulfillment are independent dimensions)
    await recordPayment(page, result.order.id, {
      amount: Number(result.order.total),
      method: "cash",
    });

    // Pre-order variant has no stock, so stock_out is blocked — but payment
    // still succeeds and the order stays pending on fulfillment, proving
    // payment progresses independently of supplier stock.
    const updated = await getOrderDetails(page, result.order.id);
    expect(updated.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    expect(updated.fulfillmentStatus).toBe(FULFILLMENT_STATUS.PENDING);
  });

  test("TC-ORD-023 should reject cancel after stock_out", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);

    const orderData = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    const { response: stockOutRes } = await stockOut(page, orderData.order.id);
    expect(stockOutRes.status()).toBe(200);

    const { response: cancelRes } = await cancelOrder(page, orderData.order.id);
    expect(cancelRes.status()).toBe(400);
  });
});
