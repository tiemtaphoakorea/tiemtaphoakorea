/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/admin/chat-room/chat-input";

// Mock Supabase client used by ChatInput for typing indicators
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => ({
      subscribe: vi.fn(),
      send: vi.fn().mockResolvedValue(undefined),
    }),
    removeChannel: vi.fn(),
  }),
}));

const defaultProps = {
  roomId: "room-1",
  senderId: "user-1",
  senderName: "Agent",
  onSendMessage: vi.fn().mockResolvedValue(undefined),
  isSending: false,
};

// The send button is the second button in ChatInput (first is image upload).
// Both are icon-only (no accessible name), so we select by position.
const getSendButton = () => screen.getAllByRole("button")[1];

describe("ChatInput Component", () => {
  it("renders input and send button", () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/viết tin nhắn/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("send button is disabled when input is empty", () => {
    render(<ChatInput {...defaultProps} />);
    expect(getSendButton()).toBeDisabled();
  });

  it("typing a message enables send button", async () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    await userEvent.type(input, "Hello");
    expect(getSendButton()).not.toBeDisabled();
  });

  it("calls onSendMessage with message text on send button click", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    await userEvent.type(input, "Test message");
    await userEvent.click(getSendButton());
    expect(onSendMessage).toHaveBeenCalledWith("Test message");
  });

  it("clears input after sending", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    await userEvent.type(input, "Hello world");
    await userEvent.click(getSendButton());
    expect(input).toHaveValue("");
  });

  it("pressing Enter submits the message", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    await userEvent.type(input, "Enter message{Enter}");
    expect(onSendMessage).toHaveBeenCalledWith("Enter message");
  });

  it("pressing Shift+Enter does not submit", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput {...defaultProps} onSendMessage={onSendMessage} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    await userEvent.type(input, "Line one{Shift>}{Enter}{/Shift}");
    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it("input is disabled while isSending is true", () => {
    render(<ChatInput {...defaultProps} isSending={true} />);
    const input = screen.getByPlaceholderText(/viết tin nhắn/i);
    expect(input).toBeDisabled();
  });
});
