import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/client";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

describe("supabase client", () => {
  const originalEnv = { ...process.env };
  const originalWindow = globalThis.window;

  beforeEach(() => {
    createBrowserClientMock.mockReset();
    createBrowserClientMock.mockReturnValue({ mock: true });
    process.env = { ...originalEnv };
    delete (globalThis as any).window;
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  it("should create browser client using NEXT_PUBLIC env", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-key";

    const client = createClient();
    expect(client).toEqual({ mock: true });
  });

  it("should throw when missing env", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(() => createClient()).toThrow(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  });
});
