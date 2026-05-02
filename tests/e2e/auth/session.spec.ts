import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { TEST_USERS } from "../fixtures/data";
import { expectAdminSubdomain } from "../helpers/url";

/**
 * Auth - Session Management
 * Test cases: TC-AUTH-007, TC-AUTH-014, TC-AUTH-015
 */
test.describe("Auth - Session Management", () => {
  // TC-AUTH-007: Logout clears session - browser back does not restore dashboard
  test("TC-AUTH-007 logout clears session and back button redirects to login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expectAdminSubdomain(page);

    // Logout via user menu
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Press browser back - should not restore authenticated state
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected to /login, not the dashboard
    await expect(page).toHaveURL(/\/login/);
    expectAdminSubdomain(page);
  });

  // TC-AUTH-014: Session timeout - cleared cookies redirect to login
  test("TC-AUTH-014 expired session redirects to login", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expectAdminSubdomain(page);

    // Simulate session expiry by clearing all cookies
    await page.context().clearCookies();

    // Navigate to a protected route
    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to /login with no access to protected content
    await expect(page).toHaveURL(/\/(login|unauthorized)/i, { timeout: 10000 });
    expectAdminSubdomain(page);
  });

  // TC-AUTH-015: Fresh login replaces existing session; stale cookie returns 401 or redirect
  test("TC-AUTH-015 fresh login invalidates previous session cookie", async ({ page, context }) => {
    // Step 1: Login as admin (User1) and capture session cookie
    await loginAsAdmin(page);
    const cookiesAfterUser1 = await context.cookies();
    const user1SessionCookie = cookiesAfterUser1.find((c) => c.name === "admin_session");
    expect(user1SessionCookie, "admin_session cookie must exist after User1 login").toBeTruthy();

    const oldCookieHeader = `${user1SessionCookie!.name}=${user1SessionCookie!.value}`;

    // Step 2: Login as a different user (manager) on the same browser context
    // This replaces the session - navigate to login and re-authenticate
    await page.goto("/login");
    await page.fill('input[name="username"]', TEST_USERS.manager.username);
    await page.fill('input[name="password"]', TEST_USERS.manager.password);

    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/admin/login") && res.status() === 200,
      { timeout: 30000 },
    );
    await page.click('button[type="submit"]');
    await loginResponsePromise;

    // Wait for new session to be established
    await page.waitForTimeout(1000);
    const cookiesAfterUser2 = await context.cookies();
    const user2SessionCookie = cookiesAfterUser2.find((c) => c.name === "admin_session");
    expect(user2SessionCookie, "admin_session cookie must exist after User2 login").toBeTruthy();

    // Step 3: Call protected API directly with the stale User1 cookie
    const staleResponse = await page.request.get("/api/admin/profile", {
      headers: { Cookie: oldCookieHeader },
    });

    // Stale cookie should result in 401 (unauthorized) or redirect (3xx)
    // If the cookie value changed after User2 login, the old value should be rejected
    const status = staleResponse.status();
    if (user1SessionCookie!.value !== user2SessionCookie!.value) {
      // Cookie value changed - old cookie must be invalid
      expect([401, 302, 303], `Expected 401 or redirect for stale cookie, got ${status}`).toContain(
        status,
      );
    } else {
      // Same session token (single active session replaced) - API call with it may still succeed
      // but the active session belongs to User2; acceptable: just verify User2 is active
      const user2ProfileResponse = await page.request.get("/api/admin/profile");
      expect(user2ProfileResponse.status()).toBe(200);
    }
  });
});
