/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RealtimeChat } from "@/components/store/realtime-chat";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      on: function () {
        return this;
      },
      subscribe: vi.fn(),
      send: vi.fn().mockResolvedValue(undefined),
    }),
    removeChannel: vi.fn(),
  }),
}));

// Mock chat client API
vi.mock("@/services/chat.client", () => ({
  chatClient: {
    getGuestMessages: vi.fn().mockResolvedValue({
      messages: [],
      roomId: "room-test",
      currentUserId: "user-1",
    }),
    sendMessage: vi.fn().mockResolvedValue({
      message: {
        id: "msg-new",
        content: "Hello",
        senderId: "user-1",
        createdAt: new Date().toISOString(),
      },
    }),
  },
}));

// Mock useChatScroll
vi.mock("@/hooks/use-chat-scroll", () => ({
  useChatScroll: () => ({
    containerRef: { current: null },
    scrollToBottom: vi.fn(),
  }),
}));

// Mock ChatMessageItem
vi.mock("@/components/store/chat-message", () => ({
  ChatMessageItem: ({ message }: { message: { content: string } }) => (
    <div data-testid="chat-message">{message.content}</div>
  ),
}));

describe("RealtimeChat Component", () => {
  it("shows loading state initially", () => {
    render(<RealtimeChat guestId="guest-1" />);
    expect(screen.getByText(/loading chat/i)).toBeInTheDocument();
  });

  it("renders message list after loading", async () => {
    render(<RealtimeChat guestId="guest-1" />);
    await waitFor(() => {
      expect(screen.queryByText(/loading chat/i)).not.toBeInTheDocument();
    });
    // Input area should be visible after loading
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it("renders input area", async () => {
    render(<RealtimeChat guestId="guest-1" />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });
  });

  it("calls send handler when submitting a message", async () => {
    const { chatClient } = await import("@/services/chat.client");
    render(<RealtimeChat guestId="guest-1" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading chat/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type a message/i);
    await userEvent.type(input, "Hello there");

    // The send button is icon-only (SVG, no accessible name).
    // It appears only when there's text in the input.
    const sendButton = screen.getByRole("button");
    await userEvent.click(sendButton);

    expect(chatClient.sendMessage).toHaveBeenCalled();
  });
});
