import { expect, login, loginAsManager, loginAsStaff, test } from "../fixtures/auth";
import { TEST_USERS } from "../fixtures/data";
import { apiGet } from "../helpers/api";
import { expectAdminSubdomain } from "../helpers/url";

test.describe("Admin Access Control", () => {
  test("TC-AUTH-004 should block non-internal role from admin APIs", async ({ page }) => {
    await login(page, TEST_USERS.customerLogin.username, TEST_USERS.customerLogin.password);
    const { response } = await apiGet<any>(page, "/api/admin/profile");
    expect(response.status()).toBe(401);
  });

  test("TC-AUTH-008 should allow staff access to orders/products/customers", async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/orders");
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await page.goto("/products");
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await page.goto("/customers");
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("TC-AUTH-009 should allow manager access to analytics but restrict users", async ({
    page,
  }) => {
    await loginAsManager(page);
    await page.goto("/analytics", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    expectAdminSubdomain(page);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    const { response } = await apiGet<any>(page, "/api/admin/users");
    expect(response.status()).toBe(401);
  });

  test("TC-AUTH-010 should enforce role-based module restrictions", async ({ page }) => {
    await loginAsStaff(page);
    const { response } = await apiGet<any>(page, "/api/admin/finance");
    expect(response.status()).toBe(401);
  });

  test("TC-AUTH-011 should restrict admin-only API access", async ({ page }) => {
    await loginAsStaff(page);
    const { response } = await apiGet<any>(page, "/api/admin/users");
    expect(response.status()).toBe(401);
  });

  test("TC-AUTH-012 should restrict staff from users module", async ({ page }) => {
    await loginAsStaff(page);
    await page.goto("/users");
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/\/(login|unauthorized)/i);
    expectAdminSubdomain(page);
  });

  test("TC-AUTH-013 should restrict manager from users module", async ({ page }) => {
    await loginAsManager(page);
    await page.goto("/users");
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/\/(login|unauthorized)/i);
    expectAdminSubdomain(page);
  });
});
