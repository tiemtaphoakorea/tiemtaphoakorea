import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, apiPut } from "../helpers/api";

/**
 * Chat - Concurrency
 * Test cases: TC-CHAT-011, TC-CHAT-012
 */
test.describe("Chat - Concurrency", () => {
  test("TC-CHAT-011 should handle concurrent send and mark-as-read", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsAdmin(page1);
    await loginAsAdmin(page2);

    // Get existing customer or create one
    const { data: customersData } = await apiGet<any>(page1, "/api/admin/customers?limit=1");
    let customerId: string;

    if (customersData.data && customersData.data.length > 0) {
      customerId = customersData.data[0].id;
    } else {
      // Fallback: create customer if none exists
      const { data: newCustomerData } = await apiPost<any>(page1, "/api/admin/customers", {
        fullName: "Concurrent Customer",
        phone: `09${Date.now().toString().slice(-8)}`,
        customerType: "RETAIL",
      });
      customerId = newCustomerData.profile?.id;
    }

    const { data: roomData } = await apiPost<any>(page1, "/api/chat/rooms", {
      customerId,
    });

    const roomId = roomData.room?.id;

    // Session 1: Send message
    // Session 2: Mark messages as read
    const [sendResult, markReadResult] = await Promise.all([
      apiPost<any>(page1, "/api/chat/messages", {
        roomId,
        message: "Concurrent message",
      }),
      apiPut<any>(page2, `/api/chat/rooms/${roomId}/mark-read`, {}),
    ]);

    // Both operations should succeed
    expect(sendResult.response.ok()).toBe(true);
    expect(markReadResult.response.ok()).toBe(true);

    await context1.close();
    await context2.close();
  });

  test("TC-CHAT-012 should maintain message order consistency with concurrent sends", async ({
    browser,
  }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await loginAsAdmin(page1);
    await loginAsAdmin(page2);

    // Create chat room
    const { data: customerData } = await apiPost<any>(page1, "/api/admin/customers", {
      fullName: "Order Test Customer",
      phone: `09${Date.now().toString().slice(-8)}`,
      customerType: "retail",
    });

    const { data: roomData } = await apiPost<any>(page1, "/api/chat/rooms", {
      customerId: customerData.profile?.id,
    });

    const roomId = roomData.room?.id;

    // Send multiple messages concurrently
    const messages = ["Message 1", "Message 2", "Message 3"];
    const results = await Promise.all(
      messages.map((msg) =>
        apiPost<any>(page1, "/api/chat/messages", {
          roomId,
          message: msg,
          senderId: customerData.profile?.id,
          senderType: "customer",
        }),
      ),
    );

    // All should succeed
    results.forEach((result) => {
      expect(result.response.ok()).toBe(true);
    });

    // Fetch messages and verify they're in order
    const { data: messagesData } = await apiGet<any>(page1, `/api/chat/rooms/${roomId}/messages`);

    expect(messagesData.messages?.length).toBe(3);

    // Messages should have sequential timestamps
    const timestamps = messagesData.messages.map((m: any) => new Date(m.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }

    await context1.close();
    await context2.close();
  });
});
