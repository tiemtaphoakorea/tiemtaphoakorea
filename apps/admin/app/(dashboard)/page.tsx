"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import { BarChart3, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardDebtSummary } from "@/components/admin/dashboard/dashboard-debt-summary";
import { DashboardKPIsSkeleton } from "@/components/admin/dashboard/dashboard-kpis-skeleton";
import { DashboardRecentOrdersSkeleton } from "@/components/admin/dashboard/dashboard-recent-orders-skeleton";

const DashboardKPIs = dynamic(
  () =>
    import("@/components/admin/dashboard/dashboard-kpis").then((m) => ({
      default: m.DashboardKPIs,
    })),
  { ssr: false, loading: () => <DashboardKPIsSkeleton /> },
);
const DashboardRecentOrders = dynamic(
  () =>
    import("@/components/admin/dashboard/dashboard-recent-orders").then((m) => ({
      default: m.DashboardRecentOrders,
    })),
  { ssr: false, loading: () => <DashboardRecentOrdersSkeleton /> },
);

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Trung tâm điều hành
          </h1>
          <p className="text-muted-foreground font-medium">
            Tình hình kinh doanh{" "}
            <span className="text-primary font-bold">
              hôm nay, {new Date().toLocaleDateString("vi-VN")}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-slate-200 font-bold dark:border-slate-800"
            asChild
          >
            <Link href={ADMIN_ROUTES.PRODUCTS}>Quản lý kho</Link>
          </Button>
          <Button className="shadow-primary/20 h-11 gap-2 rounded-xl font-black shadow-lg" asChild>
            <Link href={ADMIN_ROUTES.PRODUCTS_ADD}>
              <Plus className="h-5 w-5" />
              Sản phẩm mới
            </Link>
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<DashboardKPIsSkeleton />}>
          <DashboardKPIs />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <Suspense fallback={<DashboardRecentOrdersSkeleton />}>
              <DashboardRecentOrders />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="flex flex-col gap-4">
          <DashboardDebtSummary />
          <Link
            href={ADMIN_ROUTES.ANALYTICS}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <BarChart3 className="h-4 w-4" />
            Xem báo cáo đầy đủ
          </Link>
        </div>
      </div>
    </div>
  );
}
