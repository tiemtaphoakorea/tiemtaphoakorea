import { expect, loginAsAdmin, loginAsManager, loginAsStaff, test } from "../fixtures/auth";

/**
 * Settings - Access Control
 * Test cases: TC-SETTINGS-001, TC-SETTINGS-006
 *
 * Notes:
 * - TC-SETTINGS-006 (staff/manager blocked from /settings): partially covered by
 *   TC-AUTH-009 and TC-AUTH-011 in tests/e2e/auth/access-control.spec.ts which verify
 *   role-based API restrictions. The UI-level redirect for /settings is tested here.
 */
test.describe("Settings - Access Control", () => {
  // TC-SETTINGS-001: Owner can access /settings; page loads with expected sections
  test("TC-SETTINGS-001 Owner can access settings page with nav and banner tabs", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
    await page.goto("/settings");

    // Page heading
    await expect(page.getByRole("heading", { name: /cài đặt/i })).toBeVisible({ timeout: 10000 });

    // Two tabs: Điều hướng (Nav) and Banner slides
    await expect(
      page.getByRole("tab", { name: /điều hướng/i }).or(page.getByText(/điều hướng/i).first()),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /banner/i }).or(page.getByText(/banner slides/i).first()),
    ).toBeVisible();
  });

  // TC-SETTINGS-006: Staff is blocked from accessing /settings
  test("TC-SETTINGS-006 Staff cannot access settings page", async ({ page }) => {
    await loginAsStaff(page);
    await page.waitForTimeout(500);
    await page.goto("/settings");

    // Should redirect to login or unauthorized, or show an access-denied message
    const url = page.url();
    const isBlocked =
      url.includes("/login") ||
      url.includes("/unauthorized") ||
      (await page
        .getByText(/không có quyền|unauthorized|access denied/i)
        .isVisible()
        .catch(() => false));

    expect(isBlocked).toBe(true);
  });

  // TC-SETTINGS-006 (manager variant): Manager is blocked from accessing /settings
  test("TC-SETTINGS-006 Manager cannot access settings page", async ({ page }) => {
    await loginAsManager(page);
    await page.waitForTimeout(500);
    await page.goto("/settings");

    const url = page.url();
    const isBlocked =
      url.includes("/login") ||
      url.includes("/unauthorized") ||
      (await page
        .getByText(/không có quyền|unauthorized|access denied/i)
        .isVisible()
        .catch(() => false));

    expect(isBlocked).toBe(true);
  });
});
