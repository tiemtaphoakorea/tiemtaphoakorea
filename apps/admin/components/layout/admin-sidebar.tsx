import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "@workspace/database/schema/enums";
import { ROLE } from "@workspace/shared/constants";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  Package,
  Settings2,
  ShoppingCart,
  Truck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type BadgeTone = "red" | "amber" | "indigo";
type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Quản trị",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
      { icon: Package, label: "Sản phẩm", href: ADMIN_ROUTES.PRODUCTS },
      { icon: FolderOpen, label: "Danh mục", href: ADMIN_ROUTES.CATEGORIES },
      { icon: ShoppingCart, label: "Đơn hàng", href: ADMIN_ROUTES.ORDERS },
    ],
  },
  {
    label: "Tài chính",
    items: [
      { icon: CircleDollarSign, label: "Công nợ", href: ADMIN_ROUTES.DEBTS },
      { icon: CreditCard, label: "Chi phí", href: ADMIN_ROUTES.EXPENSES },
      { icon: BarChart3, label: "Báo cáo", href: ADMIN_ROUTES.ANALYTICS },
    ],
  },
  {
    label: "Kho vận",
    items: [
      { icon: Truck, label: "Quản lý kho", href: ADMIN_ROUTES.INVENTORY },
      { icon: Building2, label: "Nhà cung cấp", href: ADMIN_ROUTES.SUPPLIERS },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { icon: Users, label: "Khách hàng", href: ADMIN_ROUTES.CUSTOMERS },
      { icon: User, label: "Nhân sự", href: ADMIN_ROUTES.USERS },
      { icon: MessageCircle, label: "Tin nhắn", href: ADMIN_ROUTES.CHAT },
    ],
  },
  {
    label: "Hệ thống",
    items: [{ icon: Settings2, label: "Cài đặt", href: ADMIN_ROUTES.SETTINGS }],
  },
];

type AdminSidebarProps = {
  user?: { role: UserRole; fullName: string; email?: string } | null;
  isLoading?: boolean;
};

function visibleForRole(href: string, role?: UserRole): boolean {
  if (!role) return false;
  if (href === ADMIN_ROUTES.USERS) return role === ROLE.OWNER;
  if (href === ADMIN_ROUTES.EXPENSES) return role === ROLE.OWNER;
  if (href === ADMIN_ROUTES.SETTINGS) return role === ROLE.OWNER;
  if (href === ADMIN_ROUTES.ANALYTICS) return role === ROLE.OWNER || role === ROLE.MANAGER;
  return true;
}

const badgeToneClass: Record<BadgeTone, string> = {
  red: "bg-destructive text-white",
  amber: "bg-amber-500 text-white",
  indigo: "bg-primary text-white",
};

/** Debts older than this many days surface as "quá hạn" in the sidebar. */
const DEBT_OVERDUE_DAYS = 30;

type DynamicBadge = { text: string; tone: BadgeTone };

/** Live counts for sidebar badges. Polls in the background; cache shared with bell + dashboard. */
function useSidebarBadges(enabled: boolean): Record<string, DynamicBadge | undefined> {
  const orderStats = useQuery({
    queryKey: queryKeys.orders.stats,
    queryFn: () => adminClient.getOrderStats(),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const overdueDebts = useQuery({
    queryKey: queryKeys.debts.list("", DEBT_OVERDUE_DAYS, 1, 1),
    queryFn: () => adminClient.getDebts({ minAgeDays: DEBT_OVERDUE_DAYS, page: 1, limit: 1 }),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const chatRooms = useQuery({
    queryKey: queryKeys.admin.chat.rooms.all,
    queryFn: () => adminClient.getChatRooms(),
    enabled,
    refetchInterval: 30_000,
  });
  const productCount = useQuery({
    queryKey: queryKeys.products.list("", 1, 1, "all"),
    queryFn: () => adminClient.getProducts({ page: 1, limit: 1, stockStatus: "all" }),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const totalProducts = productCount.data?.metadata?.total ?? 0;
  const pendingCount = orderStats.data?.pending ?? 0;
  const overdueCount = overdueDebts.data?.metadata?.total ?? 0;
  const unreadCount =
    chatRooms.data?.reduce((sum, room) => sum + (room.unreadCountAdmin ?? 0), 0) ?? 0;

  return {
    [ADMIN_ROUTES.PRODUCTS]:
      totalProducts > 0 ? { text: `${totalProducts} SP`, tone: "indigo" } : undefined,
    [ADMIN_ROUTES.ORDERS]:
      pendingCount > 0 ? { text: `${pendingCount} mới`, tone: "amber" } : undefined,
    [ADMIN_ROUTES.DEBTS]:
      overdueCount > 0 ? { text: `${overdueCount} quá hạn`, tone: "red" } : undefined,
    [ADMIN_ROUTES.CHAT]:
      unreadCount > 0
        ? { text: unreadCount > 99 ? "99+" : String(unreadCount), tone: "indigo" }
        : undefined,
  };
}

export function AdminSidebar({ user, isLoading }: AdminSidebarProps) {
  "use no memo";
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const badges = useSidebarBadges(!!user);

  return (
    <Sidebar
      variant="sidebar"
      className="border-sidebar-border border-r bg-white [&_[data-sidebar=sidebar]]:bg-white"
    >
      <SidebarHeader className="border-sidebar-border flex h-[54px] flex-row items-center gap-2.5 border-b px-4">
        <Link href={ADMIN_ROUTES.DASHBOARD} className="flex items-center gap-2.5">
          <div className="bg-primary grid h-[34px] w-[34px] place-items-center rounded-[9px] font-black text-white text-[17px]">
            A
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground">Admin CMS</span>
            <span className="text-[11px] text-muted-foreground">Tiệm Korea</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((it) => visibleForRole(it.href, user?.role));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="px-2 pt-3.5 pb-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/60 uppercase">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {!mounted || isLoading
                    ? Array.from({ length: visibleItems.length }).map((_, i) => (
                        <SidebarMenuItem key={i}>
                          <div className="flex h-9 items-center gap-2.5 px-3.5">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-3 w-20 rounded" />
                          </div>
                        </SidebarMenuItem>
                      ))
                    : visibleItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                        const badge = badges[item.href];
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              tooltip={item.label}
                              className="rounded-sm py-2 pl-3.5 pr-3 text-[13px] font-medium text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                            >
                              <Link href={item.href} className="flex items-center gap-2.5">
                                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                                <span className="flex-1 truncate">{item.label}</span>
                                {badge && (
                                  <span
                                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeToneClass[badge.tone]}`}
                                  >
                                    {badge.text}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-3">
        <button className="flex w-full items-center gap-[9px] rounded-lg px-[14px] py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-[#F4F5F7] hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <User className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {user?.fullName ?? "Admin Shop"}
          </span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
