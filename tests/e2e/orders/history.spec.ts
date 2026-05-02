import { FULFILLMENT_STATUS } from "@workspace/shared/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiGet,
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  stockOut,
} from "../helpers/api";

/**
 * Order - Status History
 * Test cases: TC-ORD-019
 */
test.describe("Order - Status History", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-ORD-019 should log order status history", async ({ page }) => {
    test.setTimeout(60000);
    const customer = await getCustomerByPhone(page, TEST_CUSTOMERS.primary.phone);
    const variantId = await findVariantIdBySku(page, TEST_PRODUCTS.testTshirt.sku);
    expect(customer?.id).toBeTruthy();
    expect(variantId).toBeTruthy();
    const orderData = await createOrder(page, {
      customerId: customer!.id,
      items: [{ variantId: variantId!, quantity: 1 }],
    });
    expect(orderData.success).toBe(true);
    expect(orderData.order?.id).toBeTruthy();

    // Stock out so history has at least one fulfillment change
    const { response: stockOutRes } = await stockOut(page, orderData.order!.id);
    expect(stockOutRes.ok()).toBe(true);

    // Fetch order history
    const { data: historyData } = await apiGet<any>(
      page,
      `/api/admin/orders/${orderData.order!.id}/history`,
    );

    expect(historyData.history).toBeDefined();
    expect(Array.isArray(historyData.history)).toBe(true);
    expect(historyData.history.length).toBeGreaterThanOrEqual(2); // create (pending) + stock_out

    // History rows expose paymentStatus + fulfillmentStatus (no single `status`).
    const fulfillmentStatuses = historyData.history.map((h: any) => h.fulfillmentStatus);
    expect(fulfillmentStatuses).toContain(FULFILLMENT_STATUS.PENDING);
    expect(fulfillmentStatuses).toContain(FULFILLMENT_STATUS.STOCK_OUT);
  });
});
