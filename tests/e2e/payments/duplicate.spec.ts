import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  deleteOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
} from "../helpers/api";

/**
 * Payment - Duplicate Prevention
 * Test cases: TC-PAY-010
 */
test.describe
  .serial("Payment - Duplicate Prevention", () => {
    const createdOrderIds: string[] = [];

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test.afterEach(async ({ page }) => {
      for (const orderId of createdOrderIds) {
        try {
          await deleteOrder(page, orderId);
        } catch (_error) {}
      }
      createdOrderIds.length = 0;
    });

    test("TC-PAY-010 should prevent duplicate payment submission", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });

      expect(orderData.success).toBe(true);
      expect(orderData.order).toBeDefined();
      const orderId = orderData.order.id;
      createdOrderIds.push(orderId);

      const order = await getOrderDetails(page, orderId);
      const idempotencyKey = `payment-${Date.now()}`;

      // Submit payment twice with same idempotency key
      await Promise.all([
        apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
          amount: order.total,
          method: "cash",
          clientToken: idempotencyKey,
        }),
        apiPost<any>(page, `/api/admin/orders/${orderId}/payments`, {
          amount: order.total,
          method: "cash",
          clientToken: idempotencyKey,
        }),
      ]);

      // Both should succeed but only one payment should be recorded
      const finalOrder = await getOrderDetails(page, orderId);
      expect(Number(finalOrder.paidAmount)).toBe(Number(order.total));

      // Should not be double-charged
      expect(Number(finalOrder.paidAmount)).not.toBeGreaterThan(Number(order.total));
    });
  });
