"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
import { TopProducts } from "@/components/admin/analytics/top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AnalyticsProductsPage() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <AnalyticsSubpageHeader title="Sản phẩm bán chạy" />
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <TopProducts products={data?.topProducts ?? []} />
      )}
    </div>
  );
}
