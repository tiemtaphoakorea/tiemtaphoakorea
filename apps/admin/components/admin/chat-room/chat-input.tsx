import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@workspace/database/lib/supabase/client";
import type { ChatTypingPayload } from "@workspace/shared/types/chat";
import { Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ChatInputProps {
  roomId: string;
  senderId: string;
  senderName: string;
  onSendMessage: (message: string) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
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
  onUploadImage,
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
      toast.error("Gửi tin nhắn thất bại");
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
      await onUploadImage(file);
    } catch (err) {
      toast.error("Tải ảnh thất bại");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 transition-colors focus-within:border-slate-300 focus-within:bg-white dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-600 dark:focus-within:bg-slate-900">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isUploading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Gửi ảnh"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Viết tin nhắn phản hồi..."
          disabled={isSending || isUploading}
          className="min-w-0 flex-1 bg-transparent py-1 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending || isUploading}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
            newMessage.trim()
              ? "bg-primary text-white shadow-sm hover:bg-primary/90"
              : "pointer-events-none opacity-0"
          }`}
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
