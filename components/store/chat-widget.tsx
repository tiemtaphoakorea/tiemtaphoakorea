"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { RealtimeChat } from "@/components/store/realtime-chat";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ChatWidgetProps } from "@/types/chat";

export function ChatWidget({ userId, guestId, title = "Chat voi AI Agent" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
        >
          {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          <span className="sr-only">Toggle Chat</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="mb-4 h-[500px] max-h-[calc(100vh-2rem)] w-[350px] overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:w-[400px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              <span className="font-semibold">{title}</span>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 bg-background">
            <RealtimeChat userId={userId} guestId={guestId} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
