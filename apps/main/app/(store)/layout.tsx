"use client";

import { useState, useSyncExternalStore } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ChatWidget } from "@/components/store/chat-widget";

const SUBSCRIBE = () => () => {};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [guestId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const saved = localStorage.getItem("chat_guest_id");
    if (saved) return saved;
    const newId = crypto.randomUUID();
    localStorage.setItem("chat_guest_id", newId);
    return newId;
  });

  const mounted = useSyncExternalStore(
    SUBSCRIBE,
    () => true,
    () => false,
  );

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans text-slate-900 antialiased selection:bg-rose-500/30 selection:text-rose-600 dark:text-slate-50">
      <Navbar />
      <main className="w-full flex-1">{children}</main>
      <Footer />
      {mounted && guestId && <ChatWidget guestId={guestId} title="Store Support" />}
    </div>
  );
}
