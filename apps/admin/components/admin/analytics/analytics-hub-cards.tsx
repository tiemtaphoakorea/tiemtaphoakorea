"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import { BarChart3, ChevronRight, Package, TrendingUp, Warehouse } from "lucide-react";
import Link from "next/link";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function AnalyticsHubCards() {
  const { data: kpiData } = useQuery({
    queryKey: queryKeys.dashboard.kpi,
    queryFn: () => adminClient.getDashboardKPIs(),
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  const now = new Date();
  const { data: finance } = useQuery({
    queryKey: queryKeys.admin.finance.stats({ month: now.getMonth() + 1, year: now.getFullYear() }),
    queryFn: () =>
      adminClient.getFinancialStats({ month: now.getMonth() + 1, year: now.getFullYear() }),
  });

  const kpi = kpiData?.kpiStats;
  const topProduct = analytics?.topProducts?.[0];
  const stockAlertCount = (kpi?.outOfStockCount ?? 0) + (kpi?.lowStockCount ?? 0);
  const netProfit = finance?.stats?.netProfit ?? 0;
  const revenue = finance?.stats?.revenue ?? 0;
  const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0.0";

  const cards = [
    {
      href: ADMIN_ROUTES.ANALYTICS_OVERVIEW,
      icon: BarChart3,
      label: "Tổng quan",
      headline: formatCurrency(kpi?.todayRevenue ?? 0),
      sub: "Doanh thu hôm nay",
      color: "text-blue-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_PRODUCTS,
      icon: Package,
      label: "Sản phẩm",
      headline: topProduct?.name ?? "—",
      sub: topProduct ? `${topProduct.sales} đã bán (7 ngày)` : "Chưa có dữ liệu",
      color: "text-violet-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_INVENTORY,
      icon: Warehouse,
      label: "Tồn kho",
      headline: `${stockAlertCount} SP`,
      sub: stockAlertCount > 0 ? "Sắp hết hoặc đã hết hàng" : "Tồn kho ổn định",
      color: stockAlertCount > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      href: ADMIN_ROUTES.ANALYTICS_FINANCE,
      icon: TrendingUp,
      label: "Tài chính",
      headline: formatCurrency(netProfit),
      sub: `LN ròng tháng này · ${margin}% margin`,
      color: netProfit >= 0 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ href, icon: Icon, label, headline, sub, color }) => (
        <Link key={href} href={href} className="group block">
          <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 transition-shadow group-hover:shadow-md dark:ring-slate-800">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <div className={`truncate text-xl font-black ${color}`}>{headline}</div>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{sub}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
