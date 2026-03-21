import type { ChatMessageItemProps } from "@workspace/shared/types/chat";
import { cn } from "@workspace/ui/lib/utils";

export const ChatMessageItem = ({ message, isOwnMessage, showHeader }: ChatMessageItemProps) => {
  return (
    <div className={`mt-2 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={cn("flex w-fit max-w-[75%] flex-col gap-1", {
          "items-end": isOwnMessage,
        })}
      >
        {showHeader && (
          <div
            className={cn("flex items-center gap-2 px-3 text-xs", {
              "flex-row-reverse justify-end": isOwnMessage,
            })}
          >
            <span className={"font-medium"}>{message.user.name}</span>
            <span className="text-xs text-foreground/50">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            "w-fit rounded-xl px-3 py-2 text-sm",
            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
