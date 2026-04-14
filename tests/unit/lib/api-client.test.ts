import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Access the real api-client module and extract interceptor handlers
// directly from the axios instance's internal `handlers` array.
// We cannot mock "axios" because pnpm resolves it to a different
// node_modules path than what the test file can reach.
let requestFulfilled: (config: any) => any;
let responseFulfilled: (response: any) => any;
let responseRejected: (error: any) => any;
let ApiErrorClass: any;

describe("api-client", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = (globalThis as any).localStorage;

  beforeAll(async () => {
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;

    const mod = await import("@/lib/api-client");
    ApiErrorClass = mod.ApiError;

    const axiosInst = (mod as any).axios;
    const reqHandlers = axiosInst?.interceptors?.request?.handlers;
    const resHandlers = axiosInst?.interceptors?.response?.handlers;

    requestFulfilled = reqHandlers?.[0]?.fulfilled;
    responseFulfilled = resHandlers?.[0]?.fulfilled;
    responseRejected = resHandlers?.[0]?.rejected;
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("should attach auth header and clean params", () => {
    (globalThis as any).window = { location: { pathname: "/" } };
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => "token-123"),
      removeItem: vi.fn(),
    };

    const config = {
      headers: {},
      params: { a: 1, b: null, c: "", d: "ok" },
    };

    const result = requestFulfilled(config);
    expect(result.headers.Authorization).toBe("Bearer token-123");
    expect(result.params).toEqual({ a: 1, d: "ok" });
  });

  it("should remove Content-Type for FormData requests", () => {
    const formData = new FormData();
    formData.append("file", new Blob(["x"]), "test.png");

    const config = {
      data: formData,
      headers: { "Content-Type": "application/json" },
    };

    const result = requestFulfilled(config);
    expect(result.headers["Content-Type"]).toBeUndefined();
  });

  it("should return response data on success", () => {
    const result = responseFulfilled({ data: { ok: true } });
    expect(result).toEqual({ ok: true });
  });

  it("should redirect on 401 and throw ApiError", () => {
    (globalThis as any).window = {
      location: { pathname: "/dashboard", href: "" },
    };
    (globalThis as any).localStorage = {
      getItem: vi.fn(() => "token-123"),
      removeItem: vi.fn(),
    };

    const error = {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
      message: "Unauthorized",
    };

    expect(() => responseRejected(error)).toThrow(ApiErrorClass);
    expect((globalThis as any).window.location.href).toBe("/login");
  });

  it("should throw ApiError for non-axios errors", () => {
    expect(() => responseRejected(new Error("boom"))).toThrow(ApiErrorClass);
  });
});
