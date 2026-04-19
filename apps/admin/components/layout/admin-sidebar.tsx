import type { UserRole } from "@workspace/database/schema/enums";
import { ROLE } from "@workspace/shared/constants";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
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
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  PieChart,
  Settings2,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { adminClient } from "@/services/admin.client";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: ADMIN_ROUTES.DASHBOARD },
  { icon: Package, label: "Sản phẩm", href: ADMIN_ROUTES.PRODUCTS },
  { icon: FolderOpen, label: "Danh mục", href: ADMIN_ROUTES.CATEGORIES },
  { icon: ShoppingCart, label: "Đơn hàng", href: ADMIN_ROUTES.ORDERS },
  { icon: CircleDollarSign, label: "Công nợ", href: ADMIN_ROUTES.DEBTS },
  { icon: Truck, label: "Nhập hàng", href: ADMIN_ROUTES.SUPPLIER_ORDERS },
  { icon: Building2, label: "Nhà cung cấp", href: ADMIN_ROUTES.SUPPLIERS },
  { icon: Users, label: "Khách hàng", href: ADMIN_ROUTES.CUSTOMERS },
  { icon: Users, label: "Nhân sự", href: ADMIN_ROUTES.USERS },
  { icon: MessageCircle, label: "Tin nhắn", href: ADMIN_ROUTES.CHAT },
  { icon: Wallet, label: "Chi phí", href: ADMIN_ROUTES.EXPENSES },
  { icon: PieChart, label: "Tài chính", href: ADMIN_ROUTES.FINANCE },
  { icon: BarChart3, label: "Báo cáo", href: ADMIN_ROUTES.ANALYTICS },
  { icon: Settings2, label: "Cài đặt", href: ADMIN_ROUTES.SETTINGS },
];

const SECONDARY_ITEMS: { icon: any; label: string; href: string }[] = [];

type AdminSidebarProps = {
  user?: {
    role: UserRole;
    fullName: string;
    email?: string;
  } | null;
};

export function AdminSidebar({ user }: AdminSidebarProps) {
  "use no memo";
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!user) return false;

    // Users (HR) is Owner-only
    if (item.href === ADMIN_ROUTES.USERS) {
      return user.role === ROLE.OWNER;
    }

    // Finance & Expenses are Owner-only
    if (item.href === ADMIN_ROUTES.FINANCE || item.href === ADMIN_ROUTES.EXPENSES) {
      return user.role === ROLE.OWNER;
    }

    // Analytics: Owner and Manager
    if (item.href === ADMIN_ROUTES.ANALYTICS) {
      return user.role === ROLE.OWNER || user.role === ROLE.MANAGER;
    }

    // Settings: Owner only
    if (item.href === ADMIN_ROUTES.SETTINGS) {
      return user.role === ROLE.OWNER;
    }

    // Other operational modules are visible to all internal roles
    return true;
  });

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await adminClient.logout();
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      setIsLoggingOut(false);
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };
  return (
    <Sidebar variant="inset" className="border-sidebar-border border-r">
      <SidebarHeader className="border-sidebar-border flex h-14 items-center border-b px-4">
        <Link href={ADMIN_ROUTES.DASHBOARD} className="group flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">K</span>
          </div>
          <span className="text-primary text-xl font-black tracking-tight">K-SMART</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50 mb-2 px-4 text-[10px] font-black tracking-widest uppercase">
            QUẢN TRỊ
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="h-11 px-4"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon
                        className={`h-5 w-5 ${
                          pathname === item.href ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm font-bold ${
                          pathname === item.href ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild className="h-11 px-4">
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="text-muted-foreground h-5 w-5" />
                      <span className="text-foreground text-sm font-bold">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="border-primary/10 h-9 w-9 border-2">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>KH</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold">{user?.fullName ?? "—"}</span>
            <span className="text-muted-foreground truncate text-[10px] font-bold tracking-tighter uppercase">
              {user?.role ?? ""}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-testid="logout-button"
            className="text-muted-foreground hover:text-destructive shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-50"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
