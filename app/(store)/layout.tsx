"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ChatWidget } from "@/components/store/chat-widget";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get or create guest ID for chat identification
    const savedGuestId = localStorage.getItem("chat_guest_id");
    if (savedGuestId) {
      setGuestId(savedGuestId);
    } else {
      const newGuestId = crypto.randomUUID();
      setGuestId(newGuestId);
      localStorage.setItem("chat_guest_id", newGuestId);
    }
  }, []);

  return (
    <div className="bg-background flex min-h-screen flex-col font-sans text-slate-900 antialiased selection:bg-rose-500/30 selection:text-rose-600 dark:text-slate-50">
      <Navbar />
      <main className="w-full flex-1">{children}</main>
      <Footer />
      {mounted && guestId && <ChatWidget guestId={guestId} title="Store Support" />}
    </div>
  );
}
