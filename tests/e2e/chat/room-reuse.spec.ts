import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost, getChatRooms } from "../helpers/api";

/**
 * Chat - Room Reuse
 * Test cases: TC-CHAT-008
 */
test.describe("Chat - Room Reuse", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CHAT-REUSE-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CHAT-008 should reuse existing chat room by phone", async ({ page }) => {
    const uniquePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;

    // Create first customer with this phone (API returns { profile }, not { customer })
    const { data: customer1Data } = await apiPost<{ profile?: { id: string } }>(
      page,
      "/api/admin/customers",
      {
        fullName: "First Customer",
        phone: uniquePhone,
        customerType: "retail",
      },
    );
    const customerId = customer1Data?.profile?.id;
    expect(customerId).toBeTruthy();

    // Create chat room for first customer
    const { data: room1Data } = await apiPost<{ room?: { id: string } }>(page, "/api/chat/rooms", {
      customerId,
    });
    const room1Id = room1Data?.room?.id;
    expect(room1Id).toBeTruthy();

    // Send a message
    await apiPost(page, "/api/chat/messages", {
      roomId: room1Id,
      message: "First message",
      senderId: customerId,
      senderType: "customer",
    });

    // Guest comes back with same phone (storefront has chat widget)
    await page.goto(`${STOREFRONT_BASE_URL}/`);
    const chatWidget = page.locator('[data-testid="chat-widget"]');

    if (await chatWidget.isVisible()) {
      await chatWidget.click();
      const phoneInput = page.locator('input[placeholder*="Phone"], input[placeholder*="Số"]');
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill(uniquePhone);
        await page.locator('button:has-text("Start"), button:has-text("Bắt đầu")').click();
        await expect(page.locator("text=First message")).toBeVisible({
          timeout: 5000,
        });
      }
    }

    // Verify only one room exists for this phone (re-login to use admin API)
    await loginAsAdmin(page);
    const rooms = await getChatRooms(page);
    const phoneRooms = rooms.filter((r: any) => r.customer?.phone === uniquePhone);
    expect(phoneRooms.length).toBe(1);
  });
});
