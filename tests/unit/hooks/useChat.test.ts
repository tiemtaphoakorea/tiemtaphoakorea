import { createBrowserClient } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChat, useUnreadCount } from "@/hooks/useChat";

// --- Hoisted mocks (must be defined before vi.mock factories run) ---

const { stateSetters, effectCallbacks, mockChannel, mockSupabase, chatClientMock } = vi.hoisted(
  () => {
    const stateSetters: any[] = [];
    const effectCallbacks: any[] = [];

    const mockChannel = {
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };

    const mockSupabase = {
      channel: vi.fn(() => mockChannel),
      removeChannel: vi.fn(),
      from: vi.fn(),
    };

    const chatClientMock = {
      sendMessage: vi.fn(),
    };

    return { stateSetters, effectCallbacks, mockChannel, mockSupabase, chatClientMock };
  },
);

vi.mock("react", () => ({
  useState: vi.fn((initial) => {
    const setter = vi.fn();
    stateSetters.push(setter);
    return [initial, setter];
  }),
  useEffect: vi.fn((cb) => {
    effectCallbacks.push(cb);
    try {
      const cleanup = cb();
      return cleanup;
    } catch (e) {
      console.error("Effect error", e);
    }
  }),
  useCallback: vi.fn((fn) => fn),
  useRef: vi.fn((val) => ({ current: val })),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/services/chat.client", () => ({
  chatClient: chatClientMock,
}));

// --- Tests ---

describe("useChat", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
    stateSetters.length = 0;
    effectCallbacks.length = 0;

    vi.mocked(createBrowserClient).mockImplementation(() => mockSupabase);

    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockImplementation((cb) => {
      if (cb) cb("SUBSCRIBED");
      return mockChannel;
    });
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    });

    if (typeof window === "undefined") {
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    if (!originalWindow) {
      // @ts-expect-error
      delete global.window;
    }
  });

  it("should initialize and subscribe to channel", () => {
    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith("chat_room_room1");
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "INSERT",
        filter: "room_id=eq.room1",
      }),
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
    expect(stateSetters[1]).toHaveBeenCalledWith(true);
  });

  it("should handle new message received via realtime", async () => {
    let realtimeCallback: any;
    mockChannel.on.mockImplementation((event, filter, callback) => {
      if (event === "postgres_changes") {
        realtimeCallback = callback;
      }
      return mockChannel;
    });

    const newMessage = {
      id: "msg-1",
      room_id: "room1",
      sender_id: "user2",
      content: "Hello Realtime",
      message_type: "text",
      image_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
      profiles: { full_name: "User 2", role: "customer" },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newMessage }),
    });

    const onNewMessageMock = vi.fn();

    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
      onNewMessage: onNewMessageMock,
    });

    expect(realtimeCallback).toBeDefined();
    await realtimeCallback({ new: { id: "msg-1" } });

    expect(stateSetters[0]).toHaveBeenCalled();
    expect(onNewMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-1",
        content: "Hello Realtime",
        sender: { fullName: "User 2", role: "customer" },
      }),
    );
  });

  it("should handle realtime message with array profiles", async () => {
    let realtimeCallback: any;
    mockChannel.on.mockImplementation((event, filter, callback) => {
      if (event === "postgres_changes") {
        realtimeCallback = callback;
      }
      return mockChannel;
    });

    const newMessage = {
      id: "msg-2",
      room_id: "room1",
      sender_id: "user3",
      content: "Hi Array",
      message_type: "text",
      profiles: [{ full_name: "User Array", role: "admin" }],
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newMessage }),
    });

    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
      onNewMessage: undefined,
    });

    await realtimeCallback({ new: { id: "msg-2" } });
    expect(stateSetters[0]).toHaveBeenCalled();
  });

  it("should ignore duplicate messages from realtime", async () => {
    let realtimeCallback: any;
    mockChannel.on.mockImplementation((event, filter, callback) => {
      if (event === "postgres_changes") {
        realtimeCallback = callback;
      }
      return mockChannel;
    });

    const existingMessage = {
      id: "msg-1",
      roomId: "room1",
      senderId: "user1",
      content: "Hi",
      messageType: "text",
      imageUrl: null,
      isRead: true,
      createdAt: new Date(),
      sender: { fullName: "User 1", role: "staff" },
    };

    const newMessage = {
      id: "msg-1",
      room_id: "room1",
      sender_id: "user1",
      content: "Hi",
      message_type: "text",
      image_url: null,
      is_read: true,
      created_at: new Date().toISOString(),
      profiles: { full_name: "User 1", role: "staff" },
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: newMessage }),
    });

    useChat({
      roomId: "room1",
      initialMessages: [existingMessage],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    await realtimeCallback({ new: { id: "msg-1" } });

    expect(stateSetters[0]).toHaveBeenCalledTimes(2);
    const updateFn = stateSetters[0].mock.calls[1][0];
    expect(typeof updateFn).toBe("function");
    const newState = updateFn([existingMessage]);
    expect(newState).toHaveLength(1);
    expect(newState[0].id).toBe("msg-1");
  });

  it("should handle subscription status errors", () => {
    mockChannel.subscribe.mockImplementation((cb) => {
      if (cb) cb("CHANNEL_ERROR");
      return mockChannel;
    });

    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    expect(stateSetters[3]).toHaveBeenCalledWith(expect.stringContaining("Mất kết nối"));
  });

  it("should cleanup channel on unmount", () => {
    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    expect(mockSupabase.removeChannel).not.toHaveBeenCalled();

    const subEffect = effectCallbacks[1];
    if (subEffect) {
      const cleanup = subEffect();
      if (typeof cleanup === "function") {
        cleanup();
        expect(mockSupabase.removeChannel).toHaveBeenCalled();
      }
    }
  });

  it("should update messages when initialMessages changes", () => {
    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    const messagesEffect = effectCallbacks[2];
    if (messagesEffect) {
      messagesEffect();
      expect(stateSetters[0]).toHaveBeenCalled();
    }
  });

  it("should send message successfully", async () => {
    const result = useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    chatClientMock.sendMessage.mockResolvedValueOnce({ success: true });
    await result.sendMessage("Hello", "text");

    expect(chatClientMock.sendMessage).toHaveBeenCalledWith({
      roomId: "room1",
      content: "Hello",
      messageType: "text",
      imageUrl: undefined,
    });
    expect(stateSetters[2]).toHaveBeenCalledWith(true);
    expect(stateSetters[2]).toHaveBeenCalledWith(false);
  });

  it("should send image message without content", async () => {
    const result = useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    chatClientMock.sendMessage.mockResolvedValueOnce({ success: true });
    await result.sendMessage("", "image", "http://image.url");

    expect(chatClientMock.sendMessage).toHaveBeenCalledWith({
      roomId: "room1",
      content: "",
      messageType: "image",
      imageUrl: "http://image.url",
    });
  });

  it("should handle send message error", async () => {
    const result = useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    chatClientMock.sendMessage.mockRejectedValueOnce(new Error("Network error"));
    await expect(result.sendMessage("Hello", "text")).rejects.toThrow("Network error");
    expect(stateSetters[3]).toHaveBeenCalledWith("Network error");
  });

  it("should handle missing supabase config", () => {
    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "",
      supabasePublishableKey: "",
    });
    expect(stateSetters[3]).toHaveBeenCalledWith(expect.stringContaining("Thiếu cấu hình"));
  });

  it("should handle supabase client init error", () => {
    vi.mocked(createBrowserClient).mockImplementationOnce(() => {
      throw new Error("Init fail");
    });

    useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    expect(stateSetters[3]).toHaveBeenCalledWith("Không thể khởi tạo kết nối realtime.");
  });

  it("should validate empty string message", async () => {
    const result = useChat({
      roomId: "room1",
      initialMessages: [],
      currentUserId: "user1",
      supabaseUrl: "http://sb",
      supabasePublishableKey: "key",
    });

    await expect(result.sendMessage("", "text")).rejects.toThrow("Vui lòng nhập tin nhắn");
    expect(chatClientMock.sendMessage).not.toHaveBeenCalled();
  });
});

describe("useUnreadCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateSetters.length = 0;
    effectCallbacks.length = 0;

    vi.mocked(createBrowserClient).mockImplementation(() => mockSupabase);

    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockImplementation((cb) => {
      if (cb) cb("SUBSCRIBED");
      return mockChannel;
    });
    mockSupabase.channel.mockReturnValue(mockChannel);
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    });

    if (typeof window === "undefined") {
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    // @ts-expect-error
    if (global.window) delete global.window;
  });

  it("should subscribe to unread count", () => {
    useUnreadCount("http://sb", "key", 0);

    expect(mockSupabase.channel).toHaveBeenCalledWith("admin_unread_count");
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("should update count on event", async () => {
    let realtimeCallback: any;
    mockChannel.on.mockImplementation((event, filter, callback) => {
      realtimeCallback = callback;
      return mockChannel;
    });

    mockSupabase.from.mockReturnValue({
      select: vi
        .fn()
        .mockResolvedValue({ data: [{ unread_count_admin: 5 }, { unread_count_admin: 3 }] }),
    });

    useUnreadCount("http://sb", "key", 0);

    expect(realtimeCallback).toBeDefined();
    await realtimeCallback();
    expect(stateSetters[0]).toHaveBeenCalledWith(8);
  });

  it("should cleanup on unmount", () => {
    useUnreadCount("http://sb", "key", 0);

    const effect = effectCallbacks[0];
    if (effect) {
      const cleanup = effect();
      cleanup();
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    }
  });
});
