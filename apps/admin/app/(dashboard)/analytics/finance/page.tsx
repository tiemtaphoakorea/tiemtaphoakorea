"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { ErrorBoundary } from "@workspace/ui/components/error-boundary";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FinanceDayDrawer } from "@/components/admin/analytics/finance-day-drawer";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const FinanceStats = dynamic(
  () =>
    import("@/components/admin/finance/finance-stats").then((m) => ({ default: m.FinanceStats })),
  { ssr: false },
);

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toISO(now),
  };
}

export default function AnalyticsFinancePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRange: DateRange = {
    startDate: searchParams.get("from") ?? getThisMonthRange().startDate,
    endDate: searchParams.get("to") ?? getThisMonthRange().endDate,
  };

  const [range, setRange] = useState<DateRange>(initialRange);
  const [openDay, setOpenDay] = useState<string | null>(searchParams.get("day"));

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("from", range.startDate);
    params.set("to", range.endDate);
    if (openDay) params.set("day", openDay);
    router.replace(`${ADMIN_ROUTES.ANALYTICS_FINANCE}?${params.toString()}`, { scroll: false });
  }, [range, openDay, router]);

  function handleRangeChange(newRange: DateRange) {
    setRange(newRange);
    setOpenDay(null);
  }

  const isSingleDay = range.startDate === range.endDate;
  const rangeStartDate = new Date(range.startDate);
  const financeDate = {
    month: rangeStartDate.getMonth() + 1,
    year: rangeStartDate.getFullYear(),
  };

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: queryKeys.admin.finance.daily(range),
    queryFn: () => adminClient.getDailyFinancialStats(range),
    enabled: !isSingleDay,
  });

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.ANALYTICS}>← Báo cáo</Link>
        </Button>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Tài chính & Lợi nhuận
        </h1>
      </div>

      <FinanceRangePicker value={range} onChange={handleRangeChange} />

      <ErrorBoundary>
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />}
        >
          <FinanceStats date={financeDate} />
        </Suspense>
      </ErrorBoundary>

      {!isSingleDay && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-black tracking-wide text-slate-700 uppercase dark:text-slate-300">
            Chi tiết theo ngày
          </h2>
          {isDailyLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700"
                />
              ))}
            </div>
          ) : !dailyData?.dailyData?.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              Không có giao dịch trong khoảng này.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl ring-1 ring-slate-200 md:block dark:ring-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {["Ngày", "Doanh thu", "COGS", "LN gộp", "Đơn hàng", ""].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-black tracking-wider text-slate-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...dailyData.dailyData].reverse().map((row) => (
                      <tr
                        key={row.date}
                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => setOpenDay(row.date)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                          {new Date(row.date).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 font-bold text-blue-600">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-500">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td
                          className={`px-4 py-3 font-bold ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{row.orderCount}</td>
                        <td className="px-4 py-3 text-right text-slate-400">→</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-2 md:hidden">
                {[...dailyData.dailyData].reverse().map((row) => (
                  <button
                    key={row.date}
                    type="button"
                    onClick={() => setOpenDay(row.date)}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {new Date(row.date).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="text-xs text-slate-500">{row.orderCount} đơn</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-black text-blue-600">
                        {formatCurrency(row.revenue)}
                      </span>
                      <span
                        className={`text-xs font-bold ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        LN {formatCurrency(row.grossProfit)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <FinanceDayDrawer date={openDay} onClose={() => setOpenDay(null)} />
    </div>
  );
}
