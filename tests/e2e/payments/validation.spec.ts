import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiPost,
  createOrder,
  deleteOrder,
  findVariantIdBySku,
  getCustomerByPhone,
} from "../helpers/api";

/**
 * Payment - Validation
 * Test cases: TC-PAY-002, TC-PAY-003, TC-PAY-007, TC-PAY-008, TC-PAY-009
 */
test.describe
  .serial("Payment - Validation", () => {
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

    test("TC-PAY-007 should require payment method", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });
      createdOrderIds.push(orderData.order.id);

      const { response } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: 1000 },
      );
      expect(response.status()).toBe(400);
    });

    test("TC-PAY-009 should reject zero payment amount", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });
      createdOrderIds.push(orderData.order.id);

      const { response } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: 0, method: "cash" },
      );
      expect(response.status()).toBe(400);
    });

    test("TC-PAY-002 should validate payment method", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });
      createdOrderIds.push(orderData.order.id);

      const okRes = await apiPost<any>(page, `/api/admin/orders/${orderData.order.id}/payments`, {
        amount: 10000,
        method: "bank_transfer",
      });
      expect(okRes.response.ok()).toBe(true);

      const { response: badResponse } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: 1000, method: "bitcoin" },
      );
      expect(badResponse.status()).toBe(400);
    });

    test("TC-PAY-003 should validate payment amount", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });
      createdOrderIds.push(orderData.order.id);

      const { response } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: -10000, method: "cash" },
      );
      expect(response.status()).toBe(400);
    });

    test("TC-PAY-008 should reject negative payment", async ({ page }) => {
      const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
      const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
      const orderData = await createOrder(page, {
        customerId: customer.id,
        items: [{ variantId: variantId!, quantity: 1 }],
      });
      createdOrderIds.push(orderData.order.id);

      const { response } = await apiPost<any>(
        page,
        `/api/admin/orders/${orderData.order.id}/payments`,
        { amount: -500, method: "cash" },
      );
      expect(response.status()).toBe(400);
    });
  });
