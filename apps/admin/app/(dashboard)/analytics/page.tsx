"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import dynamic from "next/dynamic";
import { AnalyticsHubCards } from "@/components/admin/analytics/analytics-hub-cards";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({
      default: m.RevenueChart,
    })),
  { ssr: false },
);

export default function AdminAnalyticsPage() {
  "use no memo";
  const { data } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Báo cáo & Thống kê
        </h1>
        <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
          Tổng quan hoạt động kinh doanh
        </p>
      </div>

      <AnalyticsHubCards />

      {data?.monthlyRevenue && (
        <div className="grid grid-cols-1">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
      )}
    </div>
  );
}
