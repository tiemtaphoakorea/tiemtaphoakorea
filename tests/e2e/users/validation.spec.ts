import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * User - Validation
 * Test cases: TC-USER-004
 */
test.describe("User - Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(500);
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
});
