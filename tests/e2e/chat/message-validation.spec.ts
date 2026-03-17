import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiPost } from "../helpers/api";

/**
 * Chat - Message Validation
 * Test cases: TC-CHAT-009
 */
test.describe("Chat - Message Validation", () => {
  let runId: string;

  test.beforeEach(async ({ page }, testInfo) => {
    runId = `E2E-CHAT-VALIDATION-${testInfo.workerIndex}-${Date.now()}`;
    await loginAsAdmin(page);
  });

  test("TC-CHAT-009 should validate message content", async ({ page }) => {
    // Create a chat room (API returns { profile }, not { customer })
    const { data: customerData } = await apiPost<{ profile?: { id: string } }>(
      page,
      "/api/admin/customers",
      {
        fullName: "Validation Customer",
        phone: `09${runId.replace(/\D/g, "").slice(-8)}`,
        customerType: "retail",
      },
    );
    const customerId = customerData?.profile?.id;
    expect(customerId).toBeTruthy();

    const { data: roomData } = await apiPost<{ room?: { id: string } }>(page, "/api/chat/rooms", {
      customerId,
    });
    const roomId = roomData?.room?.id;
    expect(roomId).toBeTruthy();

    // Try to send empty message
    const emptyResponse = await apiPost<any>(page, "/api/chat/messages", {
      roomId,
      message: "",
      senderId: customerId,
      senderType: "customer",
    });
    expect(emptyResponse.response.ok()).toBe(false);

    // Try to send very long message (> 5000 chars)
    const longMessage = "a".repeat(6000);
    const longResponse = await apiPost<any>(page, "/api/chat/messages", {
      roomId,
      message: longMessage,
      senderId: customerId,
      senderType: "customer",
    });
    expect(longResponse.response.ok()).toBe(false);

    // Valid message should succeed
    const validResponse = await apiPost<any>(page, "/api/chat/messages", {
      roomId,
      message: "Valid message",
      senderId: customerId,
      senderType: "customer",
    });
    expect(validResponse.response.ok()).toBe(true);
  });
});
