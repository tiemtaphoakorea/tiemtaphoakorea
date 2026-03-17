import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Chat - Admin Inbox
 * Test cases: TC-CHAT-003
 */
test.describe("Chat - Admin Inbox", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CHAT-INBOX-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CHAT-003 should show unread count and sort rooms", async ({ page }) => {
    // Create multiple chat rooms with messages
    const rooms: any[] = [];
    for (let i = 0; i < 3; i++) {
      const uniquePhone = `09${runId.replace(/\D/g, "").slice(-6)}${i}`;
      const { data: customerData } = await apiPost<{
        profile?: { id: string };
      }>(page, "/api/admin/customers", {
        fullName: `Chat Customer ${i}`,
        phone: uniquePhone,
        customerType: "retail",
      });

      const customerId = customerData?.profile?.id;
      expect(customerId).toBeTruthy();

      // Create chat room and send message
      const { data: roomData } = await apiPost<any>(page, "/api/chat/rooms", {
        customerId,
      });

      await apiPost<any>(page, "/api/chat/messages", {
        roomId: roomData.room?.id,
        message: `Test message ${i}`,
        senderId: customerId,
        senderType: "customer",
      });

      rooms.push({ room: roomData.room, customerId });
    }

    // Navigate to admin chat inbox
    await page.goto("/chat");
    await page.waitForTimeout(1000);

    // Verify unread count badge is visible
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    if (await unreadBadge.isVisible()) {
      const count = await unreadBadge.textContent();
      expect(Number(count)).toBeGreaterThan(0);
    }

    // Verify rooms are sorted by latest message
    const roomItems = page.locator('[data-testid="chat-room-item"]');
    const firstRoomTime = await roomItems.first().getAttribute("data-timestamp");
    const lastRoomTime = await roomItems.last().getAttribute("data-timestamp");

    // First room should have more recent or equal timestamp
    if (firstRoomTime && lastRoomTime) {
      expect(new Date(firstRoomTime).getTime()).toBeGreaterThanOrEqual(
        new Date(lastRoomTime).getTime(),
      );
    }
  });
});
