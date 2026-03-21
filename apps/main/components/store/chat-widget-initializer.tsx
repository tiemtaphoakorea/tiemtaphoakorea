"use client";

import { useEffect, useState } from "react";
import { ChatWidget } from "@/components/store/chat-widget";

export function ChatWidgetInitializer() {
  const [{ guestId, mounted }, setInit] = useState({ guestId: "", mounted: false });

  useEffect(() => {
    const saved = localStorage.getItem("chat_guest_id");
    const id =
      saved ??
      (() => {
        const newId = crypto.randomUUID();
        localStorage.setItem("chat_guest_id", newId);
        return newId;
      })();
    setInit({ guestId: id, mounted: true });
  }, []);

  if (!mounted || !guestId) return null;
  return <ChatWidget guestId={guestId} title="Store Support" />;
}
