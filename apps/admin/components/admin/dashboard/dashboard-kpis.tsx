"use client";

import { formatCurrency } from "@repo/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CreditCard, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { adminClient } from "@/services/admin.client";

export function DashboardKPIs() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: () => adminClient.getDashboardKPIs(),
  });

  const stats = data?.kpiStats;

  // With useSuspenseQuery, data is guaranteed to be resolved or error thrown
  // However, based on the previous code stats could be undefined if data is undefined (though suspense usually covers this)
  // Let's keep the optional chaining or ensure type safety if needed.
  // Actually, useSuspenseQuery returns data as TData (not TData | undefined) if successful.

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Doanh thu hôm nay
          </CardTitle>
          <CreditCard className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(stats.todayRevenue)}</div>
          <p className="text-muted-foreground mt-1 text-xs font-medium italic">
            * Chỉ tính đơn đã giao
          </p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Đơn hàng mới
          </CardTitle>
          <ShoppingBag className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.todayOrdersCount}</div>
          <p className="text-muted-foreground mt-1 text-xs font-medium">
            +{stats.pendingOrdersCount} đơn đang chờ duyệt
          </p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Khách hàng mới
          </CardTitle>
          <Users className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.todayCustomersCount}</div>
          <p className="text-muted-foreground mt-1 text-xs font-medium">
            Tài khoản đăng ký hôm nay
          </p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Cảnh báo kho
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-red-500" data-testid="low-stock-count">
            {stats.outOfStockCount + stats.lowStockCount}
          </div>
          <p className="text-muted-foreground mt-1 text-xs font-medium">
            {stats.outOfStockCount} hết hàng, {stats.lowStockCount} sắp hết
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
