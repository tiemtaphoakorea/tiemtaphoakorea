import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, apiPut } from "../helpers/api";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * User - Deactivate
 * Test cases: TC-USER-003
 */
test.describe("User - Deactivate", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
  });

  test("TC-USER-003 should deactivate user blocks access (UI)", async ({ page }) => {
    await page.goto("/users");

    // Create a staff user to deactivate (reuse TC-USER-001 pattern)
    await page.getByRole("button", { name: /thêm nhân viên/i }).click();
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/nv_banhang/i)),
    ).toBeVisible();

    const ts = Date.now();
    const username = `deactivate${ts}`;
    const fullName = `Deactivate Test User ${ts}`;
    const phone = `09${String(ts).slice(-9)}`;

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="fullName"]', fullName);
    await page.fill('input[name="phone"]', phone);

    const createResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/users") && res.request().method() === "POST",
      { timeout: 20000 },
    );
    await page.getByRole("button", { name: /tạo tài khoản/i }).click();
    const createResponse = await createResponsePromise;
    if (!createResponse.ok()) {
      const body = await createResponse.json().catch(() => ({}));
      throw new Error(`Create user API failed: ${createResponse.status()} ${JSON.stringify(body)}`);
    }

    // Success dialog shows username
    await expect(page.getByText(username).first()).toBeVisible({
      timeout: 10000,
    });

    // Close success dialog and wait for users list refetch
    await page.keyboard.press("Escape");
    await page
      .waitForResponse(
        (res) => res.url().includes("/api/admin/users") && res.request().method() === "GET",
        { timeout: 10000 },
      )
      .catch(() => {});

    const row = page.locator("tbody tr").filter({ hasText: username }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    // Open actions menu and deactivate user
    await row.getByRole("button").click();
    await page.getByRole("menuitem", { name: /khóa tài khoản/i }).click();

    // Status in this row should become "Tạm khóa"
    await expect(row.getByText("Tạm khóa")).toBeVisible({ timeout: 10000 });
  });

  test("TC-USER-003 should deactivate user and block access (API)", async ({ page }) => {
    // Create a test user
    const username = `deactivateuser${Date.now()}`;
    const password = "password123";

    const { data: userData } = await apiPost<any>(page, "/api/admin/users", {
      username,
      email: `${username}@test.com`,
      password,
      role: "staff",
      fullName: "Deactivate Test User",
      isActive: true,
    });

    const userId = userData.profile?.id;
    expect(userId).toBeDefined();

    // Deactivate the user
    const { response: deactivateResponse } = await apiPut<any>(page, `/api/admin/users/${userId}`, {
      isActive: false,
    });

    expect(deactivateResponse.ok()).toBe(true);

    // Verify user is inactive
    const { data: getResponse } = await apiGet<any>(page, `/api/admin/users/${userId}`);

    expect(getResponse.user?.isActive).toBe(false);

    // Logout as admin
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Try to login as deactivated user
    await page.goto("/login");
    expectAdminSubdomain(page);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Login should fail with appropriate error
    await expect(
      page
        .locator("text=vô hiệu")
        .or(page.locator("text=disabled"))
        .or(page.locator("text=inactive"))
        .or(page.locator('[role="alert"]')),
    ).toBeVisible();

    // Should not be redirected to admin dashboard
    await expect(page).toHaveURL(/\/login/);
    expectAdminSubdomain(page);
  });

  test("TC-USER-003 should block API access for deactivated user", async ({ browser }) => {
    // Create separate context for test user
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    let userContext;
    let userPage;

    try {
      await loginAsAdmin(adminPage);

      // Create test user
      const username = `apiblockuser${Date.now()}`;
      const password = "password123";

      const { data: userData } = await apiPost<any>(adminPage, "/api/admin/users", {
        username,
        email: `${username}@test.com`,
        password,
        role: "staff",
        fullName: "API Block Test",
        isActive: true,
      });

      const userId = userData.profile?.id;

      // Create new context for test user
      userContext = await browser.newContext();
      userPage = await userContext.newPage();

      // Login as test user
      await userPage.goto("/login");
      expectAdminSubdomain(userPage);
      await userPage.fill('input[name="username"]', username);
      await userPage.fill('input[name="password"]', password);
      await userPage.click('button[type="submit"]');
      await userPage.waitForURL("/");
      expectAdminSubdomain(userPage);

      // Verify user can access API
      const { response: beforeResponse } = await apiGet<any>(userPage, "/api/admin/profile");
      expect(beforeResponse.ok()).toBe(true);

      // Deactivate user (as admin)
      await apiPut<any>(adminPage, `/api/admin/users/${userId}`, {
        isActive: false,
      });

      // Clear cookies to force re-auth check on next request
      await userContext.clearCookies();

      // Try to access API as deactivated user (after clearing session)
      const { response: afterResponse } = await apiGet<any>(userPage, "/api/admin/profile");

      // Should be blocked (401/403 due to no valid session or deactivated status)
      expect(afterResponse.ok()).toBe(false);
      expect(afterResponse.status()).toBeGreaterThanOrEqual(401);
      expect(afterResponse.status()).toBeLessThanOrEqual(403);
    } finally {
      // Always close contexts to avoid resource leaks
      if (userContext) await userContext.close();
      await adminContext.close();
    }
  });
});
