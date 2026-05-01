"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card, CardContent } from "@workspace/ui/components/card";
import Link from "next/link";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import { LowStockList } from "@/components/admin/analytics/low-stock-list";
import { OutOfStockList } from "@/components/admin/analytics/out-of-stock-list";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function AnalyticsInventoryPage() {
  "use no memo";
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      const result = await adminClient.getAnalytics();
      return result as unknown as AnalyticsData;
    },
  });

  const { data: stockAlerts, isLoading: isLoadingStock } = useQuery({
    queryKey: queryKeys.admin.stockAlerts,
    queryFn: () => adminClient.getStockAlerts(),
  });

  const stockLoading = isLoading || isLoadingStock;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href={ADMIN_ROUTES.ANALYTICS}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Báo cáo
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tồn kho</h1>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        data?.inventory && <InventoryStats data={data.inventory} />
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : (
              <LowStockList items={stockAlerts?.lowStock ?? []} />
            )}
          </CardContent>
        </Card>
        <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="pt-6">
            {stockLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : (
              <OutOfStockList items={stockAlerts?.outOfStock ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
