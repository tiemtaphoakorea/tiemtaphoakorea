import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_USERS } from "../fixtures/data";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * F01: Admin Authentication Tests
 * Test cases: AUTH-01..AUTH-15
 */
test.describe("Admin Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    expectAdminSubdomain(page);
  });

  // AUTH-01: Admin đăng nhập thành công & kiểm tra RBAC
  test("TC-AUTH-001 should login successfully with valid credentials", async ({ page }) => {
    // Step 1-2: Login với Owner credentials
    await page.fill('input[name="username"]', TEST_USERS.admin.username);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL(/\/$/, { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");

    // Step 3: Verify redirection to Admin Dashboard
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });

    // Step 4: Verify "Báo cáo" (Reports) và "Tài chính" (Settings/Finance) visible for Owner
    await expect(page.getByRole("link", { name: /báo cáo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /tài chính/i })).toBeVisible();

    // Step 5: Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/\/login/);

    // Step 6-7: Login with Staff credentials
    await page.fill('input[name="username"]', TEST_USERS.staff.username);
    await page.fill('input[name="password"]', TEST_USERS.staff.password);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL(/\/$/, { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded");
    expectAdminSubdomain(page);

    // Step 8: Verify "Tài chính" (P&L Report) is NOT visible for Staff
    await expect(page.getByRole("link", { name: /tài chính/i })).not.toBeVisible();
  });

  // AUTH-01a: Admin đăng nhập thất bại - sai password
  test("TC-AUTH-003 should show error with wrong password", async ({ page }) => {
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(
      page
        .locator("text=không đúng")
        .or(page.locator("text=invalid"))
        .or(page.locator('[role="alert"]')),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH-01b: Username không tồn tại
  test("TC-AUTH-003 should show error for non-existent username", async ({ page }) => {
    await page.fill('input[name="username"]', "nonexistent_user");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(
      page
        .locator("text=không đúng")
        .or(page.locator("text=invalid"))
        .or(page.locator('[role="alert"]')),
    ).toBeVisible();
  });

  // AUTH-05: Tài khoản vô hiệu hóa
  test("TC-AUTH-014 should reject login for disabled account", async ({ page }) => {
    // This test requires a pre-configured disabled account
    await page.fill('input[name="username"]', "disabled_admin");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(
      page
        .locator("text=vô hiệu")
        .or(page.locator("text=disabled"))
        .or(page.locator('[role="alert"]')),
    ).toBeVisible();
  });

  // AUTH-02a: Form validation errors
  test("TC-AUTH-002a should show form validation errors for empty login", async ({ page }) => {
    await page.click('button[type="submit"]');

    // Both username and password validation messages should appear
    await expect(page.getByText(/vui lòng nhập tên đăng nhập/i)).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByText(/vui lòng nhập mật khẩu/i)).toBeVisible({
      timeout: 3000,
    });

    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH-02: Admin đăng xuất thành công
  test("TC-AUTH-005 should logout successfully", async ({ page }) => {
    // First login
    await loginAsAdmin(page);
    await page.goto("/");
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Find and click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirected to login or home
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/(login|unauthorized)/i);
  });
});
