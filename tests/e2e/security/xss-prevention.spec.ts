import { expect, loginAsAdmin, test } from "../fixtures/auth";
import { apiGet, apiPost, getCustomers } from "../helpers/api";

/**
 * Security Tests
 * Test cases: TC-SEC-004
 */

test.describe("Security - XSS Prevention", () => {
  test("TC-SEC-004 should block XSS injection in chat messages", async ({ page }) => {
    await loginAsAdmin(page);

    // Get admin profile to get the current user ID
    const { data: profileData } = await apiGet<any>(page, "/api/admin/profile");
    const _currentUserId = profileData?.user?.id || profileData?.id;

    // Get or create a test chat room
    const chatData = await apiGet<any>(page, "/api/admin/chat");
    const rooms = chatData.data?.rooms || [];
    let testRoomId: string;

    if (rooms.length > 0) {
      // Use first available room
      testRoomId = rooms[0].id;
    } else {
      // Need to create a room - get a customer first
      const customers = await getCustomers(page);
      if (customers.length === 0) {
        return;
      }

      // Get or create room for first customer
      const customerId = customers[0].id;
      const roomResponse = await apiPost<any>(page, "/api/chat/rooms", {
        customerId,
      });

      if (!roomResponse.response.ok()) {
        return;
      }

      testRoomId = roomResponse.data?.room?.id;
    }

    const xssPayloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "<svg/onload=alert('XSS')>",
      "javascript:alert(1)",
      "<iframe src='javascript:alert(1)'>",
    ];

    // Try to send XSS payload in chat
    for (const payload of xssPayloads) {
      const { response } = await apiPost<any>(page, "/api/chat/messages", {
        roomId: testRoomId,
        message: payload,
      });

      // Message should be accepted (status 200/201)
      expect(response.ok(), `Failed to send message with payload: ${payload}`).toBe(true);

      // Verify the message was escaped when retrieved via API
      const messagesResponse = await apiGet<any>(page, `/api/admin/chat?roomId=${testRoomId}`);
      const messages = messagesResponse.data?.messages || [];

      if (messages.length > 0) {
        // Find the message we just sent
        const sentMessage = messages.find((m: any) => m.content === payload);

        // Content should be stored as-is in database (not executed)
        expect(sentMessage).toBeDefined();
        expect(sentMessage?.content).toBe(payload);
      }

      // Now verify XSS is escaped in the UI
      await page.goto("/admin/chat");
      await page.waitForLoadState("networkidle");

      // Select the test chat room if not already selected
      const chatRoomItems = page.locator('[data-testid="chat-room-item"]');
      if ((await chatRoomItems.count()) > 0) {
        await chatRoomItems.first().click();
        await page.waitForTimeout(500); // Wait for messages to load
      }

      // Check that script tags are not present in the rendered HTML
      const pageContent = await page.content();
      const dangerousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /onerror\s*=\s*["'][^"']*["']/gi,
        /onload\s*=\s*["'][^"']*["']/gi,
      ];

      for (const pattern of dangerousPatterns) {
        const matches = pageContent.match(pattern);
        // Filter out legitimate app scripts (those with src attributes or known safe content)
        const dangerousMatches = matches?.filter(
          (match) => !match.includes("src=") && match.includes(payload.substring(0, 20)),
        );
        expect(
          dangerousMatches?.length || 0,
          `Found dangerous pattern in rendered HTML: ${pattern}`,
        ).toBe(0);
      }
    }
  });

  test("TC-SEC-004 should escape XSS in product names and descriptions", async ({ page }) => {
    await loginAsAdmin(page);

    const xssPayload = "<script>alert('XSS')</script>";

    // Try to create product with XSS in name
    const { response } = await apiPost<any>(page, "/api/admin/products", {
      name: xssPayload,
      slug: "xss-test-product",
      description: xssPayload,
      categoryId: "test-category",
    });

    if (response.ok()) {
      // Navigate to product list and verify XSS is escaped
      await page.goto("/products");
      const productName = await page.locator("table").textContent();
      expect(productName).not.toContain("<script>");
    }
  });
});
