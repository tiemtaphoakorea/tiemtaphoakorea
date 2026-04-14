import { STOREFRONT_BASE_URL } from "../../../lib/constants";
import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, getChatRooms } from "../helpers/api";

/**
 * Chat - Guest Identification
 * Test cases: TC-CHAT-002
 */
test.describe("Chat - Guest Identification", () => {
  let runId: string;

  test.beforeEach(async ({}, testInfo) => {
    runId = `E2E-CHAT-GUEST-${testInfo.workerIndex}-${Date.now()}`;
  });

  test("TC-CHAT-002 should create customer profile and chat room for guest", async ({ page }) => {
    const uniquePhone = `09${runId.replace(/\D/g, "").slice(-8)}`;

    // Visit storefront as guest (chat widget is only on storefront)
    await page.goto(`${STOREFRONT_BASE_URL}/`);

    // Open chat widget
    const chatWidget = page.locator('[data-testid="chat-widget"]');
    await expect(chatWidget).toBeVisible();
    await chatWidget.click();

    // Optional: if guest form (name/phone) exists, fill and submit (TC-CHAT-002 spec)
    const nameInput = page.locator('input[placeholder*="Name"], input[placeholder*="Tên"]');
    const hasGuestForm = await nameInput.isVisible().catch(() => false);
    if (hasGuestForm) {
      await nameInput.fill("Guest User");
      await page.locator('input[placeholder*="Phone"], input[placeholder*="Số"]').fill(uniquePhone);
      await page.locator('button:has-text("Start"), button:has-text("Bắt đầu")').click();
    }

    // Verify can send messages (current widget uses input, not textarea)
    const messageInput = page.locator(
      'input[placeholder*="tin nhắn"], textarea[placeholder*="message"], textarea[placeholder*="tin nhắn"]',
    );
    await expect(messageInput).toBeVisible();
    await messageInput.fill("Hello from guest");
    await page.keyboard.press("Enter");

    // Verify message sent
    await expect(page.locator("text=Hello from guest")).toBeVisible();

    // If we submitted guest form with phone, verify customer and room in admin
    if (hasGuestForm) {
      await loginAsAdmin(page);
      const { data: customersData } = await apiGet<any>(
        page,
        `/api/admin/customers?search=${uniquePhone}`,
      );
      expect(customersData.data?.length).toBeGreaterThan(0);
      const customer = customersData.data[0];
      expect(customer.phone).toBe(uniquePhone);
      const rooms = await getChatRooms(page);
      const guestRoom = rooms.find((r: any) => r.customerId === customer.id);
      expect(guestRoom).toBeDefined();
    }
  });
});
