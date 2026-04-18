import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/utils/supabase/server";

const { createServerClientMock, cookiesMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

interface CreateServerClientOptions {
  global?: {
    headers?: Record<string, string>;
  };
  cookies: {
    getAll: () => unknown;
    setAll: (
      cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
    ) => void;
  };
}

function getCreateServerClientOptions(): CreateServerClientOptions {
  const call = createServerClientMock.mock.calls[0] as unknown as
    | [string, string, CreateServerClientOptions]
    | undefined;
  expect(call).toBeDefined();
  if (!call) {
    throw new Error("createServerClient was not called");
  }
  return call[2];
}

describe("utils/supabase/server", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockReturnValue({ mock: true });
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = "public-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create server client with cookies", async () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "a", value: "1" }]),
      set: vi.fn(),
    };

    cookiesMock.mockResolvedValue(cookieStore);

    const client = await createClient();

    expect(client).toEqual({ mock: true });
    expect(createServerClientMock).toHaveBeenCalledTimes(1);

    const options = getCreateServerClientOptions();
    expect(options.global).toBeUndefined();

    expect(options.cookies.getAll()).toEqual([{ name: "a", value: "1" }]);
    options.cookies.setAll([{ name: "b", value: "2", options: { path: "/" } }]);
    expect(cookieStore.set).toHaveBeenCalledWith("b", "2", { path: "/" });
  });

  it("should not set global options when cookie store is empty", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    };

    cookiesMock.mockResolvedValue(cookieStore);

    await createClient();

    const options = getCreateServerClientOptions();
    expect(options.global).toBeUndefined();
  });
});
