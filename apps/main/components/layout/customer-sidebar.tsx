import { ACCOUNT_ROUTES, PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Separator } from "@workspace/ui/components/separator";
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
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Tổng quan", href: ACCOUNT_ROUTES.OVERVIEW },
  { icon: ShoppingBag, label: "Đơn mua", href: ACCOUNT_ROUTES.ORDERS },
  { icon: MessageCircle, label: "Chat với Shop", href: ACCOUNT_ROUTES.CHAT },
];

export function CustomerSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  // Helper to determine active state
  const isActive = (path: string) => {
    if (path === ACCOUNT_ROUTES.OVERVIEW) {
      return pathname === ACCOUNT_ROUTES.OVERVIEW;
    }
    return pathname?.startsWith(path) ?? false;
  };

  return (
    <Sidebar variant="inset" className="border-r border-gray-100">
      <SidebarHeader className="flex h-16 items-center border-b border-gray-100 px-4">
        <Link href={PUBLIC_ROUTES.HOME} className="group flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-lg font-bold text-white">K</span>
          </div>
          <span className="text-primary text-xl font-black tracking-tight">K-SMART</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50 mb-2 px-4 text-xs font-black tracking-widest uppercase">
            TÀI KHOẢN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="h-11 px-4"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon
                        className={`h-5 w-5 ${isActive(item.href) ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-sm font-bold ${isActive(item.href) ? "text-primary" : "text-foreground"}`}
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
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex h-14 w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50">
              <Avatar className="border-primary/10 h-10 w-10 border-2">
                <AvatarImage src={profile?.avatarUrl || "https://github.com/shadcn.png"} />
                <AvatarFallback>
                  {profile?.fullName?.charAt(0).toUpperCase() || "KH"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden">
                <span className="truncate text-sm font-bold">{profile?.fullName}</span>
                <span className="text-muted-foreground truncate text-xs font-bold tracking-tighter uppercase">
                  Customer
                </span>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56 rounded-xl p-2">
            <DropdownMenuItem className="h-10 rounded-lg font-bold">
              <User className="mr-2 h-4 w-4" /> Hồ sơ
            </DropdownMenuItem>
            <Separator className="my-2" />
            <DropdownMenuItem asChild>
              <form method="post" action="/logout" className="w-full">
                <button
                  type="submit"
                  className="flex h-10 w-full cursor-pointer items-center rounded-lg px-2 font-bold text-red-500 focus:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
