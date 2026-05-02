"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import dynamic from "next/dynamic";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
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
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
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
      <AnalyticsSubpageHeader
        title="Báo cáo & Thống kê"
        actions={<AnalyticsHeader data={data} />}
      />
      <AnalyticsStats data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueChart data={data.monthlyRevenue} />
        <CategorySalesChart data={data.categorySales} />
      </div>
    </div>
  );
}
