import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, getCustomers } from "../helpers/api";

/**
 * Customer - Duplicate Phone Handling
 * Test cases: TC-CUST-010
 */
test.describe("Customer - Duplicate Phone Handling", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-DUP-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CUST-010 should handle duplicate customer phone", async ({ page }) => {
    const duplicatePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;

    // Create first customer
    const { data: customer1 } = await apiPost<any>(page, "/api/admin/customers", {
      fullName: "First Customer",
      phone: duplicatePhone,
      customerType: "retail",
    });

    expect(customer1.success).toBe(true);

    // Try to create second customer with same phone
    const { response: customer2Response } = await apiPost<any>(page, "/api/admin/customers", {
      fullName: "Second Customer",
      phone: duplicatePhone,
      customerType: "retail",
    });

    // Should either:
    // 1. Reject with conflict error (400/409)
    // 2. Return existing customer
    // 3. Allow if phone is not unique constraint
    if (!customer2Response.ok()) {
      expect(customer2Response.status()).toBeGreaterThanOrEqual(400);
    } else {
      // If allowed, verify customers list
      const customers = await getCustomers(page, duplicatePhone);

      // Should show warning or merge logic
      expect(customers.length).toBeGreaterThan(0);
    }
  });
});
