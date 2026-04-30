"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
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
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Sản phẩm bán chạy
        </h1>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <TopProducts products={data?.topProducts ?? []} />
      )}
    </div>
  );
}
