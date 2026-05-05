"use client";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ADMIN_ROUTE_NAMES, ADMIN_TITLE } from "@workspace/shared/constants";
import { getBreadcrumbName } from "@workspace/shared/utils";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode, Suspense, useEffect, useState } from "react";

const AdminSidebar = dynamic(
  () => import("@/components/layout/admin-sidebar").then((m) => m.AdminSidebar),
  { ssr: false },
);

import { ChatNotificationBell } from "@/components/layout/chat-notification-bell";
import { GlobalSearch } from "@/components/layout/global-search";
import { QUERY_CACHE_PERSIST_KEY, queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.title = ADMIN_TITLE;
  }, []);

  const pathSegments = pathname.split("/").filter(Boolean);

  // Auth redirect handled by axios interceptor — 401 → window.location.href = "/login".
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: queryKeys.admin.profile,
    queryFn: async () => {
      const data = await adminClient.getProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.profile;
    },
    retry: 1,
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  return (
    <SidebarProvider style={{ "--sidebar-width": "13.75rem" } as React.CSSProperties}>
      <AdminSidebar user={user} isLoading={userLoading} />
      <SidebarInset className="bg-muted">
        {/* Topbar — matches Admin CMS design: trigger · breadcrumb · search · bell · avatar */}
        <header className="sticky top-0 z-30 flex h-13.5 shrink-0 items-center gap-3 border-b border-border bg-white px-6">
          <SidebarTrigger className="h-9 w-9 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground" />
          <Breadcrumb className="flex-1">
            <BreadcrumbList className="text-sm">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  asChild
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Link href="/">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {pathSegments.length === 0 && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-foreground">
                      Dashboard
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}

              {pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1;
                const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                const name = getBreadcrumbName(segment, ADMIN_ROUTE_NAMES);

                return (
                  <Fragment key={href}>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-semibold text-foreground">
                          {name}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Link href={href}>{name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <GlobalSearch />

          <ChatNotificationBell />
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-primary text-xs font-bold text-white">
              {user?.fullName?.charAt(0) ?? "A"}
            </AvatarFallback>
          </Avatar>
        </header>

        <main
          className={cn(
            "flex flex-1 flex-col",
            pathname === "/chat" ? "overflow-hidden" : "gap-4 p-5 md:p-6",
          )}
        >
          <div
            key={pathname}
            className={
              pathname === "/chat"
                ? "flex h-full flex-col"
                : "animate-in fade-in slide-in-from-bottom-4 duration-500"
            }
          >
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Defaults tuned for mobile/background-tab resilience:
  // refetchOnWindowFocus + refetchOnReconnect for stale data refresh,
  // retry: 1 (skip 401/403/404), networkMode: "always" for mobile transitions.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            networkMode: "always",
            gcTime: 24 * 60 * 60 * 1000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number })?.status ?? 0;
              if ([401, 403, 404].includes(status)) return false;
              return failureCount < 1;
            },
          },
          mutations: { networkMode: "always" },
        },
      }),
  );

  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      key: QUERY_CACHE_PERSIST_KEY,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        // Only persist profile query — operational data is too volatile to cache across sessions.
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const [root, leaf] = query.queryKey as string[];
            return root === "admin" && leaf === "profile";
          },
        },
      }}
    >
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        }
      >
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </PersistQueryClientProvider>
  );
}
