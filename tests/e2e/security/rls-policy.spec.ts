import { expect, loginAsAdmin, loginAsStaff, test } from "../fixtures/auth";
import { apiGet, getCustomers, getOrders } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-010
 */

test.describe("Security - RLS Policy", () => {
  test("TC-SEC-010 should enforce row-level security policies", async ({ page }) => {
    await loginAsStaff(page);

    // Staff should have access to customers and orders
    const customers = await getCustomers(page);
    expect(Array.isArray(customers)).toBe(true);

    const orders = await getOrders(page);
    expect(orders).toBeDefined();
    expect(orders.data).toBeDefined();

    // But staff should not access restricted resources like users
    const { response: usersResponse } = await apiGet<any>(page, "/api/admin/users");
    expect(usersResponse.status()).toBeGreaterThanOrEqual(401);

    // Now test as admin - should have full access
    await loginAsAdmin(page);

    const { response: adminUsersResponse } = await apiGet<any>(page, "/api/admin/users");
    expect(adminUsersResponse.ok()).toBe(true);

    const adminCustomers = await getCustomers(page);
    expect(Array.isArray(adminCustomers)).toBe(true);
  });
});
