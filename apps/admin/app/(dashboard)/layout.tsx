"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTE_NAMES, ADMIN_TITLE } from "@workspace/shared/constants";
import { getBreadcrumbName } from "@workspace/shared/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { Fragment, type ReactNode, Suspense, useEffect, useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { adminClient } from "@/services/admin.client";

function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.title = ADMIN_TITLE;
  }, []);

  // Generate breadcrumbs from pathname (router has no /admin prefix)
  const pathSegments = pathname.split("/").filter(Boolean);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: async () => {
      const data = await adminClient.getProfile();
      // The API returns { profile: ... } structure based on route.ts
      // eslint_disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.profile;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (isError || !user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset className="bg-muted/40 transition-[margin] peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:ml-[--sidebar-width] md:peer-data-[variant=inset]:rounded-none">
        <header className="glass-header flex h-16 shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground -ml-1 h-10 w-10 rounded-lg transition-colors" />
          <Separator orientation="vertical" className="mr-2 h-full" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  asChild
                  className="text-muted-foreground hover:text-primary font-bold transition-colors"
                >
                  <Link href="/">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              {pathSegments.length === 0 && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-primary font-bold">Dashboard</BreadcrumbPage>
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
                        <BreadcrumbPage className="text-primary font-bold">{name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="text-muted-foreground hover:text-primary font-bold transition-colors"
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
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Create a client for the component tree
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        }
      >
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </Suspense>
    </QueryClientProvider>
  );
}
