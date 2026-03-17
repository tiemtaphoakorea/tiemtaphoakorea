import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getCustomers, getOrders } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-003
 */

test.describe("Security - SQL Injection", () => {
  test("TC-SEC-003 should block SQL injection attempts in search fields", async ({ page }) => {
    await loginAsAdmin(page);

    const sqlPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE customers; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 'x'='x",
    ];

    for (const payload of sqlPayloads) {
      // Test customer search
      const customers = await getCustomers(page, payload);
      expect(Array.isArray(customers)).toBe(true);
      // Should return empty or normal results, not all data
      if (customers.length > 0) {
        // If returns results, they should be legitimate matches
        const hasAllCustomers = customers.length > 100; // Assuming not that many customers match injection
        expect(hasAllCustomers).toBe(false);
      }

      // Test order search
      const orders = await getOrders(page, { search: payload });
      expect(orders).toBeDefined();
      // Should not expose all orders
      if (orders.data && orders.data.length > 0) {
        const hasAllOrders = orders.data.length > 100;
        expect(hasAllOrders).toBe(false);
      }
    }
  });
});
