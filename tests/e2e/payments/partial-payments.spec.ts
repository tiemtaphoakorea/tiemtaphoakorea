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
 * Payment - Partial Payments
 * Test cases: TC-PAY-001, TC-PAY-006
 */
test.describe
  .serial("Payment - Partial Payments", () => {
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

    test("TC-PAY-001 should record partial payment and update balance", async ({ page }) => {
      // Create an order
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
      const orderTotal = Number(order.total);

      // Make partial payment (50% of total)
      const partialAmount = orderTotal / 2;
      await recordPayment(page, orderId, {
        amount: partialAmount,
        method: "cash",
      });

      // Verify payment was recorded - poll until paidAmount is updated
      const updatedOrder = await getOrderDetails(page, orderId, {
        expectedPaidAmount: partialAmount,
      });
      expect(Number(updatedOrder.paidAmount)).toBe(partialAmount);

      // Make second payment to complete
      await recordPayment(page, orderId, {
        amount: partialAmount,
        method: "bank_transfer",
      });

      // Verify full payment
      const finalOrder = await getOrderDetails(page, orderId);
      expect(Number(finalOrder.paidAmount)).toBe(orderTotal);
      expect(finalOrder.status).toBe("paid");
    });

    test("TC-PAY-006 should update remaining balance after multiple payments", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 2 }],
      });

      expect(orderData.success).toBe(true);
      expect(orderData.order).toBeDefined();
      const orderId = orderData.order.id;
      createdOrderIds.push(orderId);

      const order = await getOrderDetails(page, orderId);
      const orderTotal = Number(order.total);

      // Make three partial payments
      const payment1 = orderTotal * 0.3;
      const payment2 = orderTotal * 0.3;
      const payment3 = orderTotal * 0.4;

      await recordPayment(page, orderId, {
        amount: payment1,
        method: "cash",
      });

      let updatedOrder = await getOrderDetails(page, orderId, {
        expectedPaidAmount: payment1,
      });
      expect(Number(updatedOrder.paidAmount)).toBeCloseTo(payment1, 2);

      await recordPayment(page, orderId, {
        amount: payment2,
        method: "cash",
      });

      updatedOrder = await getOrderDetails(page, orderId, {
        expectedPaidAmount: payment1 + payment2,
      });
      expect(Number(updatedOrder.paidAmount)).toBeCloseTo(payment1 + payment2, 2);

      await recordPayment(page, orderId, {
        amount: payment3,
        method: "cash",
      });

      updatedOrder = await getOrderDetails(page, orderId, {
        expectedPaidAmount: orderTotal,
      });
      expect(Number(updatedOrder.paidAmount)).toBeCloseTo(orderTotal, 2);
      expect(updatedOrder.status).toBe("paid");
    });
  });
