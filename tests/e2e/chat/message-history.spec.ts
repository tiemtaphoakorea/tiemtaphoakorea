import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Chat - Message History
 * Test cases: TC-CHAT-007
 */
test.describe("Chat - Message History", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CHAT-HISTORY-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CHAT-007 should paginate message history", async ({ page }) => {
    // Create a room with many messages
    const uniquePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;
    const { data: customerData } = await apiPost<any>(page, "/api/admin/customers", {
      name: "Pagination Test Customer",
      phone: uniquePhone,
      customerCode: `PTC-${Date.now()}`,
    });

    const { data: roomData } = await apiPost<any>(page, "/api/chat/rooms", {
      customerId: customerData.customer?.id,
    });

    const roomId = roomData.room?.id;

    // Send 50 messages
    for (let i = 0; i < 50; i++) {
      await apiPost<any>(page, "/api/chat/messages", {
        roomId,
        message: `Message ${i}`,
        senderId: customerData.customer?.id,
        senderType: "customer",
      });
    }

    // Open chat room
    await page.goto(`/chat/${roomId}`);
    await page.waitForTimeout(1000);

    // Get initial message count
    const initialMessages = await page.locator('[data-testid="chat-message"]').count();

    // Scroll to top to load older messages
    const messageContainer = page.locator('[data-testid="message-container"]');
    if (await messageContainer.isVisible()) {
      await messageContainer.evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.waitForTimeout(1000);

      // Verify more messages loaded
      const newMessageCount = await page.locator('[data-testid="chat-message"]').count();
      expect(newMessageCount).toBeGreaterThan(initialMessages);
    }
  });
});
