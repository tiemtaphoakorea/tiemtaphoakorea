"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardKPIs } from "@/components/admin/dashboard/dashboard-kpis";
import { DashboardKPIsSkeleton } from "@/components/admin/dashboard/dashboard-kpis-skeleton";
import { DashboardRecentOrders } from "@/components/admin/dashboard/dashboard-recent-orders";
import { DashboardRecentOrdersSkeleton } from "@/components/admin/dashboard/dashboard-recent-orders-skeleton";
import { DashboardTopProducts } from "@/components/admin/dashboard/dashboard-top-products";
import { DashboardTopProductsSkeleton } from "@/components/admin/dashboard/dashboard-top-products-skeleton";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ADMIN_ROUTES } from "@/lib/routes";

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

      {/* KPI Cards */}
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
        <div>
          <ErrorBoundary>
            <Suspense fallback={<DashboardTopProductsSkeleton />}>
              <DashboardTopProducts />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
