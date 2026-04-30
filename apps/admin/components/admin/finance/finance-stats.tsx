"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ArrowUpRight, DollarSign, PieChart, TrendingUp, Wallet } from "lucide-react";
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

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Tổng doanh thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(stats.revenue || 0)}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>GHI NHẬN THEO ĐƠN HOÀN THÀNH</span>
            </div>
          </CardContent>
        </Card>

        {/* COGS */}
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Giá vốn hàng bán
            </CardTitle>
            <PieChart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(stats.cogs || 0)}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <span>{stats.orderCount || 0} ĐƠN HÀNG ĐÃ BÁN</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Chi phí vận hành
            </CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(stats.expenses || 0)}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <span>CHI PHÍ CỐ ĐỊNH & BIẾN PHÍ</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black tracking-widest text-slate-500 uppercase">
              Lợi nhuận ròng
            </CardTitle>
            <TrendingUp className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-black ${(stats.netProfit || 0) >= 0 ? "text-primary" : "text-red-500"}`}
            >
              {formatCurrency(stats.netProfit || 0)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span data-testid="profit-margin">
                {stats.revenue ? ((stats.netProfit / stats.revenue) * 100).toFixed(1) : 0}
              </span>
              <span>%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-0 overflow-hidden rounded-2xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 lg:col-span-2 dark:bg-slate-900/50 dark:ring-slate-800">
          <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-base font-black tracking-widest uppercase">
              <span className="inline-block h-6 w-1 rounded-full bg-blue-500"></span>
              Chi tiết các khoản lợi nhuận
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* Revenue */}
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/20 dark:text-blue-400">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Doanh thu gộp
                    </div>
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
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition-transform group-hover:scale-110 dark:bg-orange-900/20 dark:text-orange-400">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
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
              <div className="flex items-center justify-between border-y border-dashed border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700/50 dark:bg-slate-800/40">
                <div className="pl-16 text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Lợi nhuận gộp
                </div>
                <div className="text-lg font-black text-slate-700 dark:text-slate-300">
                  {formatCurrency(stats.grossProfit || 0)}
                </div>
              </div>

              {/* Expenses */}
              <div className="group flex items-center justify-between p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition-transform group-hover:scale-110 dark:bg-red-900/20 dark:text-red-400">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Chi phí vận hành
                    </div>
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
              <div className="flex items-center justify-between border-t border-slate-100 p-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-primary shadow-primary/30 rounded-lg p-2 text-white shadow-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-primary text-base font-black tracking-widest uppercase">
                    Lợi nhuận ròng cuối cùng
                  </span>
                </div>
                <div
                  className={`text-3xl font-black tracking-tight ${
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
        <Card className="group relative flex flex-col overflow-hidden rounded-2xl border-none bg-gradient-to-br from-white to-slate-50 p-0 shadow-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-900/50 dark:ring-slate-800">
          <div className="bg-primary/5 group-hover:bg-primary/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-3xl transition-all" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-all group-hover:bg-blue-500/10" />

          <div className="z-10 flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
            <div className="relative">
              <div className="text-primary flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-4 shadow-slate-200/50 ring-slate-50 dark:bg-slate-800 dark:shadow-black/20 dark:ring-slate-900">
                <TrendingUp className="h-10 w-10" />
              </div>
              <div className="absolute -right-2 -bottom-2 rounded-full border-2 border-white bg-green-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg dark:border-slate-800">
                GOOD
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">
                Sức khỏe tài chính
              </h3>
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
