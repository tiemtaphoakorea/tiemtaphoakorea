import type { ChatMessage } from "@workspace/database/services/chat.server";
import { INTERNAL_CHAT_ROLES } from "@workspace/shared/constants";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface MessageListProps {
  roomId: string;
  messages: ChatMessage[];
  currentUserId: string;
}

export function MessageList({ roomId, messages, currentUserId }: MessageListProps) {
  const internalRoleSet = new Set(INTERNAL_CHAT_ROLES);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialScrollRef = useRef(false);
  const previousRoomIdRef = useRef(roomId);
  const latestMessageId = messages[messages.length - 1]?.id;

  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc, message) => {
      const date = message.createdAt ? new Date(message.createdAt).toDateString() : "unknown";
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    },
    {} as Record<string, ChatMessage[]>,
  );

  // Auto-scroll to latest message whenever a new message arrives
  useEffect(() => {
    if (previousRoomIdRef.current !== roomId) {
      previousRoomIdRef.current = roomId;
      hasInitialScrollRef.current = false;
    }

    if (!latestMessageId) return;

    const behavior: ScrollBehavior = hasInitialScrollRef.current ? "smooth" : "auto";
    const rafId = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    });

    hasInitialScrollRef.current = true;

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [latestMessageId, roomId]);

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateSeparator = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  return (
    <ScrollArea className="flex-1 h-0 bg-slate-50/30">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-4">
        {Object.entries(groupedMessages).map(([dateStr, msgs]) => (
          <div key={dateStr}>
            {/* Date Separator */}
            <div className="my-8 flex items-center justify-center">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="mx-4 rounded-full bg-white px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase shadow-sm ring-1 ring-slate-100">
                {formatDateSeparator(msgs[0]?.createdAt)}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {msgs.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                const isInternalSender = msg.sender.role
                  ? internalRoleSet.has(msg.sender.role as (typeof INTERNAL_CHAT_ROLES)[number])
                  : false;
                const isAgentMessage = isInternalSender && !isOwn;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ring-1 transition-all hover:shadow-md ${
                        isOwn
                          ? "bg-primary text-primary-foreground ring-primary/20"
                          : isAgentMessage
                            ? "bg-blue-50 text-blue-900 ring-blue-200"
                            : "bg-white text-slate-700 ring-slate-200"
                      }`}
                    >
                      {isAgentMessage && (
                        <p className="mb-1 text-[10px] font-black tracking-wide uppercase opacity-80">
                          Agent
                        </p>
                      )}

                      {msg.messageType === "image" && msg.imageUrl ? (
                        <div className="relative mb-2 aspect-video max-h-[400px] w-full overflow-hidden rounded-xl border border-white/20">
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block size-full"
                          >
                            <Image
                              src={msg.imageUrl}
                              alt="Chat image"
                              fill
                              className="cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 400px"
                            />
                          </a>
                        </div>
                      ) : null}

                      {msg.messageType === "text" && msg.content && (
                        <p
                          className={`text-sm leading-relaxed font-medium break-words whitespace-pre-wrap`}
                        >
                          {msg.content}
                        </p>
                      )}

                      <p className={`mt-1.5 text-right text-[10px] font-bold opacity-70`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
