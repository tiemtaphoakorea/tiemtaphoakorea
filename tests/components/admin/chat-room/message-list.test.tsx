/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageList } from "@/components/admin/chat-room/message-list";
import type { ChatMessage } from "@/services/chat.server";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Mock ScrollArea to render children directly
vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock browser APIs
Object.defineProperty(window, "requestAnimationFrame", {
  value: (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  },
  writable: true,
});
Object.defineProperty(window, "cancelAnimationFrame", { value: vi.fn(), writable: true });
Element.prototype.scrollIntoView = vi.fn();

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "msg-1",
  roomId: "room-1",
  senderId: "user-1",
  content: "Hello",
  messageType: "text",
  imageUrl: null,
  isRead: false,
  createdAt: new Date("2024-01-15T10:00:00Z"),
  sender: { fullName: "Alice", role: "customer" },
  ...overrides,
});

describe("MessageList Component", () => {
  it("renders empty state when no messages", () => {
    render(<MessageList roomId="room-1" messages={[]} currentUserId="user-1" />);
    // No message bubbles should be rendered
    expect(screen.queryByText(/hello/i)).not.toBeInTheDocument();
  });

  it("renders list of messages", () => {
    const messages = [
      makeMessage({ id: "1", content: "First message" }),
      makeMessage({ id: "2", content: "Second message", senderId: "user-2" }),
    ];
    render(<MessageList roomId="room-1" messages={messages} currentUserId="user-1" />);
    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
  });

  it("renders message text correctly", () => {
    const messages = [makeMessage({ content: "Test content here" })];
    render(<MessageList roomId="room-1" messages={messages} currentUserId="user-1" />);
    expect(screen.getByText("Test content here")).toBeInTheDocument();
  });

  it("does not render raw HTML tags (no XSS)", () => {
    const messages = [makeMessage({ content: "<script>alert('xss')</script>" })];
    render(<MessageList roomId="room-1" messages={messages} currentUserId="user-1" />);
    // The script tag should be rendered as text, not executed
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("distinguishes own messages from others", () => {
    const messages = [
      makeMessage({ id: "1", senderId: "user-1", content: "My message" }),
      makeMessage({
        id: "2",
        senderId: "user-2",
        content: "Their message",
        sender: { fullName: "Bob", role: "customer" },
      }),
    ];
    const { container } = render(
      <MessageList roomId="room-1" messages={messages} currentUserId="user-1" />,
    );
    // Own messages are aligned to the end (justify-end), others to the start (justify-start)
    const justifyEnd = container.querySelector(".justify-end");
    const justifyStart = container.querySelector(".justify-start");
    expect(justifyEnd).toBeInTheDocument();
    expect(justifyStart).toBeInTheDocument();
  });

  it("shows agent label for internal role messages from other users", () => {
    const messages = [
      makeMessage({
        id: "1",
        senderId: "agent-1",
        content: "Agent reply",
        // "staff" is in INTERNAL_CHAT_ROLES = ["owner", "manager", "staff"]
        sender: { fullName: "Agent Smith", role: "staff" },
      }),
    ];
    render(<MessageList roomId="room-1" messages={messages} currentUserId="user-1" />);
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });
});
