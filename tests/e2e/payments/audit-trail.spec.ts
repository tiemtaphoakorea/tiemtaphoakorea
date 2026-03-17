import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  createOrder,
  deleteOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  getOrderDetails,
  recordPayment,
} from "../helpers/api";

/**
 * Payment - Audit Trail
 * Test cases: TC-PAY-004
 */
test.describe
  .serial("Payment - Audit Trail", () => {
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

    test("TC-PAY-004 should keep payment audit trail details", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });

      expect(orderData.success).toBe(true);
      expect(orderData.order).toBeDefined();
      createdOrderIds.push(orderData.order.id);

      await recordPayment(page, orderData.order.id, {
        amount: 50000,
        method: "bank_transfer",
        referenceCode: "REF-123",
      });

      // Verify payment details are recorded
      const updatedOrder = await getOrderDetails(page, orderData.order.id);
      expect(updatedOrder.payments).toHaveLength(1);
      expect(updatedOrder.payments[0].method).toBe("bank_transfer");
      expect(updatedOrder.payments[0].referenceCode).toBe("REF-123");
    });
  });
