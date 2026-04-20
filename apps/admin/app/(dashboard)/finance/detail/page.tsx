"use client";

import { useQueries } from "@tanstack/react-query";
import type { FinancialStats } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const MONTH_SHORT = ["", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const MONTH_FULL = [
  "",
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: MONTH_FULL[i + 1] }));
const years = [2024, 2025, 2026];

type Period = { month: number; year: number };

function getPast6Months(month: number, year: number): Period[] {
  return Array.from({ length: 6 }, (_, i) => {
    let m = month - (5 - i);
    let y = year;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    return { month: m, year: y };
  });
}

const trendConfig: ChartConfig = {
  revenue: { label: "Doanh thu", color: "#3b82f6" },
  netProfit: { label: "Lợi nhuận ròng", color: "hsl(var(--primary))" },
};

export default function FinanceDetailPage() {
  return (
    <Suspense fallback={null}>
      <FinanceDetailContent />
    </Suspense>
  );
}

function FinanceDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

  const periods = getPast6Months(month, year);

  const results = useQueries({
    queries: periods.map((p: Period) => ({
      queryKey: queryKeys.admin.finance.stats(p),
      queryFn: () => adminClient.getFinancialStats(p),
    })),
  });

  const updateDate = (newMonth: number, newYear: number) => {
    router.push(`/finance/detail?month=${newMonth}&year=${newYear}`);
  };

  const isLoading = results.some((r) => r.isLoading);
  const currentStats: FinancialStats | undefined = results[5]?.data?.stats;

  const trendData = periods.map((p: Period, i: number) => {
    const stats = results[i]?.data?.stats;
    return {
      name: `${MONTH_SHORT[p.month]}/${String(p.year).slice(2)}`,
      revenue: stats?.revenue ?? 0,
      netProfit: stats?.netProfit ?? 0,
    };
  });

  const grossMargin = currentStats?.revenue
    ? (currentStats.grossProfit / currentStats.revenue) * 100
    : 0;
  const netMargin = currentStats?.revenue
    ? (currentStats.netProfit / currentStats.revenue) * 100
    : 0;
  const expenseRatio = currentStats?.revenue
    ? ((currentStats.cogs + currentStats.expenses) / currentStats.revenue) * 100
    : 0;

  const plData = currentStats
    ? [
        { name: "Doanh thu", value: currentStats.revenue, color: "#3b82f6" },
        { name: "Giá vốn (COGS)", value: -currentStats.cogs, color: "#f97316" },
        {
          name: "Lợi nhuận gộp",
          value: currentStats.grossProfit,
          color: "#8b5cf6",
          isSubtotal: true,
        },
        { name: "Chi phí vận hành", value: -currentStats.expenses, color: "#ef4444" },
        {
          name: "Lợi nhuận ròng",
          value: currentStats.netProfit,
          color: currentStats.netProfit >= 0 ? "#10b981" : "#ef4444",
          isSubtotal: true,
        },
      ]
    : [];

  const prevStats: FinancialStats | undefined = results[4]?.data?.stats;
  const momRevenue = prevStats?.revenue
    ? (((currentStats?.revenue ?? 0) - prevStats.revenue) / prevStats.revenue) * 100
    : null;
  const momProfit = prevStats?.revenue
    ? (((currentStats?.netProfit ?? 0) - prevStats.netProfit) /
        Math.abs(prevStats.netProfit || 1)) *
      100
    : null;

  type InsightLevel = "danger" | "warning" | "good" | "info";
  const insights: { level: InsightLevel; title: string; body: string }[] = [];

  if (!isLoading && currentStats) {
    if (currentStats.revenue === 0) {
      insights.push({
        level: "warning",
        title: "Chưa có doanh thu",
        body: "Tháng này chưa ghi nhận đơn hàng hoàn thành nào. Kiểm tra lại trạng thái đơn hàng.",
      });
    }
    if (currentStats.netProfit < 0) {
      insights.push({
        level: "danger",
        title: "Lợi nhuận âm",
        body: `Đang lỗ ${formatCurrency(Math.abs(currentStats.netProfit))}. Chi phí đang vượt quá doanh thu.`,
      });
    }
    if (currentStats.revenue > 0 && expenseRatio > 70) {
      insights.push({
        level: "warning",
        title: "Tỷ lệ chi phí cao",
        body: `Chi phí chiếm ${expenseRatio.toFixed(1)}% doanh thu, vượt ngưỡng an toàn 70%. Cần tối ưu chi phí.`,
      });
    }
    if (momRevenue !== null && momRevenue < -10) {
      insights.push({
        level: "warning",
        title: "Doanh thu giảm mạnh",
        body: `Doanh thu tháng này giảm ${Math.abs(momRevenue).toFixed(1)}% so với tháng trước.`,
      });
    }
    if (momRevenue !== null && momRevenue > 10) {
      insights.push({
        level: "good",
        title: "Doanh thu tăng trưởng tốt",
        body: `Doanh thu tháng này tăng ${momRevenue.toFixed(1)}% so với tháng trước. Xu hướng tích cực.`,
      });
    }
    if (currentStats.revenue > 0 && netMargin > 20) {
      insights.push({
        level: "good",
        title: "Biên lợi nhuận lành mạnh",
        body: `Tỷ suất lợi nhuận ròng ${netMargin.toFixed(1)}% — vượt ngưỡng tốt 20%. Tiếp tục duy trì.`,
      });
    }
    if (momProfit !== null && momProfit < -20 && currentStats.revenue > 0) {
      insights.push({
        level: "warning",
        title: "Lợi nhuận giảm so với tháng trước",
        body: `Lợi nhuận ròng giảm ${Math.abs(momProfit).toFixed(1)}% so với tháng trước. Cần theo dõi chi phí.`,
      });
    }
    if (insights.length === 0) {
      insights.push({
        level: "info",
        title: "Chưa đủ dữ liệu để phân tích",
        body: "Thêm doanh thu và chi phí để hệ thống đưa ra nhận xét chính xác hơn.",
      });
    }
  }

  const insightConfig: Record<
    InsightLevel,
    { icon: ReactNode; bg: string; border: string; titleColor: string }
  > = {
    danger: {
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
      bg: "bg-red-50 dark:bg-red-900/10",
      border: "border-red-100 dark:border-red-900/30",
      titleColor: "text-red-700 dark:text-red-400",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      bg: "bg-orange-50 dark:bg-orange-900/10",
      border: "border-orange-100 dark:border-orange-900/30",
      titleColor: "text-orange-700 dark:text-orange-400",
    },
    good: {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      bg: "bg-emerald-50 dark:bg-emerald-900/10",
      border: "border-emerald-100 dark:border-emerald-900/30",
      titleColor: "text-emerald-700 dark:text-emerald-400",
    },
    info: {
      icon: <Info className="h-4 w-4 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-900/10",
      border: "border-blue-100 dark:border-blue-900/30",
      titleColor: "text-blue-700 dark:text-blue-400",
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Phân tích tài chính</h1>
          <p className="text-muted-foreground font-medium">
            Insight & xu hướng — {MONTH_FULL[month]}/{year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => updateDate(parseInt(v, 10), year)}>
            <SelectTrigger className="h-11 w-[140px] rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)} className="font-medium">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => updateDate(month, parseInt(v, 10))}>
            <SelectTrigger className="h-11 w-[100px] rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="font-medium">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="p-6">
                <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Biên lợi nhuận gộp
                </p>
                <p
                  className={`mt-3 text-3xl font-black ${grossMargin >= 0 ? "text-blue-600" : "text-red-500"}`}
                >
                  {grossMargin.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Gộp = {formatCurrency(currentStats?.grossProfit ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="p-6">
                <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Biên lợi nhuận ròng
                </p>
                <p
                  className={`mt-3 text-3xl font-black ${netMargin >= 0 ? "text-primary" : "text-red-500"}`}
                >
                  {netMargin.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Ròng = {formatCurrency(currentStats?.netProfit ?? 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardContent className="p-6">
                <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Tỷ lệ chi phí / doanh thu
                </p>
                <p
                  className={`mt-3 text-3xl font-black ${expenseRatio <= 70 ? "text-emerald-500" : "text-orange-500"}`}
                >
                  {expenseRatio.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">Mục tiêu dưới 70%</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Insights */}
      {!isLoading && insights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => {
            const cfg = insightConfig[insight.level];
            return (
              <div key={i} className={`flex gap-3 rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                <div>
                  <p className={`text-sm font-black ${cfg.titleColor}`}>{insight.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {insight.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trend chart */}
      <Card className="gap-0 overflow-hidden rounded-2xl border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase">
            <span className="inline-block h-5 w-1 rounded-full bg-blue-500" />
            Xu hướng 6 tháng gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <>
              <ChartContainer config={trendConfig} className="h-64 w-full">
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profit-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v === 0 ? "0" : `${(v / 1_000_000).toFixed(0)}tr`
                    }
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                    }
                  />
                  <ReferenceLine y={0} stroke="#e2e8f0" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#rev-grad)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#profit-grad)"
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-slate-500">Doanh thu</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-primary h-2.5 w-2.5 rounded-full" />
                  <span className="text-xs font-semibold text-slate-500">Lợi nhuận ròng</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* P&L Breakdown */}
      <Card className="gap-0 overflow-hidden rounded-2xl border-none py-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-500 uppercase">
            <span className="inline-block h-5 w-1 rounded-full bg-violet-500" />
            {"Cơ cấu lợi nhuận (P&L)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (
            <ChartContainer config={{}} className="h-52 w-full">
              <BarChart
                data={plData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}tr`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                  }
                />
                <ReferenceLine x={0} stroke="#e2e8f0" />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {plData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} opacity={entry.isSubtotal ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
