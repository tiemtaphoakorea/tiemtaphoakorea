/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted to create stable mock objects that survive hoisting
const { mockSend, mockChannel, mockSupabase } = vi.hoisted(() => {
  const mockSend = vi.fn().mockResolvedValue(undefined);
  const mockRemoveChannel = vi.fn();
  let subscribeCallback: ((status: string) => Promise<void> | void) | null = null;

  const mockSubscribe = vi.fn((cb: (status: string) => void) => {
    subscribeCallback = cb;
  });

  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
    send: mockSend,
    _triggerSubscribed: () => {
      if (subscribeCallback) subscribeCallback("SUBSCRIBED");
    },
  };

  const mockSupabase = {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
  };

  return { mockSend, mockChannel, mockSupabase };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

import { useRealtimeChat } from "@/hooks/use-realtime-chat";

describe("useRealtimeChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.channel.mockReturnValue(mockChannel);
  });

  it("returns initial empty messages array", () => {
    const { result } = renderHook(() =>
      useRealtimeChat({ roomName: "test-room", username: "Alice" }),
    );
    expect(result.current.messages).toEqual([]);
  });

  it("exposes sendMessage function", () => {
    const { result } = renderHook(() =>
      useRealtimeChat({ roomName: "test-room", username: "Alice" }),
    );
    expect(typeof result.current.sendMessage).toBe("function");
  });

  it("exposes isConnected state", () => {
    const { result } = renderHook(() =>
      useRealtimeChat({ roomName: "test-room", username: "Alice" }),
    );
    expect(typeof result.current.isConnected).toBe("boolean");
    expect(result.current.isConnected).toBe(false);
  });

  it("isConnected becomes true after SUBSCRIBED status", async () => {
    const { result } = renderHook(() =>
      useRealtimeChat({ roomName: "test-room", username: "Alice" }),
    );

    expect(result.current.isConnected).toBe(false);

    act(() => {
      mockChannel._triggerSubscribed();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it("sendMessage does not broadcast when not connected", async () => {
    const { result } = renderHook(() =>
      useRealtimeChat({ roomName: "test-room", username: "Alice" }),
    );

    // isConnected is false by default
    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(mockSend).not.toHaveBeenCalled();
  });
});
