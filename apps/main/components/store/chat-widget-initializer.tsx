"use client";

import { useSyncExternalStore } from "react";
import { ChatWidget } from "@/components/store/chat-widget";

interface ChatWidgetInitializerProps {
  phoneNumber?: string;
  messengerUrl?: string;
}

export function ChatWidgetInitializer({ phoneNumber, messengerUrl }: ChatWidgetInitializerProps) {
  const guestId = useSyncExternalStore(
    () => () => {},
    () => {
      const saved = localStorage.getItem("chat_guest_id");
      if (saved) return saved;

      const newId = crypto.randomUUID();
      localStorage.setItem("chat_guest_id", newId);
      return newId;
    },
    () => "",
  );

  if (!guestId) return null;
  return (
    <ChatWidget
      guestId={guestId}
      title="Store Support"
      phoneNumber={phoneNumber}
      messengerUrl={messengerUrl}
    />
  );
}
