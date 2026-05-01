"use client";

import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Heart, Home, LayoutGrid, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Trang chủ", icon: Home, href: PUBLIC_ROUTES.HOME, match: (p: string) => p === "/" },
  {
    label: "Danh mục",
    icon: LayoutGrid,
    href: PUBLIC_ROUTES.PRODUCTS,
    match: (p: string) => p.startsWith("/product"),
  },
  {
    label: "Yêu thích",
    icon: Heart,
    href: ACCOUNT_ROUTES.WISHLIST,
    match: (p: string) => p.startsWith("/account/wishlist"),
  },
  {
    label: "Tài khoản",
    icon: User,
    href: ACCOUNT_ROUTES.ROOT,
    match: (p: string) => p === "/account" || p.startsWith("/account"),
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <div
      aria-hidden="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <nav
        aria-label="Điều hướng chính"
        className="pointer-events-auto grid w-full max-w-md grid-cols-4 rounded-full border border-border bg-background/95 px-2 py-1.5 shadow-[0_12px_32px_rgba(99,102,241,0.18),0_2px_8px_rgba(17,24,39,0.06)] backdrop-blur-md"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-colors ${
                active ? "bg-[var(--primary-soft,#EEF2FF)] text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-[20px] w-[20px] ${active ? "stroke-[2.4]" : "stroke-2"}`} />
              <span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
