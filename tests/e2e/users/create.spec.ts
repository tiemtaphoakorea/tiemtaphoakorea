import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - Create
 * Test cases: TC-USER-001
 */
test.describe("User - Create", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-USER-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
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
});
