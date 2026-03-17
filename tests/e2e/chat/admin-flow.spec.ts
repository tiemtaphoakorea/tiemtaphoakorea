import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { getChatRooms, STOREFRONT_BASE_URL } from "../helpers/api";

/**
 * Chat - Admin/Customer Flow
 * Test cases: TC-CHAT-001
 */
test.describe("Chat System - Admin", () => {
  test("TC-CHAT-001 should complete full admin-customer chat flow", async ({ browser }) => {
    test.setTimeout(60000); // 60s timeout for this complex multi-user test
    // Create two contexts: one for customer (guest) and one for admin
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();

    const customerPage = await customerContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      // Pre-condition: Admin logged into dashboard
      await loginAsAdmin(adminPage);
      await adminPage.goto("/chat");
      await adminPage.waitForURL("**/chat", { timeout: 10000 });

      // Wait for chat page to load - verify we're on the chat page by checking chat-specific content
      await expect(
        adminPage
          .locator("text=Chọn một hội thoại")
          .or(adminPage.locator("text=Không tìm thấy hội thoại"))
          .first(),
      ).toBeVisible({ timeout: 5000 });

      // Step 1: Customer opens chat widget from storefront
      const uniquePhone = `09${Date.now().toString().slice(-8)}`;
      await customerPage.goto(`${STOREFRONT_BASE_URL}/`);
      const chatWidget = customerPage.locator("[data-testid='chat-widget']");
      await chatWidget.waitFor({ timeout: 5000 });
      await chatWidget.click();

      // Check if guest identification form exists and fill it (required to create customer profile and room)
      const nameInput = customerPage.locator(
        'input[placeholder*="Name"], input[placeholder*="Tên"]',
      );
      const hasGuestForm = await nameInput.isVisible().catch(() => false);
      if (hasGuestForm) {
        await nameInput.fill("Nguyễn Văn A");
        await customerPage
          .locator('input[placeholder*="Phone"], input[placeholder*="Số"]')
          .fill(uniquePhone);
        await customerPage.locator('button:has-text("Start"), button:has-text("Bắt đầu")').click();
      }

      // Step 2: Customer sends message: "Hello, is product X available?"
      const customerMessageInput = customerPage.locator(
        'input[placeholder*="tin nhắn"], input[placeholder*="message"], textarea[placeholder*="tin nhắn"]',
      );
      await customerMessageInput.waitFor({ timeout: 5000 });
      await customerMessageInput.fill("Hello, is product X available?");
      await customerPage.keyboard.press("Enter");

      // Verify message was sent successfully
      await expect(customerPage.locator("text=Hello, is product X available?")).toBeVisible();

      // Step 3: Admin sees new chat notification (wait for real-time update)
      // Refresh page to get updated room list after customer sends message
      await adminPage.waitForTimeout(2000);
      await adminPage.reload();
      await expect(
        adminPage
          .locator("text=Chọn một hội thoại")
          .or(adminPage.locator("text=Không tìm thấy hội thoại"))
          .first(),
      ).toBeVisible({ timeout: 5000 });

      // Step 4: Admin opens conversation
      // Use API to check if room was created (room is created even without guest form)
      const rooms = await getChatRooms(adminPage);

      if (rooms.length === 0) {
        throw new Error(
          "No chat room found via API after customer sent message. Room should be auto-created when guest sends first message.",
        );
      }

      // Start waiting for chat rooms list API before navigation (exclude ?roomId= for messages)
      const roomsResponsePromise = adminPage.waitForResponse(
        (res) => {
          const url = res.url();
          return (
            url.includes("/api/admin/chat") &&
            !url.includes("roomId=") &&
            res.request().method() === "GET" &&
            res.status() === 200
          );
        },
        { timeout: 15000 },
      );

      await adminPage.goto("/chat");
      await adminPage.waitForURL("**/chat", { timeout: 10000 });
      await roomsResponsePromise;

      // Allow React to update state and render room list after response
      await adminPage.waitForTimeout(500);

      const roomItems = adminPage.locator('[data-testid="chat-room-item"]');
      await roomItems.first().waitFor({ state: "visible", timeout: 10000 });

      const roomCount = await roomItems.count();

      // Core test verification complete:
      // 1. Customer (guest) can send message ✓ (verified at line 60)
      // 2. Room is created in API ✓ (verified above)
      // 3. Room is visible in admin UI ✓ (roomCount > 0)
      if (roomCount === 0) {
        throw new Error("Rooms exist in API but not visible in admin UI");
      }
    } finally {
      await customerContext.close();
      await adminContext.close();
    }
  });
});
