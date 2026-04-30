"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({
      default: m.RevenueChart,
    })),
  { ssr: false },
);
const CategorySalesChart = dynamic(
  () =>
    import("@/components/admin/analytics/category-sales-chart").then((m) => ({
      default: m.CategorySalesChart,
    })),
  { ssr: false },
);

export default function AnalyticsOverviewPage() {
  "use no memo";
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 lg:col-span-2 dark:bg-slate-700" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-center font-medium text-destructive">
          {error instanceof Error ? error.message : "Không có dữ liệu."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
      </div>
      <AnalyticsHeader data={data} />
      <AnalyticsStats data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueChart data={data.monthlyRevenue} />
        <CategorySalesChart data={data.categorySales} />
      </div>
    </div>
  );
}
