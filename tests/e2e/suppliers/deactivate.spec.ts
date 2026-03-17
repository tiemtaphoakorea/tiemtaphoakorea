import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, apiPut, cleanupTestSuppliers } from "../helpers/api";

/**
 * Supplier - Deactivate
 * Test cases: TC-SUP-003
 */
test.describe("Supplier - Deactivate", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-SUP-DEACT-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSuppliers(page, runId);
  });

  test("TC-SUP-003 should deactivate supplier", async ({ page }) => {
    // Create a supplier
    const { data: supplierData, response: supplierResponse } = await apiPost<any>(
      page,
      "/api/admin/suppliers",
      {
        name: `Deactivate Test ${runId}`,
        phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
        isActive: true,
      },
    );

    expect(supplierResponse.ok()).toBe(true);
    const supplierId = supplierData.supplier?.id;
    expect(supplierId).toBeDefined();
    if (!supplierId)
      throw new Error(`Supplier ID is undefined. Full response: ${JSON.stringify(supplierData)}`);

    // Deactivate supplier
    const { response: deactivateResponse, data: updateData } = await apiPut<any>(
      page,
      `/api/admin/suppliers/${supplierId}`,
      {
        isActive: false,
      },
    );

    expect(deactivateResponse.ok()).toBe(true);
    expect(updateData.supplier?.isActive).toBe(false);

    // Verify supplier is inactive
    const { data: getResponse } = await apiGet<any>(page, `/api/admin/suppliers/${supplierId}`);

    expect(getResponse.supplier?.isActive).toBe(false);
  });
});
