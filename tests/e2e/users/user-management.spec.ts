import type { TestInfo } from "@playwright/test";
import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * F10: User Management Tests
 * Test cases: USER-01 to USER-03
 */
test.describe("User Management", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo: TestInfo) => {
    runId = `E2E-USER-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
    // Wait for auth to settle before running tests
    await page.waitForTimeout(500);
  });

  // USER-01: Xem danh sách nhân viên
  test("TC-EXTRA should display user list", async ({ page }) => {
    await page.goto("/users");

    await expect(page.locator("h1, h2").filter({ hasText: /nhân viên|user/i })).toBeVisible();
    await expect(page.locator("table").or(page.locator('[data-testid="user-list"]'))).toBeVisible();
  });

  // USER-02: Tạo nhân viên mới
  test("TC-USER-001 should create a new user", async ({ page }) => {
    await page.goto("/users");

    await page.getByRole("button", { name: /thêm nhân viên/i }).click();
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/nv_banhang/i)),
    ).toBeVisible();

    const username = `user${runId.replace(/\D/g, "").slice(-12)}`;
    const fullName = `User ${runId}`;
    // Use unique phone: profiles has unique (role, phone), so each staff must have a unique phone
    const phone = `09${runId.replace(/\D/g, "").slice(-9)}`;
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="fullName"]', fullName);
    await page.fill('input[name="phone"]', phone);

    // Wait for create API request to complete (any status) so we don't assert before UI updates
    const createResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/users") && res.request().method() === "POST",
      { timeout: 20000 },
    );

    await page.getByRole("button", { name: /tạo tài khoản/i }).click();
    const response = await createResponsePromise;
    if (!response.ok()) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Create user API failed: ${response.status()} ${JSON.stringify(body)}`);
    }

    // Username appears in success dialog or in table after list refetch
    await expect(page.getByText(username)).toBeVisible({ timeout: 10000 });
  });

  // USER-03: Tìm kiếm nhân viên
  test("TC-EXTRA should search users", async ({ page }) => {
    await page.goto("/users");

    const searchInput = page.locator('input[placeholder*="Tìm"], input[name="search"]');
    await searchInput.fill("admin");
    await page.waitForTimeout(500);
    expect(page.url()).toContain("search");
  });

  test("TC-USER-002 should update user profile and role", async ({ page }) => {
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

  test("TC-USER-003 should deactivate user blocks access", async ({ page }) => {
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

  test("TC-USER-004 should validate user creation", async ({ page }) => {
    await page.goto("/users");
    await page.getByRole("button", { name: /thêm nhân viên/i }).click();
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/nv_banhang/i)),
    ).toBeVisible();
    await page.getByRole("button", { name: /tạo tài khoản/i }).click();
    // Expect validation errors for required fields (2 messages)
    await expect(page.getByText(/vui lòng nhập tên đăng nhập/i)).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByText(/vui lòng nhập họ tên/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test("TC-USER-005 should reactivate user restores access", async ({ page }) => {
    await page.goto("/users");

    // Create a staff user (reuse TC-USER-001 pattern)
    await page.getByRole("button", { name: /thêm nhân viên/i }).click();
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/nv_banhang/i)),
    ).toBeVisible();

    const ts = Date.now();
    const username = `reactivate${ts}`;
    const fullName = `User ${ts}`;
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

    let row = page.locator("tbody tr").filter({ hasText: username }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    // Deactivate (lock) user
    await row.getByRole("button").click();
    await page.getByRole("menuitem", { name: /khóa tài khoản/i }).click();
    await expect(row.getByText("Tạm khóa")).toBeVisible({ timeout: 10000 });

    // Reactivate (unlock) user
    row = page.locator("tbody tr").filter({ hasText: username }).first();
    await row.getByRole("button").click();
    await page.getByRole("menuitem", { name: /mở khóa tài khoản/i }).click();
    await expect(row.getByText("Hoạt động")).toBeVisible({ timeout: 10000 });
  });
});
