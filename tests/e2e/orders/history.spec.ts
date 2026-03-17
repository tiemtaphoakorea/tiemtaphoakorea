import { ORDER_STATUS } from "@/lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_CUSTOMERS, TEST_PRODUCTS } from "../fixtures/data";
import {
  apiGet,
  createOrder,
  findVariantIdBySku,
  getCustomerByPhone,
  updateOrderStatus,
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
    // Use fixtures to create order quickly (avoids createOrder retries / timeout)
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

    // Update status so history has at least one change (PREPARING is always logged by updateOrderStatus)
    const preparingRes = await updateOrderStatus(page, orderData.order!.id, ORDER_STATUS.PREPARING);
    expect(preparingRes.ok()).toBe(true);

    // Fetch order history
    const { data: historyData } = await apiGet<any>(
      page,
      `/api/admin/orders/${orderData.order!.id}/history`,
    );

    expect(historyData.history).toBeDefined();
    expect(Array.isArray(historyData.history)).toBe(true);
    expect(historyData.history.length).toBeGreaterThanOrEqual(2); // pending (create) + preparing

    // Verify history contains initial and updated status
    const statuses = historyData.history.map((h: any) => h.status);
    expect(statuses).toContain(ORDER_STATUS.PENDING);
    expect(statuses).toContain(ORDER_STATUS.PREPARING);
  });
});
