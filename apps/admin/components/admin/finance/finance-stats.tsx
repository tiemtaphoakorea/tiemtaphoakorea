"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowUpRight, DollarSign, PieChart, TrendingUp, Wallet } from "lucide-react";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface FinanceStatsProps {
  date: {
    month: number;
    year: number;
  };
}

export function FinanceStats({ date }: FinanceStatsProps) {
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.admin.finance.stats(date),
    queryFn: () => adminClient.getFinancialStats(date),
  });

  const stats = data?.stats;

  if (!stats) return null;

  const topItems: MetricStatItem[] = [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(stats.revenue || 0),
      icon: <DollarSign className="h-3.5 w-3.5" />,
      iconClassName: "bg-blue-500/10 text-blue-500",
      trend: {
        icon: <ArrowUpRight className="h-3 w-3" />,
        text: "Ghi nhận theo đơn hoàn thành",
        className: "text-muted-foreground",
      },
    },
    {
      label: "Giá vốn hàng bán",
      value: formatCurrency(stats.cogs || 0),
      icon: <PieChart className="h-3.5 w-3.5" />,
      iconClassName: "bg-orange-500/10 text-orange-500",
      trend: {
        text: `${stats.orderCount || 0} đơn hàng đã bán`,
        className: "text-muted-foreground",
      },
    },
    {
      label: "Chi phí vận hành",
      value: formatCurrency(stats.expenses || 0),
      icon: <Wallet className="h-3.5 w-3.5" />,
      iconClassName: "bg-red-500/10 text-red-500",
      trend: { text: "Chi phí cố định & biến phí", className: "text-muted-foreground" },
    },
    {
      label: "Lợi nhuận ròng",
      value: (
        <span className={(stats.netProfit || 0) >= 0 ? "text-primary" : "text-red-500"}>
          {formatCurrency(stats.netProfit || 0)}
        </span>
      ),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      iconClassName: "bg-primary/10 text-primary",
      trend: {
        text: `Margin ${stats.revenue ? ((stats.netProfit / stats.revenue) * 100).toFixed(1) : 0}%`,
        className: (stats.netProfit || 0) >= 0 ? "text-emerald-500" : "text-red-500",
      },
    },
  ];

  return (
    <>
      <MetricStatBar items={topItems} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-0 overflow-hidden rounded-2xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <CardHeader className="border-b border-slate-100 p-6">
            <CardTitle className="flex items-center gap-2 text-base font-black tracking-widest uppercase">
              <span className="inline-block h-6 w-1 rounded-full bg-blue-500"></span>
              Chi tiết các khoản lợi nhuận
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {/* Revenue */}
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800">Doanh thu gộp</div>
                    <div className="mt-0.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Tổng giá trị đơn hàng
                    </div>
                  </div>
                </div>
                <div className="text-xl font-black text-blue-600">
                  {formatCurrency(stats.revenue || 0)}
                </div>
              </div>

              {/* COGS */}
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-transform group-hover:scale-110">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800">
                      Giá vốn hàng bán (COGS)
                    </div>
                    <div className="mt-0.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Tổng giá nhập kho sản phẩm
                    </div>
                  </div>
                </div>
                <div className="text-xl font-black text-red-500">
                  -{formatCurrency(stats.cogs || 0)}
                </div>
              </div>

              {/* Gross Profit Subtotal */}
              <div className="flex items-center justify-between border-y border-dashed border-slate-200 bg-slate-50/80 px-5 py-4">
                <div className="pl-16 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Lợi nhuận gộp
                </div>
                <div className="text-lg font-black text-slate-700">
                  {formatCurrency(stats.grossProfit || 0)}
                </div>
              </div>

              {/* Expenses */}
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition-transform group-hover:scale-110">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800">Chi phí vận hành</div>
                    <div className="mt-0.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Mặt bằng, nhân sự, marketing...
                    </div>
                  </div>
                </div>
                <div className="text-xl font-black text-red-500">
                  -{formatCurrency(stats.expenses || 0)}
                </div>
              </div>

              {/* Net Profit Final */}
              <div className="flex flex-col gap-3 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary shadow-primary/30 rounded-lg p-2 text-white shadow-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-primary text-base font-black tracking-widest uppercase">
                    Lợi nhuận ròng cuối cùng
                  </span>
                </div>
                <div
                  className={`text-2xl font-black tracking-tight md:text-3xl ${
                    (stats.netProfit || 0) >= 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  {formatCurrency(stats.netProfit || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Health Scorecard */}
        <Card className="group relative flex flex-col overflow-hidden rounded-2xl border-none bg-gradient-to-br from-white to-slate-50 p-0 shadow-sm ring-1 ring-slate-200">
          <div className="bg-primary/5 group-hover:bg-primary/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-3xl transition-all" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-all group-hover:bg-blue-500/10" />

          <div className="z-10 flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
            <div className="relative">
              <div className="text-primary flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-4 shadow-slate-200/50 ring-slate-50">
                <TrendingUp className="h-10 w-10" />
              </div>
              <div
                className={`absolute -right-2 -bottom-2 rounded-full border-2 border-white px-2 py-1 text-[10px] font-bold text-white shadow-lg ${(stats.netProfit || 0) > 0 ? "bg-green-500" : "bg-red-500"}`}
              >
                {(stats.netProfit || 0) > 0 ? "GOOD" : "LOSS"}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">Sức khỏe tài chính</h3>
              <div className="text-primary flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-tighter">
                  {stats.revenue ? ((stats.netProfit / stats.revenue) * 100).toFixed(1) : 0}
                </span>
                <span className="text-lg font-bold">%</span>
              </div>
              <p className="text-muted-foreground mx-auto max-w-[250px] pt-2 text-sm leading-relaxed font-medium">
                {(stats.netProfit || 0) > 0
                  ? "Tỷ suất lợi nhuận ở mức tích cực. Tiếp tục duy trì và tối ưu chi phí."
                  : "Cần xem xét lại chi phí vận hành hoặc chiến lược giá để cải thiện lợi nhuận."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
