import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatClient } from "@/services/chat.client";

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: string | null;
  imageUrl: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
  sender: {
    fullName: string | null;
    role: string | null;
  };
}

interface UseChatOptions {
  roomId: string;
  initialMessages: Message[];
  currentUserId: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  onNewMessage?: (message: Message) => void;
  enabled?: boolean;
}

interface UseChatReturn {
  messages: Message[];
  isConnected: boolean;
  sendMessage: (
    content: string,
    messageType?: "text" | "image",
    imageUrl?: string,
  ) => Promise<void>;
  isSending: boolean;
  error: string | null;
}

/**
 * Backward-compatible hook kept for existing unit tests.
 * New storefront chat flow uses useRealtimeChat.
 */
export function useChat({
  roomId,
  initialMessages,
  currentUserId,
  supabaseUrl,
  supabasePublishableKey,
  onNewMessage,
  enabled = true,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null);

  // Keep param for backward compatibility with old hook signature.
  void currentUserId;

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    if (!supabaseUrl || !supabasePublishableKey) {
      setError("Thiếu cấu hình Supabase realtime. Vui lòng kiểm tra biến môi trường.");
      return;
    }

    try {
      supabaseRef.current = createBrowserClient(supabaseUrl, supabasePublishableKey);
      setError(null);
    } catch (err) {
      console.error("Supabase init error:", err);
      setError("Không thể khởi tạo kết nối realtime.");
    }
  }, [supabaseUrl, supabasePublishableKey, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const supabase = supabaseRef.current;
    if (!supabase) return;

    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          const { data: newMessage } = await supabase
            .from("chat_messages")
            .select(
              `
              id,
              room_id,
              sender_id,
              content,
              message_type,
              image_url,
              is_read,
              created_at,
              profiles!sender_id (
                full_name,
                role
              )
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            const formattedMessage: Message = {
              id: newMessage.id,
              roomId: newMessage.room_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              messageType: newMessage.message_type,
              imageUrl: newMessage.image_url,
              isRead: newMessage.is_read,
              createdAt: newMessage.created_at ? new Date(newMessage.created_at) : null,
              sender: {
                fullName: Array.isArray(newMessage.profiles)
                  ? (newMessage.profiles[0]?.full_name ?? null)
                  : ((newMessage.profiles as { full_name: string | null } | null)?.full_name ??
                    null),
                role: Array.isArray(newMessage.profiles)
                  ? (newMessage.profiles[0]?.role ?? null)
                  : ((newMessage.profiles as { role: string | null } | null)?.role ?? null),
              },
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === formattedMessage.id)) {
                return prev;
              }
              return [...prev, formattedMessage];
            });

            onNewMessage?.(formattedMessage);
          }
        },
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");

        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setError("Mất kết nối. Đang thử kết nối lại...");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, onNewMessage, enabled]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const sendMessage = useCallback(
    async (content: string, messageType: "text" | "image" = "text", imageUrl?: string) => {
      if (messageType === "text" && (!content || !content.trim())) {
        throw new Error("Vui lòng nhập tin nhắn");
      }

      setIsSending(true);
      setError(null);

      try {
        await chatClient.sendMessage({
          roomId,
          content,
          messageType,
          imageUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gửi tin nhắn thất bại";
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [roomId],
  );

  return {
    messages,
    isConnected,
    sendMessage,
    isSending,
    error,
  };
}

export function useUnreadCount(
  supabaseUrl: string,
  supabasePublishableKey: string,
  initialCount: number = 0,
) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);

    const channel = supabase
      .channel("admin_unread_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
        },
        async () => {
          const { data } = await supabase.from("chat_rooms").select("unread_count_admin");

          if (data) {
            const total = data.reduce((sum, room) => sum + (room.unread_count_admin || 0), 0);
            setUnreadCount(total);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUrl, supabasePublishableKey]);

  return unreadCount;
}
