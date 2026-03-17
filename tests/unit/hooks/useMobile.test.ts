import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setState = vi.fn();
const useState = vi.fn(() => [undefined, setState]);
const useEffect = vi.fn((fn: any) => fn());

vi.mock("react", () => ({
  useState,
  useEffect,
}));

describe("useIsMobile", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    setState.mockClear();
    useState.mockClear();
    useEffect.mockClear();
    (globalThis as any).window = {
      innerWidth: 500,
      matchMedia: vi.fn(() => ({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    };
  });

  afterEach(() => {
    if (originalWindow) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  it("should set mobile state based on window width", async () => {
    const { useIsMobile } = await import("@/hooks/useMobile");
    const result = useIsMobile();

    expect(useEffect).toHaveBeenCalled();
    expect(setState).toHaveBeenCalledWith(true);
    expect(result).toBe(false);
  });
});
