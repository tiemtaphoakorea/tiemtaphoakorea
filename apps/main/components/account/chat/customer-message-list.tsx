import type { ChatMessage } from "@workspace/database/services/chat.server";
import { INTERNAL_CHAT_ROLES } from "@workspace/shared/constants";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { MessageCircle, Store } from "lucide-react";
import Image from "next/image";

interface CustomerMessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  formatTime: (date: Date | null) => string;
  formatDateSeparator: (date: Date | null) => string;
}

const INTERNAL_CHAT_ROLE_SET = new Set(INTERNAL_CHAT_ROLES as readonly string[]);

export function CustomerMessageList({
  messages,
  currentUserId,
  messagesEndRef,
  formatTime,
  formatDateSeparator,
}: CustomerMessageListProps) {
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

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {messages.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
            <MessageCircle className="mb-4 h-16 w-16 opacity-50" />
            <h3 className="mb-2 text-lg font-medium">Bắt đầu trò chuyện</h3>
            <p className="max-w-xs text-center text-sm">
              Hãy gửi tin nhắn để bắt đầu trò chuyện với shop. Chúng tôi sẽ phản hồi sớm nhất có
              thể!
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateStr, msgs]) => (
            <div key={dateStr}>
              {/* Date Separator */}
              <div className="my-4 flex items-center justify-center">
                <span className="text-muted-foreground bg-muted rounded-full px-3 py-1 text-xs">
                  {formatDateSeparator(msgs[0]?.createdAt)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {msgs.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  const isFromShop = msg.sender.role
                    ? INTERNAL_CHAT_ROLE_SET.has(msg.sender.role)
                    : false;

                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      {/* Shop Avatar */}
                      {isFromShop && (
                        <div className="bg-primary/10 mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                          <Store className="text-primary h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
                        }`}
                      >
                        {msg.messageType === "image" && msg.imageUrl ? (
                          <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={msg.imageUrl}
                              alt="Chat image"
                              width={400}
                              height={240}
                              className="max-h-60 max-w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
                            />
                          </a>
                        ) : null}

                        {msg.messageType === "text" && msg.content && (
                          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                        )}

                        <p
                          className={`mt-1 text-xs ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
