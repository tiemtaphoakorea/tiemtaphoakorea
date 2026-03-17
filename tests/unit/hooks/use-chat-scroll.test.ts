/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChatScroll } from "@/hooks/use-chat-scroll";

describe("useChatScroll", () => {
  it("returns a containerRef", () => {
    const { result } = renderHook(() => useChatScroll());
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef).toHaveProperty("current");
  });

  it("exposes a scrollToBottom function", () => {
    const { result } = renderHook(() => useChatScroll());
    expect(typeof result.current.scrollToBottom).toBe("function");
  });

  it("scrollToBottom calls scrollTo on the container", () => {
    const { result } = renderHook(() => useChatScroll());

    const mockScrollTo = vi.fn();
    const fakeContainer = {
      scrollTo: mockScrollTo,
      scrollHeight: 500,
    } as unknown as HTMLDivElement;

    // Assign to ref
    (result.current.containerRef as React.MutableRefObject<HTMLDivElement>).current = fakeContainer;

    result.current.scrollToBottom();

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 500,
      behavior: "smooth",
    });
  });

  it("scrollToBottom does nothing when ref is not attached", () => {
    const { result } = renderHook(() => useChatScroll());
    // containerRef.current is null by default
    expect(() => result.current.scrollToBottom()).not.toThrow();
  });
});
