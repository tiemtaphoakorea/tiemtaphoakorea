"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { IndexCardFinanceTrend } from "@/components/admin/analytics/index-card-finance-trend";
import { IndexCardRevenueMix } from "@/components/admin/analytics/index-card-revenue-mix";
import { IndexCardStockAlert } from "@/components/admin/analytics/index-card-stock-alert";
import { IndexCardTopProducts } from "@/components/admin/analytics/index-card-top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AdminAnalytics() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Nhấn vào từng thẻ để xem chi tiết.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <IndexCardRevenueMix data={data?.categorySales} isLoading={isLoading} />
        <IndexCardFinanceTrend />
        <IndexCardTopProducts data={data?.topProducts} isLoading={isLoading} />
        <IndexCardStockAlert data={data?.inventory} isLoading={isLoading} />
      </div>
    </div>
  );
}
