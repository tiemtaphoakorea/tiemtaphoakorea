import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - Reactivate
 * Test cases: TC-USER-005
 */
test.describe("User - Reactivate", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
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
