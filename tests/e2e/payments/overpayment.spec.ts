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
 * Payment - Overpayment
 * Test cases: TC-PAY-005
 */
test.describe
  .serial("Payment - Overpayment", () => {
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

    test("TC-PAY-005 should prevent overpayment", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });

      expect(orderData.success).toBe(true);
      expect(orderData.order).toBeDefined();
      createdOrderIds.push(orderData.order.id);

      const orderPayload = await getOrderDetails(page, orderData.order.id);
      const total = Number(orderPayload.total || 0);

      const { response } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: total + 1000, method: "cash" },
      );
      expect(response.status()).toBe(400);

      const afterPayload = await getOrderDetails(page, orderData.order.id);
      expect(Number(afterPayload.paidAmount || 0)).toBe(0);
    });
  });
