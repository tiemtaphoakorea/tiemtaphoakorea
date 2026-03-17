import { expect, loginAsAdmin, test } from "../fixtures/auth";

/**
 * Security Tests
 * Test cases: TC-SEC-007
 */

test.describe("Security - File Upload", () => {
  test("TC-SEC-007 should validate file uploads in chat", async ({ page }) => {
    await loginAsAdmin(page);

    // Test 1: Non-image file disguised as image
    const textFile = Buffer.from("This is not an image", "utf-8");
    const response1 = await page.request.post("/api/admin/main/upload", {
      multipart: {
        file: {
          name: "malicious.jpg",
          mimeType: "image/jpeg",
          buffer: textFile,
        },
      },
    });
    expect(response1.status()).toBeGreaterThanOrEqual(400);

    // Test 2: Oversized file (assuming limit is 5MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const response2 = await page.request.post("/api/admin/main/upload", {
      multipart: {
        file: {
          name: "large.jpg",
          mimeType: "image/jpeg",
          buffer: largeBuffer,
        },
      },
    });
    expect(response2.status()).toBeGreaterThanOrEqual(400);

    // Test 3: Executable file
    const execFile = Buffer.from("#!/bin/bash\nrm -rf /", "utf-8");
    const response3 = await page.request.post("/api/admin/main/upload", {
      multipart: {
        file: {
          name: "script.sh",
          mimeType: "application/x-sh",
          buffer: execFile,
        },
      },
    });
    expect(response3.status()).toBeGreaterThanOrEqual(400);
  });
});
