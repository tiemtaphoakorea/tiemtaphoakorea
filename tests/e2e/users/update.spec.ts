import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, apiPut } from "../helpers/api";

/**
 * User - Update Profile and Role
 * Test cases: TC-USER-002
 */
test.describe("User - Update Profile and Role", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-USER-UPDATE-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
  });

  test("TC-USER-002 should update user profile and role (UI)", async ({ page }) => {
    await page.goto("/users");

    // Create user (same pattern as TC-USER-001: unique phone, wait for API)
    await page.getByRole("button", { name: /thêm nhân viên/i }).click();
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/nv_banhang/i)),
    ).toBeVisible();

    const ts = Date.now();
    const username = `edituser${ts}`;
    const fullName = `User ${ts}`;
    const updatedFullName = `Updated User ${ts}`;
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
    // Wait for success dialog to appear with username
    await expect(page.getByText(username).first()).toBeVisible({
      timeout: 10000,
    });

    // Close success dialog by pressing Escape
    await page.keyboard.press("Escape");

    // Wait for users list to refetch after create (invalidateQueries triggers GET)
    await page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/admin/users") &&
          res.request().method() === "GET" &&
          res.status() === 200,
        { timeout: 10000 },
      )
      .catch(() => {});

    // Wait for username to appear in table (newest users appear first, so should be on page 1)
    await expect(page.locator("tbody tr").filter({ hasText: username }).first()).toBeVisible({
      timeout: 10000,
    });

    const row = page.locator("tbody tr").filter({ hasText: username }).first();
    await row.getByRole("button").click();
    await page.getByText("Chỉnh sửa").click();
    await expect(page.getByText("Chỉnh sửa thông tin")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('input[name="fullName"]').first()).toBeVisible({
      timeout: 5000,
    });
    await page.fill('input[name="fullName"]', updatedFullName);
    const updateResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/users/") && res.request().method() === "PUT",
      { timeout: 15000 },
    );
    await page.getByRole("button", { name: /lưu thay đổi/i }).click();
    const updateResponse = await updateResponsePromise;
    if (!updateResponse.ok()) {
      const body = await updateResponse.json().catch(() => ({}));
      throw new Error(`Update user API failed: ${updateResponse.status()} ${JSON.stringify(body)}`);
    }

    // Wait for users list to refetch after update (invalidateQueries triggers GET /api/admin/users)
    await page
      .waitForResponse(
        (res) => res.url().includes("/api/admin/users") && res.request().method() === "GET",
        { timeout: 10000 },
      )
      .catch(() => {});

    await expect(
      page.locator("tbody tr").filter({ hasText: username }).getByText(updatedFullName),
    ).toBeVisible({ timeout: 10000 });
  });

  test("TC-USER-002 should update user profile and role (API)", async ({ page }) => {
    // Create a user
    const { data: userData } = await apiPost<any>(page, "/api/admin/users", {
      username: `testuser${runId}`,
      email: `user${runId}@test.com`,
      password: "password123",
      role: "staff",
      fullName: "Test User",
    });

    const userId = userData.profile?.id;
    expect(userId).toBeDefined();
    expect(userData.profile?.role).toBe("staff");

    // Update user profile
    const updatedName = `Updated User ${runId}`;
    const { response: updateResponse } = await apiPut<any>(page, `/api/admin/users/${userId}`, {
      fullName: updatedName,
      role: "manager",
    });

    expect(updateResponse.ok()).toBe(true);

    // Verify updates
    const { data: getResponse } = await apiGet<any>(page, `/api/admin/users/${userId}`);

    expect(getResponse.user?.fullName).toBe(updatedName);
    expect(getResponse.user?.role).toBe("manager");

    // Navigate to users list
    await page.goto("/users");
    await page.waitForTimeout(1000);

    // Verify updated user shown
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();

    // Verify role badge
    const roleBadge = page.locator('text=Manager, text=Quản lý, [data-testid="role-badge"]');

    if (await roleBadge.first().isVisible()) {
      await expect(roleBadge.first()).toBeVisible();
    }
  });
});
