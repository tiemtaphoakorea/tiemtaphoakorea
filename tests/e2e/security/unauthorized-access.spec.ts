import { expect, test } from "../fixtures/auth";
import { apiGet } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-001
 */

test.describe("Security - Unauthorized Access", () => {
  test("TC-SEC-001 should block unauthorized API access to protected endpoints", async ({
    page,
  }) => {
    // No authentication - clear any existing cookies
    await page.context().clearCookies();

    // Test various protected admin API endpoints
    const endpoints = [
      "/api/admin/orders",
      "/api/admin/products",
      "/api/admin/customers",
      "/api/admin/finance",
      "/api/admin/users",
      "/api/admin/analytics",
      "/api/admin/profile",
    ];

    for (const endpoint of endpoints) {
      const { response } = await apiGet<any>(page, endpoint);
      expect(response.status(), `${endpoint} should return 401 or 403`).toBeGreaterThanOrEqual(401);
      expect(response.status(), `${endpoint} should return 401 or 403`).toBeLessThanOrEqual(403);

      // Verify no sensitive data is returned
      const body = await response.json().catch(() => ({}));
      expect(body.data).toBeUndefined();
      expect(body.orders).toBeUndefined();
      expect(body.products).toBeUndefined();
      expect(body.customers).toBeUndefined();
    }
  });
});
