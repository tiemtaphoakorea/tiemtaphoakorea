"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Bell } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function ChatNotificationBell() {
  const { data: rooms = [] } = useQuery({
    queryKey: queryKeys.admin.chat.rooms.all,
    queryFn: () => adminClient.getChatRooms(),
    refetchInterval: 30_000,
  });

  const unreadCount = rooms.reduce((sum, room) => sum + (room.unreadCountAdmin ?? 0), 0);
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={ADMIN_ROUTES.CHAT}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
      title="Tin nhắn"
    >
      <Bell
        className={`h-5 w-5 ${hasUnread ? "text-primary animate-[ring_1s_ease-in-out_infinite]" : "text-muted-foreground"}`}
      />
      {hasUnread && (
        <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
