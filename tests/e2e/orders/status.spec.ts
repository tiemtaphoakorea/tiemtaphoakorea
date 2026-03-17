import { ORDER_STATUS } from "@/lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
  recordPayment,
  updateOrderStatus,
} from "../helpers/api";

/**
 * Order - Status
 * Test cases: TC-ORD-004, TC-ORD-013, TC-ORD-023
 */
test.describe("Order - Status", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-004 should update order status", async ({ page }) => {
    test.setTimeout(60000);
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    const statusRes = await updateOrderStatus(page, result.order.id, ORDER_STATUS.PREPARING);
    expect(statusRes.status()).toBe(200);

    await page.goto(`/orders/${result.order.id}`);
    await expect(page.locator('[data-slot="badge"]').getByText("Đang đóng gói")).toBeVisible();
  });

  test("TC-ORD-013 should allow delivery independent of supplier orders", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const preOrderVariant = await findVariantIdBySku(page, TEST_PRODUCTS.preorder.sku);

    const result = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: preOrderVariant!, quantity: 1 }],
    });

    // Pay for the order (new flow: pending → paid → delivered)
    await recordPayment(page, result.order.id, {
      amount: Number(result.order.total),
      method: "cash",
    });

    // Order status flow should be independent of supplier orders:
    // after payment, marking the order as delivered should succeed
    const deliveredRes = await updateOrderStatus(page, result.order.id, ORDER_STATUS.DELIVERED);
    expect(deliveredRes.ok()).toBe(true);

    const updated = await getOrderDetails(page, result.order.id);
    expect(updated.status).toBe(ORDER_STATUS.DELIVERED);
  });

  test("TC-ORD-023 should reject cancel after shipping", async ({ page }) => {
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);

    const orderData = await createOrder(page, {
      customerId: customer.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });

    // Move to preparing
    await updateOrderStatus(page, orderData.order?.id, ORDER_STATUS.PREPARING);

    // Move to shipping
    await updateOrderStatus(page, orderData.order?.id, ORDER_STATUS.SHIPPING);

    // Try to cancel
    const cancelRes = await updateOrderStatus(page, orderData.order?.id, ORDER_STATUS.CANCELLED);

    // Should reject cancel after shipping
    expect(cancelRes.status()).toBe(500);
  });
});
