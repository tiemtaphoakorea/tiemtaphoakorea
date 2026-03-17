import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F: Supplier Order Flow
 * Test cases: TC-SUP-ORDER-016
 */
test.describe("Supplier Orders - Auth", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-SUP-ORDER-016 should block unauthorized access to API", async ({ page, context }) => {
    // Logout by calling the API and clearing cookies
    await page.request.post("/api/admin/logout");
    await context.clearCookies();
    await page.waitForTimeout(500);

    // Try to access API without authentication
    const response = await page.request.get("/api/admin/supplier-orders");
    expect(response.status()).toBe(401);

    // Try to create order without auth
    const createResponse = await page.request.post("/api/admin/supplier-orders", {
      data: {
        variantId: "test-variant-id",
        quantity: 1,
      },
    });
    expect(createResponse.status()).toBe(401);

    // Log back in for subsequent tests
    await loginAsAdmin(page);
  });
});
