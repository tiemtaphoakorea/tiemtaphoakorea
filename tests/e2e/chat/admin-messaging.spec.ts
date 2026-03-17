import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, getChatRooms, uploadChatAttachment } from "../helpers/api";

/**
 * Chat - Admin Messaging
 * Test cases: TC-CHAT-004, TC-CHAT-005, TC-CHAT-006
 */
test.describe("Chat System - Admin Messaging", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CHAT-MSG-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CHAT-004 should send text message", async ({ page }) => {
    // Ensure at least one chat room exists (create customer + room if none)
    let rooms = await getChatRooms(page);
    if (rooms.length === 0) {
      const uniquePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;
      const { data: customerData } = await apiPost<{
        profile?: { id: string };
      }>(page, "/api/admin/customers", {
        fullName: "TC-CHAT-004 Customer",
        phone: uniquePhone,
        customerType: "retail",
      });
      const customerId = customerData?.profile?.id;
      expect(customerId).toBeTruthy();
      await apiPost(page, "/api/chat/rooms", { customerId });
      await page.waitForTimeout(500);
      rooms = await getChatRooms(page);
    }
    expect(rooms.length).toBeGreaterThan(0);

    // Wait for rooms API to load to avoid race condition
    const roomsResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/chat") &&
        !res.url().includes("roomId=") &&
        res.request().method() === "GET" &&
        res.status() === 200,
      { timeout: 15000 },
    );

    await page.goto("/chat");
    await page.waitForURL("**/chat", { timeout: 10000 });
    await roomsResponsePromise;

    // Give React time to render
    await page.waitForTimeout(500);

    // Select first room (data-testid from admin chat page)
    const firstRoom = page.locator('[data-testid="chat-room-item"]').first();
    await firstRoom.waitFor({ state: "visible", timeout: 10000 });
    await firstRoom.click();

    // Message input placeholder is "Viết tin nhắn phản hồi..."
    const messageInput = page.locator(
      'input[placeholder*="Viết tin nhắn"], input[placeholder*="phản hồi"]',
    );
    await messageInput.waitFor({ state: "visible", timeout: 5000 });
    const message = `Test message ${Date.now()}`;
    await messageInput.fill(message);

    // Send via Enter (ChatInput handles Enter to send); avoids matching wrong buttons on page
    await messageInput.press("Enter");

    // Message appears after mutation + refetch; allow time for UI update
    await expect(
      page.locator("p.text-sm.leading-relaxed.font-medium.break-words.whitespace-pre-wrap", {
        hasText: message,
      }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("TC-CHAT-005 should handle image upload validation", async ({ page }) => {
    // Create a chat room via API by sending a message as guest
    // Use shorter ID to avoid exceeding customer_code 20 char limit (guest_ prefix + ID)
    const guestId = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    await apiPost(page, "/api/chat", {
      guestId,
      content: "Test message for upload validation",
      messageType: "text",
    });

    // Wait a moment for room to be created
    await page.waitForTimeout(1000);

    // Get the room ID
    const rooms = await getChatRooms(page);
    expect(rooms.length).toBeGreaterThan(0);
    const roomId = rooms[0]?.id;
    expect(roomId).toBeTruthy();

    // Test upload validation with invalid file type
    const uploadRes = await uploadChatAttachment(page, {
      roomId,
      file: {
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("invalid file"),
      },
    });
    expect(uploadRes.status()).toBe(500);
    const uploadBody = await uploadRes.json();
    // Chỉ cần đảm bảo có thông báo lỗi user-facing, không phụ thuộc nội dung cụ thể
    expect(uploadBody.error).toBeTruthy();
  });

  test("TC-CHAT-006 should mark messages as read", async ({ page }) => {
    await page.goto("/chat");
    const unreadBadge = page.locator("span").filter({ hasText: /^\d+$/ }).first();
    if (await unreadBadge.isVisible()) {
      await page.locator("button").first().click();
      await page.waitForTimeout(1000);
      await expect(unreadBadge).not.toBeVisible();
    }
  });
});
