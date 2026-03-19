"use client";

import type { AnalyticsData } from "@repo/database/types/admin";
import { axios } from "@repo/shared/api-client";
import { API_ENDPOINTS } from "@repo/shared/api-endpoints";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnalyticsHeader } from "@/components/admin/analytics/analytics-header";
import { AnalyticsStats } from "@/components/admin/analytics/analytics-stats";
import { TopProducts } from "@/components/admin/analytics/top-products";

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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const result = await axios.get(API_ENDPOINTS.ADMIN.ANALYTICS);
        if (!cancelled) setData(result as unknown as AnalyticsData);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "Không thể tải dữ liệu analytics.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-destructive text-center font-medium">{error ?? "Không có dữ liệu."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <AnalyticsHeader data={data} />
      <AnalyticsStats data={data} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <RevenueChart data={data.monthlyRevenue} />
        <CategorySalesChart data={data.categorySales} />
      </div>
      <TopProducts products={data.topProducts} />
    </div>
  );
}
