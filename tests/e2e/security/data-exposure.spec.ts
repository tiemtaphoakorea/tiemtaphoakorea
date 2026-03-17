import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, getCustomers, getOrders } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-005
 */

test.describe("Security - Data Exposure", () => {
  test("TC-SEC-005 should not expose sensitive data in API responses", async ({ page }) => {
    await loginAsAdmin(page);

    // Check user/profile endpoints
    const { data: profileData } = await apiGet<any>(page, "/api/admin/profile");
    expect(profileData.user?.password).toBeUndefined();
    expect(profileData.user?.passwordHash).toBeUndefined();
    expect(profileData.user?.salt).toBeUndefined();
    expect(profileData.token).toBeUndefined();
    expect(profileData.secret).toBeUndefined();

    // Check customer endpoints
    const customers = await getCustomers(page);
    if (customers.length > 0) {
      expect(customers[0].password).toBeUndefined();
      expect(customers[0].passwordHash).toBeUndefined();
    }

    // Check order details
    const orders = await getOrders(page, { limit: 1 });
    if (orders.data && orders.data.length > 0) {
      const orderId = orders.data[0].id;
      const { data: orderData } = await apiGet<any>(page, `/api/admin/orders/${orderId}`);
      expect(orderData.order?.internalNotes?.password).toBeUndefined();
      expect(orderData.order?.paymentToken).toBeUndefined();
    }
  });
});
