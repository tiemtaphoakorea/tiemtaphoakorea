"use client";

import type { ChatWidgetProps } from "@workspace/shared/types/chat";
import { Button } from "@workspace/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import { RealtimeChat } from "@/components/store/realtime-chat";

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.879 1.408 5.44 3.574 7.227V21l3.276-1.802c.875.242 1.802.372 2.75.372C17.523 19.57 22 15.426 22 11.243 22 6.145 17.523 2 12 2zm1.2 12.388-3.06-3.267-5.975 3.267 6.571-6.979 3.135 3.267 5.9-3.267-6.571 6.979z" />
    </svg>
  );
}

function OptionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-background px-2.5 py-1 text-sm font-medium shadow-md">
      {children}
    </span>
  );
}

export function ChatWidget({
  userId,
  guestId,
  title = "Chat voi AI Agent",
  phoneNumber,
  messengerUrl,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const sanitizedPhone = phoneNumber?.replace(/[^\d+]/g, "");

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-4">
      {/* AI Chat (collapsible) */}
      {isOpen && (
        <Popover open={isChatOpen} onOpenChange={setIsChatOpen}>
          <div className="flex items-center gap-2">
            <OptionLabel>{title}</OptionLabel>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
              >
                <MessageCircle className="size-5" />
                <span className="sr-only">Mở chat AI</span>
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent
            align="end"
            side="top"
            className="mb-4 h-[calc(100svh-10rem)] w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:h-[500px] sm:w-[400px]"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
                <MessageCircle className="size-5" />
                <span className="font-semibold">{title}</span>
              </div>
              <div className="relative min-h-0 flex-1 bg-background">
                <RealtimeChat userId={userId} guestId={guestId} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Messenger — always visible */}
      {messengerUrl && (
        <Button
          asChild
          size="icon"
          aria-label="Chat qua Messenger"
          className="h-12 w-12 rounded-full bg-[#0099FF] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#0088EE]"
        >
          <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
            <MessengerIcon className="size-5" />
            <span className="sr-only">Chat qua Messenger</span>
          </a>
        </Button>
      )}

      {/* Phone — always visible */}
      {sanitizedPhone && (
        <Button
          asChild
          size="icon"
          aria-label="Gọi điện thoại"
          className="h-12 w-12 rounded-full bg-green-500 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-green-600"
        >
          <a href={`tel:${sanitizedPhone}`}>
            <Phone className="size-5" />
            <span className="sr-only">Gọi điện thoại</span>
          </a>
        </Button>
      )}

      {/* Main FAB (AI chat toggle) */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        <span className="sr-only">Liên hệ hỗ trợ</span>
      </Button>
    </div>
  );
}
