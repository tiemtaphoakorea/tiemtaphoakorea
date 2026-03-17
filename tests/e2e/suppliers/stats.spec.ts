import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, cleanupTestSuppliers } from "../helpers/api";

/**
 * Supplier - Stats and Orders
 * Test cases: TC-SUP-005
 */
test.describe("Supplier - Stats and Orders", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-SUP-STATS-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestSuppliers(page, runId);
  });

  test("TC-SUP-005 should show supplier stats and recent orders", async ({ page }) => {
    // Create a supplier
    const { data: supplierData, response: supplierResponse } = await apiPost<any>(
      page,
      "/api/admin/suppliers",
      {
        name: `Stats Supplier ${runId}`,
        phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
      },
    );

    expect(supplierResponse.ok()).toBe(true);
    const supplierId = supplierData.supplier?.id;
    expect(supplierId).toBeDefined();
    if (!supplierId)
      throw new Error(`Supplier ID is undefined. Full response: ${JSON.stringify(supplierData)}`);

    // Create a product with this supplier
    const productResponse = await apiPost<any>(page, "/api/admin/products", {
      name: `Supplier Product ${runId}`,
      slug: `supplier-product-${runId}`,
      supplierId,
      categoryId: null,
    });

    const variantResponse = await apiPost<any>(
      page,
      `/api/admin/products/${productResponse.data.product?.id}/variants`,
      {
        sku: `SUP-${runId}`,
        stockType: "pre_order",
        stockQuantity: 0,
        retailPrice: 100,
        costPrice: 50,
      },
    );

    // Create a supplier order
    const { data: supplierOrderData } = await apiPost<any>(page, "/api/admin/supplier-orders", {
      variantId: variantResponse.data.variant?.id,
      quantity: 10,
      supplierId,
      expectedDate: "2026-02-01",
    });

    expect(supplierOrderData.success).toBe(true);

    // Get supplier stats via API to verify order was created
    const { data: statsData } = await apiGet<any>(page, `/api/admin/suppliers/${supplierId}/stats`);

    // Verify stats exist and show at least 1 order
    expect(statsData.stats).toBeDefined();
    expect(statsData.stats.totalOrders).toBeGreaterThanOrEqual(1);
    expect(statsData.recentOrders).toBeDefined();
    expect(statsData.recentOrders.length).toBeGreaterThanOrEqual(1);
  });
});
