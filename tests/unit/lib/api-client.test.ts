import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestHandlers: Array<(config: any) => any> = [];
const responseHandlers: Array<{
  success: (r: any) => any;
  error: (e: any) => any;
}> = [];
const mockAxiosInstance = {
  interceptors: {
    request: {
      use: (handler: (config: any) => any) => {
        requestHandlers.push(handler);
      },
    },
    response: {
      use: (success: (r: any) => any, error: (e: any) => any) => {
        responseHandlers.push({ success, error });
      },
    },
  },
};

const create = vi.fn(() => mockAxiosInstance);
const isAxiosError = (err: any) => Boolean(err?.isAxiosError);

vi.mock("axios", () => ({
  default: { create },
  create,
  isAxiosError,
}));

describe("api-client", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = (globalThis as any).localStorage;

  beforeEach(() => {
    requestHandlers.length = 0;
    responseHandlers.length = 0;
    vi.clearAllMocks();
    vi.resetModules();
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
  });

  afterEach(() => {
    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
    if (originalLocalStorage) {
      (globalThis as any).localStorage = originalLocalStorage;
    } else {
      delete (globalThis as any).localStorage;
    }
  });

  it("should attach auth header and clean params", async () => {
    (globalThis as any).window = { location: { pathname: "/" } };
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => "token-123"),
      removeItem: vi.fn(),
    };

    await import("@/lib/api-client");
    const handler = requestHandlers[0];

    const config = {
      headers: {},
      params: { a: 1, b: null, c: "", d: "ok" },
    };

    const result = handler(config);
    expect(result.headers.Authorization).toBe("Bearer token-123");
    expect(result.params).toEqual({ a: 1, d: "ok" });
  });

  it("should remove Content-Type for FormData requests", async () => {
    await import("@/lib/api-client");
    const handler = requestHandlers[0];
    const formData = new FormData();
    formData.append("file", new Blob(["x"]), "test.png");

    const config = {
      data: formData,
      headers: { "Content-Type": "application/json" },
    };

    const result = handler(config);
    expect(result.headers["Content-Type"]).toBeUndefined();
  });

  it("should return response data on success", async () => {
    await import("@/lib/api-client");
    const handler = responseHandlers[0].success;

    const result = handler({ data: { ok: true } });
    expect(result).toEqual({ ok: true });
  });

  it("should redirect on 401 and throw ApiError", async () => {
    (globalThis as any).window = {
      location: { pathname: "/dashboard", href: "" },
    };
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => "token-123"),
      removeItem: vi.fn(),
    };

    const { ApiError } = await import("@/lib/api-client");
    const handler = responseHandlers[0].error;

    const error = {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
      message: "Unauthorized",
    };

    expect(() => handler(error)).toThrow(ApiError);
    expect((globalThis as any).window.location.href).toBe("/login");
  });

  it("should throw ApiError for non-axios errors", async () => {
    const { ApiError } = await import("@/lib/api-client");
    const handler = responseHandlers[0].error;

    expect(() => handler(new Error("boom"))).toThrow(ApiError);
  });
});
