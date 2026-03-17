import { describe, expect, it } from "vitest";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

describe("api-endpoints", () => {
  it("should expose admin endpoints", () => {
    expect(API_ENDPOINTS.ADMIN.PROFILE).toBe("/api/admin/profile");
    expect(API_ENDPOINTS.ADMIN.STATS).toBe("/api/admin/stats");
    expect(API_ENDPOINTS.ADMIN.CHAT.DETAILS("room1")).toBe("/api/admin/chat?roomId=room1");
  });

  it("should expose chat endpoints", () => {
    expect(API_ENDPOINTS.CHAT.SEND).toBe("/api/chat");
    expect(API_ENDPOINTS.CHAT.UPLOAD).toBe("/api/chat");
  });

  it("should expose common endpoints", () => {
    expect(API_ENDPOINTS.COMMON.UPLOAD).toBe("/api/upload");
  });
});
