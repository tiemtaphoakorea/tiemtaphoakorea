"use client";

import type { ChatWidgetProps } from "@workspace/shared/types/chat";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";
import { MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RealtimeChat } from "@/components/store/realtime-chat";

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.879 1.408 5.44 3.574 7.227V21l3.276-1.802c.875.242 1.802.372 2.75.372C17.523 19.57 22 15.426 22 11.243 22 6.145 17.523 2 12 2zm1.2 12.388-3.06-3.267-5.975 3.267 6.571-6.979 3.135 3.267 5.9-3.267-6.571 6.979z" />
    </svg>
  );
}

function OptionLabel({
  children,
  state,
  delay,
}: {
  children: React.ReactNode;
  state: "open" | "closed";
  delay: string;
}) {
  return (
    <span
      data-state={state}
      style={{ transitionDelay: delay }}
      className="rounded-lg bg-background px-2.5 py-1 text-sm font-medium text-foreground shadow-md transition-all duration-200 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:translate-x-2 data-[state=closed]:opacity-0"
    >
      {children}
    </span>
  );
}

/** Per-item enter/exit + stagger transform — driven by `data-state`. */
const SPEED_DIAL_ITEM_CLS =
  "transition-all duration-200 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 data-[state=closed]:scale-90";

export function ChatWidget({
  userId,
  guestId,
  title = "Chat voi AI Agent",
  phoneNumber,
  messengerUrl,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // < sm breakpoint (640px) → bottom-sheet; ≥ sm → right-side drawer.
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Hide FAB while scrolling down past 120px; re-show on scroll up.
  // Material Design FAB pattern — keeps the last row of content reachable while reading.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y > 120 && dy > 5) setHidden(true);
        else if (dy < -5) setHidden(false);
        lastY = y;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hide FAB while the footer is in viewport — newsletter input/Đăng ký button sits beneath
  // the FAB at right-4 bottom-20 on mobile, otherwise gets visually obstructed.
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry?.isIntersecting ?? false),
      { rootMargin: "0px" },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [mounted]);

  const sanitizedPhone = phoneNumber?.replace(/[^\d+]/g, "");
  const state = isOpen ? "open" : "closed";
  // Stagger delay grows from bottom-most secondary FAB upward.
  const delayFor = (idx: number) => (isOpen ? `${idx * 50}ms` : "0ms");

  if (!mounted) return null;

  const content = (
    <>
      {/* Backdrop — clicking it collapses the speed-dial. */}
      <button
        type="button"
        aria-label="Đóng menu"
        tabIndex={isOpen && !isChatOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200",
          isOpen && !isChatOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* FAB stack */}
      <div
        className={cn(
          "fixed right-4 bottom-20 z-50 flex flex-col items-end gap-3 transition-all duration-200 ease-out md:bottom-4",
          isChatOpen && "hidden",
          // Auto-hide while reading or when footer is in view — only when speed-dial is collapsed.
          (hidden || footerVisible) && !isOpen && "pointer-events-none translate-y-[140%] opacity-0",
        )}
      >
        {/* AI Chat — secondary FAB (top of stack). */}
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <div className="flex items-center gap-2">
            <OptionLabel state={state} delay={delayFor(3)}>
              {title}
            </OptionLabel>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="icon"
                data-state={state}
                style={{ transitionDelay: delayFor(2) }}
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg hover:scale-105",
                  SPEED_DIAL_ITEM_CLS,
                )}
              >
                <MessageCircle className="size-5" />
                <span className="sr-only">Mở chat AI</span>
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            showCloseButton={false}
            className={cn(
              "flex flex-col gap-0 overflow-hidden p-0",
              isMobile
                ? // Mobile bottom-sheet — 90% viewport height with rounded top corners.
                  "h-[90svh] rounded-t-2xl border-t data-[side=bottom]:!h-[90svh]"
                : // Desktop right-side drawer.
                  "h-svh border-l-0 data-[side=right]:!w-[420px] sm:!max-w-[420px] sm:border-l",
            )}
          >
            <SheetHeader className="flex flex-row items-center gap-2 bg-primary p-4 text-primary-foreground">
              <MessageCircle className="size-5" />
              <SheetTitle className="text-primary-foreground">{title}</SheetTitle>
              <button
                type="button"
                aria-label="Đóng chat"
                onClick={() => setIsChatOpen(false)}
                className="ml-auto rounded-full p-1 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <X className="size-5" />
              </button>
            </SheetHeader>
            <div className="relative min-h-0 flex-1 bg-background">
              <RealtimeChat userId={userId} guestId={guestId} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Messenger */}
        {messengerUrl && (
          <Button
            asChild
            size="icon"
            aria-label="Chat qua Messenger"
            data-state={state}
            style={{ transitionDelay: delayFor(1) }}
            className={cn(
              "h-12 w-12 rounded-full bg-[#0099FF] text-white shadow-lg hover:scale-105 hover:bg-[#0088EE]",
              SPEED_DIAL_ITEM_CLS,
            )}
          >
            <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
              <MessengerIcon className="size-5" />
              <span className="sr-only">Chat qua Messenger</span>
            </a>
          </Button>
        )}

        {/* Phone */}
        {sanitizedPhone && (
          <Button
            asChild
            size="icon"
            aria-label="Gọi điện thoại"
            data-state={state}
            style={{ transitionDelay: delayFor(0) }}
            className={cn(
              "h-12 w-12 rounded-full bg-green-500 text-white shadow-lg hover:scale-105 hover:bg-green-600",
              SPEED_DIAL_ITEM_CLS,
            )}
          >
            <a href={`tel:${sanitizedPhone}`}>
              <Phone className="size-5" />
              <span className="sr-only">Gọi điện thoại</span>
            </a>
          </Button>
        )}

        {/* Main FAB — always visible, rotates icon when toggled. */}
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <span
            className={cn(
              "grid place-items-center transition-transform duration-300",
              isOpen ? "rotate-90" : "rotate-0",
            )}
          >
            {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          </span>
          <span className="sr-only">Liên hệ hỗ trợ</span>
        </Button>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
