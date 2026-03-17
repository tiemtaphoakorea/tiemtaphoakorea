import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

const axiosMock = {
  post: vi.fn(),
};

vi.mock("@/lib/api-client", () => ({
  axios: axiosMock,
}));

describe("chat.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send message", async () => {
    const { chatClient } = await import("@/services/chat.client");
    const payload = { roomId: "r1", content: "hi" };

    await chatClient.sendMessage(payload);

    expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.CHAT.SEND, payload);
  });

  it("should upload image with form data", async () => {
    const { chatClient } = await import("@/services/chat.client");

    class MockFormData {
      fields: Record<string, any> = {};
      append(key: string, value: any) {
        this.fields[key] = value;
      }
    }

    const originalFormData = globalThis.FormData;
    // @ts-expect-error test-only override
    globalThis.FormData = MockFormData;

    const file = new Blob(["test"], { type: "image/png" }) as any;
    await chatClient.uploadImage({ roomId: "r1", file, sendAsMessage: true });

    expect(axiosMock.post).toHaveBeenCalled();
    const [url, formData] = axiosMock.post.mock.calls[0];
    expect(url).toBe(API_ENDPOINTS.CHAT.UPLOAD);
    expect(formData.fields.roomId).toBe("r1");
    expect(formData.fields.file).toBe(file);
    expect(formData.fields.sendAsMessage).toBe("true");

    globalThis.FormData = originalFormData;
  });
});
