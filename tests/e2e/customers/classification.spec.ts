import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, apiPut, getCustomers } from "../helpers/api";

/**
 * Customer - Classification Change
 * Test cases: TC-CUST-005
 */
test.describe("Customer - Classification Change", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-CLASS-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CUST-005 should update customer classification", async ({ page }) => {
    // Create a customer with default classification
    const { data: customerData } = await apiPost<any>(page, "/api/admin/customers", {
      fullName: "Classification Test",
      phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
      customerCode: `CT-${Date.now()}`,
      customerType: "retail",
    });

    const customerId = customerData.profile?.id;
    expect(customerData.profile?.customerType).toBe("retail");

    // Update classification to wholesale
    const { response: updateResponse } = await apiPut<any>(
      page,
      `/api/admin/customers/${customerId}`,
      {
        customerType: "wholesale",
      },
    );

    expect(updateResponse.ok()).toBe(true);

    // Verify classification updated via API
    const customers = await getCustomers(page);
    const updatedCustomer = customers.find((c: any) => c.id === customerId);
    expect(updatedCustomer?.customerType).toBe("wholesale");

    // Visit customer detail page (client-side loads data via API)
    await page.goto(`/customers/${customerId}`);

    // Verify classification shown correctly (displays as "Khách sỉ" in Vietnamese)
    await expect(page.getByText("Khách sỉ")).toBeVisible({ timeout: 15000 });
  });
});
