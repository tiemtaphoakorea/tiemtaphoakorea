"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@workspace/database/types/admin";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import dynamic from "next/dynamic";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { InventoryStats } from "@/components/admin/analytics/inventory-stats";
import { LowStockList } from "@/components/admin/analytics/low-stock-list";
import { OutOfStockList } from "@/components/admin/analytics/out-of-stock-list";
import { TopProducts } from "@/components/admin/analytics/top-products";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/analytics/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  { ssr: false },
);
const CategorySalesChart = dynamic(
  () =>
    import("@/components/admin/analytics/category-sales-chart").then((m) => ({
      default: m.CategorySalesChart,
    })),
  { ssr: false },
);

export default function AdminAnalyticsPage() {
  "use no memo";
  const { data, isLoading, error } = useQuery<AnalyticsData>({
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-destructive text-center font-medium">
          {error instanceof Error ? error.message : "Không có dữ liệu."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <AnalyticsHeader data={data} />

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="inventory">Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 flex flex-col gap-8">
          <AnalyticsStats data={data} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <RevenueChart data={data.monthlyRevenue} />
            <CategorySalesChart data={data.categorySales} />
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <TopProducts products={data.topProducts} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6 flex flex-col gap-8">
          {data.inventory && <InventoryStats data={data.inventory} />}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="pt-6">
                {isLoadingStock ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
                      />
                    ))}
                  </div>
                ) : (
                  <LowStockList items={stockAlerts?.lowStock ?? []} />
                )}
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="pt-6">
                {isLoadingStock ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
                      />
                    ))}
                  </div>
                ) : (
                  <OutOfStockList items={stockAlerts?.outOfStock ?? []} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
