import { expect, test } from "../fixtures/auth";

/**
 * Chat - Access Control
 * Test cases: TC-CHAT-010
 */
test.describe("Chat - Access Control", () => {
  test("TC-CHAT-010 should block guest access to admin chat routes", async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();

    // Try to access admin chat
    await page.goto("/chat");

    // Should redirect to login page
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");

    // Verify login page is displayed using data-slot attribute
    await expect(
      page.locator('[data-slot="card-title"]:has-text("Đăng nhập Quản trị")'),
    ).toBeVisible();

    // Try to access admin chat API with POST (the method it actually supports)
    const chatResponse = await page.request.post("/api/chat", {
      data: { roomId: "test", content: "test message" },
    });
    expect(chatResponse.status()).toBeGreaterThanOrEqual(401);
    expect(chatResponse.status()).toBeLessThanOrEqual(403);
  });
});
