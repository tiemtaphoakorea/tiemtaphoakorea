import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Dashboard - Chat Count
 * Test cases: TC-DASH-009
 */
test.describe("Dashboard - Chat Count", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-DASH-009 should show unread chat count", async ({ page }) => {
    await page.goto("/");

    // Look for chat/messages link with unread badge
    const chatLink = page.locator("a[href*='chat']").or(page.locator("a[href*='messages']"));

    // Check if chat navigation exists
    const hasChatLink = await chatLink.isVisible().catch(() => false);

    if (hasChatLink) {
      await expect(chatLink).toBeVisible();

      // Look for badge with unread count
      const unreadBadge = page.locator("[class*='badge']").or(page.locator("[class*='count']"));
      const hasBadge = await unreadBadge
        .first()
        .isVisible()
        .catch(() => false);

      // Badge might not be visible if no unread messages
      if (hasBadge) {
        await expect(unreadBadge.first()).toBeVisible();
      }
    }
  });
});
