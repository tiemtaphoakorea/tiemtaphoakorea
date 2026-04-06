"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@workspace/database/lib/supabase/client";
import type { ChatMessage as AdminChatMessage } from "@workspace/database/services/chat.server";
import type { ChatRoomWithDetails } from "@workspace/database/types/admin";
import { CHAT_MESSAGE_TYPE } from "@workspace/shared/constants";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@workspace/ui/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatHeader } from "@/components/admin/chat-room/chat-header";
import { ChatInput } from "@/components/admin/chat-room/chat-input";
import { CustomerInfoSheet } from "@/components/admin/chat-room/customer-info-sheet";
import { MessageList } from "@/components/admin/chat-room/message-list";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { chatClient } from "@/services/chat.client";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const selectedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRoomRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Get current user profile
  const { data: user } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: adminClient.getProfile,
    staleTime: Infinity, // Profile doesn't change often
  });

  // Fetch rooms (filter on backend via search param)
  const { data: rooms = [] } = useQuery({
    queryKey: queryKeys.admin.chat.rooms.list(searchTerm),
    queryFn: () => adminClient.getChatRooms({ search: searchTerm || undefined }),
  });

  // Fetch messages for selected room
  const { data: messagesData } = useQuery({
    queryKey: queryKeys.admin.chat.messages(selectedRoomId),
    queryFn: async () => {
      if (!selectedRoomId) return { messages: [] };
      return adminClient.getChatMessages(selectedRoomId);
    },
    enabled: !!selectedRoomId,
  });

  const messages = useMemo(() => {
    const rawMessages = ((messagesData as any)?.messages || []) as any[];
    const seenIds = new Set<string>();
    return rawMessages.filter((message) => {
      if (!message?.id || seenIds.has(message.id)) return false;
      seenIds.add(message.id);
      return true;
    });
  }, [messagesData]);

  // Send message mutation
  const normalizeApiMessage = (message: any): AdminChatMessage => ({
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    content: message.content ?? "",
    messageType: message.messageType ?? CHAT_MESSAGE_TYPE.TEXT,
    imageUrl: message.imageUrl ?? null,
    isRead: message.isRead ?? false,
    createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
    sender: {
      fullName: message.sender?.fullName ?? user?.fullName ?? "Bạn",
      role: message.sender?.role ?? user?.role ?? null,
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: chatClient.sendMessage,
    onMutate: async (variables) => {
      if (!selectedRoomId || !user) return undefined;

      await queryClient.cancelQueries({
        queryKey: queryKeys.admin.chat.messages(selectedRoomId),
      });

      const previousMessages = queryClient.getQueryData<{
        messages: AdminChatMessage[];
      }>(queryKeys.admin.chat.messages(selectedRoomId));

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimisticMessage: AdminChatMessage = {
        id: tempId,
        roomId: selectedRoomId,
        senderId: user.id,
        content: variables.content,
        messageType: CHAT_MESSAGE_TYPE.TEXT,
        imageUrl: null,
        isRead: false,
        createdAt: new Date(),
        sender: {
          fullName: user.fullName,
          role: user.role,
        },
      };

      queryClient.setQueryData<{ messages: AdminChatMessage[] }>(
        queryKeys.admin.chat.messages(selectedRoomId),
        (old) => ({
          messages: [...(old?.messages || []), optimisticMessage],
        }),
      );

      return { previousMessages, tempId, roomId: selectedRoomId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData(
        queryKeys.admin.chat.messages(context.roomId),
        context.previousMessages,
      );
    },
    onSuccess: () => {
      if (!selectedRoomId) return;
      // Invalidate rooms to update last message
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.chat.rooms.all,
      });
    },
    onSettled: (result, _error, _variables, context) => {
      if (!context?.roomId) return;

      if (result?.message) {
        const confirmedMessage = normalizeApiMessage(result.message);
        queryClient.setQueryData<{ messages: AdminChatMessage[] }>(
          queryKeys.admin.chat.messages(context.roomId),
          (old) => {
            const currentMessages = old?.messages || [];
            const withoutTemp = currentMessages.filter((msg) => msg.id !== context.tempId);
            if (withoutTemp.some((msg) => msg.id === confirmedMessage.id)) {
              return { messages: withoutTemp };
            }
            return { messages: [...withoutTemp, confirmedMessage] };
          },
        );
        return;
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.chat.messages(context.roomId),
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!selectedRoomId || !user) return;

    await sendMessageMutation.mutateAsync({
      roomId: selectedRoomId,
      content,
      messageType: CHAT_MESSAGE_TYPE.TEXT,
    });
  };

  const markRoomAsReadInCache = (roomId: string) => {
    queryClient.setQueriesData<ChatRoomWithDetails[]>(
      { queryKey: queryKeys.admin.chat.rooms.all },
      (previous) => {
        if (!previous) return previous;
        return previous.map((room) =>
          room.id === roomId ? { ...room, unreadCountAdmin: 0 } : room,
        );
      },
    );
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    // Optimistic UX: clear unread badge immediately while server marks read.
    markRoomAsReadInCache(roomId);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  useEffect(() => {
    let supabase;
    try {
      supabase = createClient();
    } catch (error) {
      console.error("Failed to initialize realtime chat subscriptions:", error);
      return;
    }

    const roomsChannel = supabase
      .channel("admin-chat-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.chat.rooms.all,
        });
      })
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    const messagesChannel = supabase
      .channel("admin-chat-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.chat.rooms.all,
        });
        if (selectedRoomRef.current) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.admin.chat.messages(selectedRoomRef.current),
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(messagesChannel);
      setIsRealtimeConnected(false);
    };
  }, [queryClient]);

  // Calculate stats for info sheet (mock or fetch)
  const customerStats = {
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: null,
  }; // TODO: Fetch real stats if needed

  return (
    <div className="h-[calc(100vh-6.5rem)] md:h-[calc(100vh-8.5rem)]">
      <div className="flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Sidebar - Room List */}
        <ChatSidebar
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectRoom={handleSelectRoom}
        />

        {/* Main Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50/30 dark:bg-slate-900/10">
          {selectedRoomId && selectedRoom ? (
            <>
              <ChatHeader
                room={selectedRoom}
                isConnected={isRealtimeConnected}
                onBack={() => setSelectedRoomId(null)} // For mobile mainly
              />

              <MessageList
                roomId={selectedRoomId}
                messages={messages}
                currentUserId={user?.id || ""}
              />

              <ChatInput
                roomId={selectedRoomId}
                senderId={user?.id || ""}
                senderName={user?.fullName || "Agent"}
                onSendMessage={handleSendMessage}
                isSending={sendMessageMutation.isPending}
              />

              <CustomerInfoSheet
                room={selectedRoom}
                customerStats={customerStats}
                isOpen={isInfoOpen}
                onOpenChange={setIsInfoOpen}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Select a chat room to view conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Chat Sidebar component
 */
function ChatSidebar({
  rooms,
  selectedRoomId,
  searchTerm,
  onSearchChange,
  onSelectRoom,
}: {
  rooms: ChatRoomWithDetails[];
  selectedRoomId: string | null;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSelectRoom: (id: string) => void;
}) {
  return (
    <div className="flex w-80 flex-col border-r border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-white pl-9 dark:bg-slate-950"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              data-testid="chat-room-item"
              className={cn(
                "relative flex w-full max-w-full items-start gap-3 overflow-hidden p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                selectedRoomId === room.id &&
                  "z-10 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800",
              )}
            >
              <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                  {room.customer.fullName?.charAt(0) || "K"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="w-0 flex-1 truncate text-sm font-semibold">
                    {room.customer.fullName || "Khách hàng"}
                  </span>
                  <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                    {room.lastMessageAt && (
                      <span className="text-[10px] whitespace-nowrap text-muted-foreground">
                        {new Date(room.lastMessageAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <p className="w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                    {room.lastMessage?.content || "Chưa có tin nhắn"}
                  </p>
                  {room.unreadCountAdmin > 0 && (
                    <Badge
                      variant="destructive"
                      className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full p-0 text-[10px]"
                    >
                      {room.unreadCountAdmin}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy hội thoại nào
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
