"use client";

import { Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ChatMessageItem } from "@/components/store/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { chatClient } from "@/services/chat.client";
import type {
  ChatBroadcastPayload,
  ChatPostgresMessageRow,
  ChatTypingPayload,
  RealtimeChatProps,
  StoreChatMessage,
  StoreDisplayMessage,
} from "@/types/chat";

/**
 * Utility to upsert messages from server while handling optimistic updates
 */
const upsertServerMessage = (
  prev: StoreChatMessage[],
  incoming: {
    serverId: string;
    senderId: string;
    content: string | null;
    createdAt: string | null;
    senderName: string | null;
  },
) => {
  const existingServerIndex = prev.findIndex((msg) => msg.serverId === incoming.serverId);
  if (existingServerIndex >= 0) return prev;

  const pendingIndex = prev.findIndex(
    (msg) =>
      msg.isPending &&
      !msg.serverId &&
      msg.senderId === incoming.senderId &&
      msg.content === incoming.content,
  );

  if (pendingIndex >= 0) {
    return prev.map((msg, index) =>
      index === pendingIndex
        ? {
            ...msg,
            serverId: incoming.serverId,
            isPending: false,
            content: incoming.content,
            createdAt: incoming.createdAt,
            sender: {
              fullName: incoming.senderName ?? msg.sender.fullName,
            },
          }
        : msg,
    );
  }

  return [
    ...prev,
    {
      id: incoming.serverId,
      serverId: incoming.serverId,
      isPending: false,
      content: incoming.content,
      senderId: incoming.senderId,
      createdAt: incoming.createdAt,
      sender: {
        fullName: incoming.senderName,
      },
    },
  ];
};

type ChatState = {
  roomId: string | null;
  currentUserId: string | null;
  dbMessages: StoreChatMessage[];
  typingSenderName: string | null;
  newMessage: string;
  isLoading: boolean;
  isSending: boolean;
};

type ChatAction =
  | { type: "INIT_START" }
  | {
      type: "INIT_SUCCESS";
      roomId: string | null;
      currentUserId: string | null;
      messages: StoreChatMessage[];
    }
  | { type: "INIT_FAILURE" }
  | { type: "SET_TYPING"; payload: string | null }
  | {
      type: "UPSERT_MESSAGE";
      payload: {
        serverId: string;
        senderId: string;
        content: string | null;
        createdAt: string | null;
        senderName: string | null;
      };
    }
  | { type: "SET_NEW_MESSAGE"; payload: string }
  | { type: "SET_IS_SENDING"; payload: boolean }
  | { type: "OPTIMISTIC_MESSAGE"; payload: StoreChatMessage }
  | { type: "ROLLBACK_MESSAGE"; payload: string; content: string };

const initialState: ChatState = {
  roomId: null,
  currentUserId: null,
  dbMessages: [],
  typingSenderName: null,
  newMessage: "",
  isLoading: true,
  isSending: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "INIT_START":
      return { ...state, isLoading: true };
    case "INIT_SUCCESS":
      return {
        ...state,
        roomId: action.roomId,
        currentUserId: action.currentUserId,
        dbMessages: action.messages,
        isLoading: false,
      };
    case "INIT_FAILURE":
      return { ...state, isLoading: false };
    case "SET_TYPING":
      return { ...state, typingSenderName: action.payload };
    case "SET_NEW_MESSAGE":
      return { ...state, newMessage: action.payload };
    case "SET_IS_SENDING":
      return { ...state, isSending: action.payload };
    case "UPSERT_MESSAGE":
      return {
        ...state,
        dbMessages: upsertServerMessage(state.dbMessages, action.payload),
      };
    case "OPTIMISTIC_MESSAGE":
      return {
        ...state,
        dbMessages: [...state.dbMessages, action.payload],
        newMessage: "",
        isSending: true,
      };
    case "ROLLBACK_MESSAGE":
      return {
        ...state,
        dbMessages: state.dbMessages.filter((m) => m.id !== action.payload),
        newMessage: action.content,
        isSending: false,
      };
    default:
      return state;
  }
}

/**
 * Realtime chat component integrated with database
 * @param userId - The ID of the authenticated user (optional)
 * @param guestId - The ID of the guest user (optional)
 * @returns The chat component
 */
export const RealtimeChat = ({ userId, guestId }: RealtimeChatProps) => {
  const { containerRef, scrollToBottom } = useChatScroll();
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { roomId, currentUserId, dbMessages, typingSenderName, newMessage, isLoading, isSending } =
    state;

  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch or create room and load messages on mount
  useEffect(() => {
    async function initChat() {
      const gId = guestId || "";
      try {
        dispatch({ type: "INIT_START" });
        const response = await chatClient.getGuestMessages(gId);

        const rawMessages = response.messages;
        let messages: StoreChatMessage[] = [];
        if (rawMessages) {
          messages = rawMessages.map((message) => ({
            id: message.id,
            serverId: message.id,
            isPending: false,
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
            sender: {
              fullName: null,
            },
          }));
        }

        const respRoomId = response.roomId;
        let rId: string | null = null;
        if (respRoomId) {
          rId = respRoomId;
        }

        const respUserId = response.currentUserId;
        let cUserId: string | null = null;
        if (respUserId) {
          cUserId = respUserId;
        }

        dispatch({
          type: "INIT_SUCCESS",
          roomId: rId,
          currentUserId: cUserId,
          messages,
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        dispatch({ type: "INIT_FAILURE" });
      }
    }

    if (guestId || userId) {
      void initChat();
    }
  }, [userId, guestId]);

  // Convert database messages to display format
  const displayMessages = useMemo<StoreDisplayMessage[]>(() => {
    return dbMessages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: msg.content || "",
      user: {
        name: msg.sender?.fullName || (msg as any).user?.name || "Unknown",
      },
      createdAt: msg.createdAt || new Date().toISOString(),
    }));
  }, [dbMessages]);
  const messageCount = displayMessages.length;

  // Subscribe to real-time updates
  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(roomId);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const typingPayload = payload.payload as ChatTypingPayload;
        if (!typingPayload?.isTyping) {
          dispatch({ type: "SET_TYPING", payload: null });
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
          return;
        }

        if (typingPayload.senderId === currentUserId) return;

        dispatch({
          type: "SET_TYPING",
          payload: typingPayload.senderName || "Tư vấn viên",
        });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          dispatch({ type: "SET_TYPING", payload: null });
          typingTimeoutRef.current = null;
        }, 1800);
      })
      .on("broadcast", { event: "message" }, (payload) => {
        const newMessage = payload.payload as ChatBroadcastPayload;
        dispatch({
          type: "UPSERT_MESSAGE",
          payload: {
            serverId: newMessage.id,
            senderId: newMessage.senderId,
            content: newMessage.content,
            createdAt: newMessage.createdAt,
            senderName: newMessage.user.name,
          },
        });
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as ChatPostgresMessageRow;
          dispatch({
            type: "UPSERT_MESSAGE",
            payload: {
              serverId: row.id,
              senderId: row.sender_id,
              content: row.content,
              createdAt: row.created_at,
              senderName: row.sender_id === currentUserId ? "Bạn" : "AI Agent",
            },
          });
        },
      )
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, upsertServerMessage]);

  useEffect(() => {
    if (messageCount === 0) {
      return;
    }

    scrollToBottom();
  }, [messageCount, scrollToBottom]);

  useEffect(() => {
    if (!typingSenderName) return;
    scrollToBottom();
  }, [typingSenderName, scrollToBottom]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !roomId || isSending) return;

      const content = newMessage.trim();
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticMessage: StoreChatMessage = {
        id: tempId,
        isPending: true,
        content,
        senderId: currentUserId || "guest",
        createdAt: new Date().toISOString(),
        sender: {
          fullName: "Bạn",
        },
      };

      const gId = guestId || undefined;
      try {
        // Optimistic UX: render message immediately
        dispatch({ type: "OPTIMISTIC_MESSAGE", payload: optimisticMessage });

        const response = await chatClient.sendMessage({
          roomId,
          content,
          guestId: gId,
        });

        // Replace optimistic message with server message and dedupe against realtime payloads
        if (response.message) {
          const rawCreatedAt = response.message.createdAt;
          let createdAt: string | null = null;
          if (rawCreatedAt instanceof Date) {
            createdAt = rawCreatedAt.toISOString();
          } else {
            createdAt = rawCreatedAt as string | null;
          }

          const msg = response.message as unknown as {
            sender?: { fullName?: string };
          };
          const msgSender = msg.sender;
          let senderName: string | null = null;
          if (msgSender) {
            const fullName = msgSender.fullName;
            if (fullName) {
              senderName = fullName;
            }
          }

          dispatch({
            type: "UPSERT_MESSAGE",
            payload: {
              serverId: response.message.id,
              senderId: response.message.senderId,
              content: response.message.content,
              createdAt,
              senderName,
            },
          });
        }
        dispatch({ type: "SET_IS_SENDING", payload: false });
        const input = inputRef.current;
        if (input) {
          input.focus();
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        // Rollback optimistic message on failure
        dispatch({
          type: "ROLLBACK_MESSAGE",
          payload: tempId,
          content,
        });
        const input = inputRef.current;
        if (input) {
          input.focus();
        }
      }
    },
    [newMessage, roomId, guestId, isSending, currentUserId, upsertServerMessage],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background text-foreground antialiased">
      {/* Messages */}
      <ChatMessages
        containerRef={containerRef}
        displayMessages={displayMessages}
        currentUserId={currentUserId}
        typingSenderName={typingSenderName}
      />

      {/* Input */}
      <ChatInputForm
        inputRef={inputRef}
        newMessage={newMessage}
        isSending={isSending}
        roomId={roomId}
        onSendMessage={handleSendMessage}
        onNewMessageChange={(val) => dispatch({ type: "SET_NEW_MESSAGE", payload: val })}
      />
    </div>
  );
};

/**
 * Chat messages list component
 */
const ChatMessages = ({
  containerRef,
  displayMessages,
  currentUserId,
  typingSenderName,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  displayMessages: StoreDisplayMessage[];
  currentUserId: string | null;
  typingSenderName: string | null;
}) => {
  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      {displayMessages.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      ) : null}
      <div className="space-y-1">
        {displayMessages.map((message, index) => {
          const prevMessage = index > 0 ? displayMessages[index - 1] : null;
          const showHeader = !prevMessage || prevMessage.user.name !== message.user.name;
          const isOwnMessage = Boolean(currentUserId && message.senderId === currentUserId);

          return (
            <div
              key={message.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <ChatMessageItem
                message={message}
                isOwnMessage={isOwnMessage}
                showHeader={showHeader}
              />
            </div>
          );
        })}
      </div>
      {typingSenderName && (
        <div className="animate-in fade-in mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typingSenderName} đang nhập</span>
          <div className="flex items-center gap-1">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.2s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.1s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Chat input form component
 */
const ChatInputForm = ({
  inputRef,
  newMessage,
  isSending,
  roomId,
  onSendMessage,
  onNewMessageChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  newMessage: string;
  isSending: boolean;
  roomId: string | null;
  onSendMessage: (e: React.FormEvent) => void;
  onNewMessageChange: (value: string) => void;
}) => {
  return (
    <form
      onSubmit={onSendMessage}
      className="flex w-full shrink-0 gap-2 border-t border-border p-4"
    >
      <Input
        ref={inputRef}
        className={cn(
          "rounded-full bg-background text-sm transition-all duration-300",
          !isSending && newMessage.trim() ? "w-[calc(100%-36px)]" : "w-full",
        )}
        type="text"
        value={newMessage}
        onChange={(e) => onNewMessageChange(e.target.value)}
        placeholder="Type a message..."
        disabled={!roomId}
      />
      {!isSending && newMessage.trim() && (
        <Button
          className="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          disabled={isSending || !roomId}
        >
          <Send className="size-4" />
        </Button>
      )}
    </form>
  );
};
