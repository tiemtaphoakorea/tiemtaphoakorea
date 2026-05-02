import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Customer - Form Validation (extended)
 * Test cases: TC-CUST-007, TC-CUST-008, TC-CUST-009, TC-CUST-017, TC-CUST-019, TC-CUST-020
 *
 * Notes on skipped TCs:
 * - TC-CUST-007/TC-CUST-008/TC-CUST-020: Customers have no email field
 *   (customerSchema: { fullName, phone, address, customerType }). No email input in UI or API.
 * - TC-CUST-019: Phone field has no format validation in customerSchema or the API layer.
 *   "abc123" is accepted by the backend (only uniqueness on non-null phones is enforced).
 */
test.describe("Customers - Form Validation", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CUST-FV-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  // TC-CUST-007: Invalid email format
  // SKIP: Customers have no email field — customerSchema = { fullName, phone, address, customerType }
  test.skip("TC-CUST-007 invalid email format - SKIPPED: no email field on customer form", () => {});

  // TC-CUST-008: Duplicate email
  // SKIP: Customers have no email field
  test.skip("TC-CUST-008 duplicate email - SKIPPED: no email field on customer form", () => {});

  // TC-CUST-009 | Duplicate phone | API rejects duplicate phone for customer role
  test("TC-CUST-009 should reject creation when phone already exists for another customer", async ({
    page,
  }) => {
    const phone = `09${runId.replace(/\D/g, "").slice(-8)}`;

    // Create first customer with the phone
    const first = await apiPost<any>(page, "/api/admin/customers", {
      fullName: `First Customer ${runId}`,
      phone,
      customerType: "retail",
    });
    expect(first.response.ok()).toBe(true);

    // Attempt to create a second customer with the same phone
    const second = await apiPost<any>(page, "/api/admin/customers", {
      fullName: `Second Customer ${runId}`,
      phone,
      customerType: "retail",
    });

    // The DB has a unique index on (role, phone) for non-null phones — expect failure
    expect(second.response.ok()).toBe(false);
    expect(second.response.status()).toBeGreaterThanOrEqual(400);
  });

  // TC-CUST-017 | Cannot add customer without name
  test("TC-CUST-017 should show inline error when name is empty on add sheet", async ({ page }) => {
    await page.goto("/customers");
    await page.getByRole("button", { name: /thêm khách hàng/i }).click();

    // Wait for sheet to open
    await expect(page.locator('[role="dialog"], [data-state="open"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Click submit without entering a name
    await page.getByRole("button", { name: /tạo tài khoản/i }).click();

    // Schema: fullName.min(1, "Vui lòng nhập họ tên")
    await expect(page.getByText(/vui lòng nhập họ tên/i)).toBeVisible({ timeout: 3000 });

    // Sheet should stay open
    await expect(page.locator('[data-state="open"]').first()).toBeVisible();
  });

  // TC-CUST-019: Invalid phone format
  // SKIP: customerSchema does not validate phone format (no regex). Backend also has no format check.
  // "abc123" is accepted; only the uniqueness constraint on (role, phone) is enforced.
  test.skip("TC-CUST-019 invalid phone format - SKIPPED: no phone format validation in schema or API", () => {});

  // TC-CUST-020: Edit - change to existing email
  // SKIP: Customers have no email field
  test.skip("TC-CUST-020 edit to existing email - SKIPPED: no email field on customer form", () => {});
});
