import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Security Tests
 * Test cases: TC-SEC-006
 */

test.describe("Security - Cookie Security", () => {
  test("TC-SEC-006 should set secure cookie flags for session cookies", async ({
    page,
    context,
  }) => {
    await loginAsAdmin(page);

    // Get all cookies
    const cookies = await context.cookies();

    // Find session/auth cookies (common names: session, auth, token, etc.)
    const authCookies = cookies.filter(
      (c) =>
        c.name.toLowerCase().includes("session") ||
        c.name.toLowerCase().includes("auth") ||
        c.name.toLowerCase().includes("token") ||
        c.name.toLowerCase().includes("sb-"), // Supabase cookies
    );

    expect(authCookies.length).toBeGreaterThan(0);

    for (const cookie of authCookies) {
      // HttpOnly flag should be set
      expect(cookie.httpOnly, `${cookie.name} should have httpOnly flag`).toBe(true);

      // Secure flag should be set (or environment allows non-secure for localhost)
      if (!cookie.domain?.includes("localhost") && !cookie.domain?.includes("127.0.0.1")) {
        expect(cookie.secure, `${cookie.name} should have secure flag`).toBe(true);
      }

      // SameSite should be set
      expect(cookie.sameSite, `${cookie.name} should have sameSite policy`).toBeDefined();
      expect(["Strict", "Lax", "None"]).toContain(cookie.sameSite);
    }
  });
});
