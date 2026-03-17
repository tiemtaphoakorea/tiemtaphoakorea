import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Customer - Validation
 * Test cases: TC-CUST-002
 */
test.describe("Customer - Validation", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-VALID-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CUST-002 should show validation errors for customer creation (API)", async ({
    page,
  }) => {
    // Try to create customer without name
    const response1 = await apiPost<any>(page, "/api/admin/customers", {
      phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
      // name missing
    });

    expect(response1.response.ok()).toBe(false);
    expect(response1.response.status()).toBeGreaterThanOrEqual(400);

    // Try to create customer without phone
    const response2 = await apiPost<any>(page, "/api/admin/customers", {
      name: "Test Customer",
      // phone missing
    });

    expect(response2.response.ok()).toBe(false);

    // Try to create customer with invalid phone format
    const response3 = await apiPost<any>(page, "/api/admin/customers", {
      name: "Test Customer",
      phone: "invalid-phone",
    });

    expect(response3.response.ok()).toBe(false);
  });

  test("TC-CUST-002b should show form validation errors when creating customer with empty name", async ({
    page,
  }) => {
    await page.goto("/customers");
    await page.getByRole("button", { name: /thêm khách hàng/i }).click();
    await expect(page.getByPlaceholder(/nguyễn văn a/i)).toBeVisible();
    await page.getByRole("button", { name: /tạo tài khoản|tạo khách hàng/i }).click();
    await expect(page.getByText(/vui lòng nhập họ tên/i)).toBeVisible({
      timeout: 3000,
    });
  });
});
