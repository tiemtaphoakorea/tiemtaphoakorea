import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

const { cookiesMock, createServerClientMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

describe("lib/supabase/server", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env.SUPABASE_SECRET_KEY = "secret-key";
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe("createClient", () => {
    it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      await expect(createClient()).rejects.toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/i);
    });

    it("throws when publishable key is missing", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      await expect(createClient()).rejects.toThrow(
        /Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/i,
      );
    });

    it("creates server client with cookie handlers", async () => {
      const cookieStore = {
        getAll: vi.fn(() => [{ name: "session", value: "abc" }]),
        set: vi.fn(),
      };
      cookiesMock.mockResolvedValue(cookieStore);
      createServerClientMock.mockReturnValue({});

      await createClient();

      const options = createServerClientMock.mock.calls[0][2];
      expect(options.cookies.getAll()).toEqual([{ name: "session", value: "abc" }]);
      options.cookies.setAll([{ name: "sb", value: "token", options: { path: "/" } }]);
      expect(cookieStore.set).toHaveBeenCalledWith("sb", "token", { path: "/" });
    });
  });
});
