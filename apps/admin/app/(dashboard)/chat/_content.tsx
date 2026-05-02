"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, ChatRoomWithDetails } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ArrowLeft, ImageIcon, Send } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const fmtTime = (d: Date | string | null): string => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export default function AdminMessages() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const roomsQuery = useQuery({
    queryKey: queryKeys.admin.chat.rooms.list(debouncedSearch),
    queryFn: () => adminClient.getChatRooms({ search: debouncedSearch || undefined }),
    staleTime: 15_000,
  });

  // Auto-select first room on first load.
  const rooms = roomsQuery.data ?? [];
  const currentRoomId = activeRoomId ?? rooms[0]?.id ?? null;
  const currentRoom: ChatRoomWithDetails | undefined = rooms.find((r) => r.id === currentRoomId);

  const messagesQuery = useQuery({
    queryKey: queryKeys.admin.chat.messages(currentRoomId),
    queryFn: async () => {
      if (!currentRoomId) return { messages: [] as ChatMessage[] };
      return adminClient.getChatMessages(currentRoomId);
    },
    enabled: !!currentRoomId,
    staleTime: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ roomId, content }: { roomId: string; content: string }) =>
      adminClient.sendChatMessage({ roomId, content }),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.chat.messages(currentRoomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.chat.rooms.all });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ roomId, file }: { roomId: string; file: File }) =>
      adminClient.uploadChatImage({ roomId, file }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.chat.messages(currentRoomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.chat.rooms.all });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !currentRoomId || uploadMutation.isPending) return;
    uploadMutation.mutate({ roomId: currentRoomId, file });
  };

  const unreadCount = rooms.reduce((s, r) => s + (r.unreadCountAdmin ?? 0), 0);
  const messages = messagesQuery.data?.messages ?? [];

  // On mobile only one pane is visible at a time; desktop shows both via md: classes.
  const showConversation = !!activeRoomId;

  return (
    <Card className="grid h-[calc(100vh-54px-48px)] min-h-[400px] grid-cols-1 overflow-hidden border border-border p-0 shadow-none md:grid-cols-[280px_1fr]">
      {/* Conversations list */}
      <div
        className={`flex-col overflow-y-auto border-r border-border bg-white md:flex ${
          showConversation ? "hidden" : "flex"
        }`}
      >
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
          <div className="text-[13px] font-semibold">Hộp thư ({unreadCount} chưa đọc)</div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm khách hàng..."
            className="h-8 rounded-md border-border bg-muted/40 px-2.5 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus-visible:ring-0"
          />
        </div>
        {roomsQuery.isLoading && (
          <div className="flex flex-col gap-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        )}
        {!roomsQuery.isLoading && rooms.length === 0 && (
          <div className="px-4 py-10 text-center text-xs text-muted-foreground">
            Chưa có cuộc trò chuyện
          </div>
        )}
        {rooms.map((r) => {
          const isActive = r.id === currentRoomId;
          const initial = r.customer.fullName?.charAt(0) ?? "?";
          const preview = r.lastMessage?.content ?? "—";
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRoomId(r.id)}
              className={`flex items-start gap-2.5 border-b border-border px-3.5 py-3 text-left transition-colors ${
                isActive ? "bg-primary/10" : "hover:bg-muted/40"
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                  isActive ? "bg-primary" : "bg-blue-500"
                }`}
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold">{r.customer.fullName ?? "—"}</div>
                  <div className="ml-2 shrink-0 text-[10px] text-muted-foreground/70">
                    {fmtTime(r.lastMessageAt)}
                  </div>
                </div>
                <div className="mt-0.5 max-w-[180px] truncate text-xs text-muted-foreground">
                  {preview}
                </div>
              </div>
              {r.unreadCountAdmin > 0 && (
                <div className="mt-1.5 grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {r.unreadCountAdmin}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active conversation */}
      <div className={`flex-col bg-slate-50 md:flex ${showConversation ? "flex" : "hidden"}`}>
        <div className="flex items-center gap-2.5 border-b border-border bg-white px-[18px] py-3.5">
          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            aria-label="Quay lại danh sách"
            className="md:hidden grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-muted/40"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </button>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
            {currentRoom?.customer.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="leading-tight">
            <b className="text-sm font-semibold">{currentRoom?.customer.fullName ?? "—"}</b>
            <small className="block text-xs text-muted-foreground">
              {currentRoom?.customer.phone ?? "Khách hàng"}
            </small>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] py-4">
          {messagesQuery.isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-2/3 rounded-xl" />
              ))}
            </div>
          )}
          {!messagesQuery.isLoading && messages.length === 0 && (
            <div className="self-center py-10 text-xs text-muted-foreground">
              Chưa có tin nhắn — hãy bắt đầu cuộc trò chuyện
            </div>
          )}
          {messages.map((m) => {
            const fromAdmin = m.sender.role !== "customer";
            return (
              <Fragment key={m.id}>
                <div
                  className={`max-w-[72%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    fromAdmin
                      ? "self-end rounded-br-sm bg-primary text-white"
                      : "self-start rounded-bl-sm border border-border bg-white"
                  }`}
                >
                  {m.imageUrl ? (
                    // biome-ignore lint/performance/noImgElement: chat upload URL
                    <img src={m.imageUrl} alt="attachment" className="max-w-[200px] rounded-md" />
                  ) : (
                    m.content
                  )}
                </div>
                <div
                  className={`px-1 text-[10px] text-muted-foreground/70 ${fromAdmin ? "self-end" : "self-start"}`}
                >
                  {fmtTime(m.createdAt)}
                </div>
              </Fragment>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!currentRoomId || !draft.trim() || sendMutation.isPending) return;
            sendMutation.mutate({ roomId: currentRoomId, content: draft.trim() });
          }}
          className="flex gap-2 border-t border-border bg-white px-4 py-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Tải ảnh lên"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentRoomId || uploadMutation.isPending}
            aria-label="Gửi ảnh"
            className="gap-1.5"
          >
            <ImageIcon className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={!currentRoomId || sendMutation.isPending}
            className="h-auto flex-1 rounded-lg border-border px-3.5 py-2.5 focus:border-primary focus-visible:ring-0 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!currentRoomId || !draft.trim() || sendMutation.isPending}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </form>
      </div>
    </Card>
  );
}
