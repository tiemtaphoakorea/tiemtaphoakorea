import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@workspace/database/lib/supabase/client";
import type { ChatTypingPayload } from "@workspace/shared/types/chat";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { chatClient } from "@/services/chat.client";

interface ChatInputProps {
  roomId: string;
  senderId: string;
  senderName: string;
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
}

const TYPING_EVENT = "typing";
const TYPING_THROTTLE_MS = 1200;
const TYPING_IDLE_MS = 1300;

export function ChatInput({
  roomId,
  senderId,
  senderName,
  onSendMessage,
  isSending,
}: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);

  const emitTyping = useCallback(
    async (isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel || !senderId) return;

      const payload: ChatTypingPayload = {
        roomId,
        senderId,
        senderName: senderName || "Agent",
        isTyping,
      };

      await channel.send({
        type: "broadcast",
        event: TYPING_EVENT,
        payload,
      });
    },
    [roomId, senderId, senderName],
  );

  const clearStopTypingTimer = useCallback(() => {
    if (!stopTypingTimeoutRef.current) return;
    clearTimeout(stopTypingTimeoutRef.current);
    stopTypingTimeoutRef.current = null;
  }, []);

  const scheduleStopTyping = useCallback(() => {
    clearStopTypingTimer();
    stopTypingTimeoutRef.current = setTimeout(() => {
      void emitTyping(false);
      stopTypingTimeoutRef.current = null;
    }, TYPING_IDLE_MS);
  }, [clearStopTypingTimer, emitTyping]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(roomId);
    channelRef.current = channel;
    channel.subscribe();

    return () => {
      clearStopTypingTimer();
      void emitTyping(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
      lastTypingSentAtRef.current = 0;
    };
  }, [roomId, clearStopTypingTimer, emitTyping]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      clearStopTypingTimer();
      void emitTyping(false);
      await onSendMessage(newMessage.trim());
      setNewMessage("");
      const input = inputRef.current;
      if (input) {
        input.focus();
      }
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (!senderId) return;

    const hasContent = value.trim().length > 0;
    if (!hasContent) {
      clearStopTypingTimer();
      void emitTyping(false);
      lastTypingSentAtRef.current = 0;
      return;
    }

    const now = Date.now();
    if (now - lastTypingSentAtRef.current >= TYPING_THROTTLE_MS) {
      lastTypingSentAtRef.current = now;
      void emitTyping(true);
    }
    scheduleStopTyping();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await chatClient.uploadImage({
        roomId,
        file,
        sendAsMessage: true,
      });
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex w-full items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isUploading}
          className="h-12 w-12 rounded-2xl text-slate-500 transition-all hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImageIcon className="h-6 w-6" />
          )}
        </Button>

        <div className="group relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Viết tin nhắn phản hồi..."
            className="focus-visible:ring-primary/20 h-14 rounded-2xl border-slate-100 bg-slate-50 pr-14 text-base font-medium transition-all focus-visible:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:focus-visible:bg-slate-900"
            disabled={isSending || isUploading}
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending || isUploading}
              className={`h-10 w-10 rounded-xl shadow-lg transition-all ${
                newMessage.trim()
                  ? "bg-primary hover:bg-primary/90 shadow-primary/20 scale-100 opacity-100"
                  : "pointer-events-none scale-90 bg-slate-200 opacity-0 dark:bg-slate-800"
              }`}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
