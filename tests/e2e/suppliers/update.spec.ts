import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, apiPut, cleanupTestSuppliers } from "../helpers/api";

/**
 * Supplier - Update Details
 * Test cases: TC-SUP-002
 */
test.describe("Supplier - Update Details", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-SUP-UPDATE-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSuppliers(page, runId);
  });

  test("TC-SUP-002 should update supplier details", async ({ page }) => {
    // Create a supplier
    const { data: supplierData, response: supplierResponse } = await apiPost<any>(
      page,
      "/api/admin/suppliers",
      {
        name: `Test Supplier ${runId}`,
        phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
        email: `supplier${runId}@test.com`,
        address: "123 Test Street",
      },
    );

    expect(supplierResponse.ok()).toBe(true);
    const supplierId = supplierData.supplier?.id;
    expect(supplierId).toBeDefined();
    if (!supplierId)
      throw new Error(`Supplier ID is undefined. Full response: ${JSON.stringify(supplierData)}`);

    // Update supplier details
    const updatedName = `Updated Supplier ${runId}`;
    const { response: updateResponse } = await apiPut<any>(
      page,
      `/api/admin/suppliers/${supplierId}`,
      {
        name: updatedName,
        phone: `08${runId.replace(/\D/g, "").slice(-8)}`,
        address: "456 New Street",
      },
    );

    expect(updateResponse.ok()).toBe(true);

    // Verify updates
    const { data: getResponse } = await apiGet<any>(page, `/api/admin/suppliers/${supplierId}`);

    expect(getResponse.supplier?.name).toBe(updatedName);
    expect(getResponse.supplier?.address).toBe("456 New Street");
  });
});
