import { describe, expect, it, vi } from "vitest";

const useState = vi.fn((initial) => [initial, vi.fn()]);
const useEffect = vi.fn();

vi.mock("react", () => ({
  useState,
  useEffect,
}));

describe("useDebounce", () => {
  it("should return initial value", async () => {
    const { useDebounce } = await import("@/hooks/useDebounce");
    const result = useDebounce("hello", 300);

    expect(result).toBe("hello");
    expect(useState).toHaveBeenCalledWith("hello");
    expect(useEffect).toHaveBeenCalled();
  });
});
