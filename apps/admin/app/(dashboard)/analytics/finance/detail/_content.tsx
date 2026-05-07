"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Empty, EmptyDescription } from "@workspace/ui/components/empty";
import { Progress } from "@workspace/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { format, parseISO } from "date-fns";
import { DollarSign, Percent, PieChart, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsSubpageHeader } from "@/components/admin/analytics/analytics-subpage-header";
import { FinanceDayDrawer } from "@/components/admin/analytics/finance-day-drawer";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDate(dateStr: string) {
  const d = parseISO(dateStr);
  return {
    day: DAY_LABELS[d.getDay()],
    date: format(d, "d/M"),
  };
}

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

function MarginBar({ margin }: { margin: number }) {
  const clamped = Math.min(Math.max(margin, 0), 100);
  const isNeg = margin < 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={clamped} tone={isNeg ? "destructive" : "success"} className="w-16" />
      <span
        className={`text-xs font-bold tabular-nums ${isNeg ? "text-red-500" : "text-emerald-600"}`}
      >
        {margin.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AnalyticsFinanceDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [range, setRange] = useState<DateRange>({
    startDate: searchParams.get("from") ?? getThisMonthRange().startDate,
    endDate: searchParams.get("to") ?? getThisMonthRange().endDate,
  });
  const [openDay, setOpenDay] = useState<string | null>(searchParams.get("day"));

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("from", range.startDate);
    params.set("to", range.endDate);
    if (openDay) params.set("day", openDay);
    router.replace(`${ADMIN_ROUTES.ANALYTICS_FINANCE_DETAIL}?${params.toString()}`, {
      scroll: false,
    });
  }, [range, openDay, router]);

  function handleRangeChange(newRange: DateRange) {
    setRange(newRange);
    setOpenDay(null);
  }

  const isSingleDay = range.startDate === range.endDate;

  const { data: dailyData, isLoading } = useQuery({
    queryKey: queryKeys.admin.finance.daily(range),
    queryFn: () => adminClient.getDailyFinancialStats(range),
    enabled: !isSingleDay,
  });

  const summary = dailyData?.summary;
  const rows = dailyData?.dailyData ? [...dailyData.dailyData].reverse() : [];
  const avgMargin =
    summary && summary.revenue > 0
      ? ((summary.grossProfit / summary.revenue) * 100).toFixed(1)
      : "—";

  const summaryItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Doanh thu",
          value: <span className="text-blue-600">{formatCurrency(summary.revenue)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
          trend: { text: "Tổng kỳ được chọn", className: "text-muted-foreground" },
        },
        {
          label: "Giá vốn",
          value: formatCurrency(summary.cogs),
          icon: <PieChart className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
          trend: { text: "COGS kỳ được chọn", className: "text-muted-foreground" },
        },
        {
          label: "LN gộp",
          value: (
            <span className={summary.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
              {formatCurrency(summary.grossProfit)}
            </span>
          ),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
          trend: { text: "Doanh thu − COGS", className: "text-muted-foreground" },
        },
        {
          label: "Biên LN",
          value: (
            <span
              className={
                avgMargin === "—" || Number(avgMargin) >= 0 ? "text-emerald-600" : "text-red-500"
              }
            >
              {avgMargin === "—" ? "—" : `${avgMargin}%`}
            </span>
          ),
          icon: <Percent className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
          trend: { text: "Gross margin trung bình", className: "text-muted-foreground" },
        },
      ]
    : null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <AnalyticsSubpageHeader
        title="Chi tiết theo ngày"
        backHref={ADMIN_ROUTES.ANALYTICS_FINANCE}
        backLabel="Tài chính"
      />

      <FinanceRangePicker value={range} onChange={handleRangeChange} />

      {summaryItems && <MetricStatBar items={summaryItems} />}

      {isSingleDay ? (
        <p className="py-4 text-sm text-muted-foreground">
          Chọn khoảng thời gian nhiều hơn 1 ngày để xem bảng chi tiết.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !rows.length ? (
        <Empty bordered>
          <EmptyDescription>Không có giao dịch trong khoảng này.</EmptyDescription>
        </Empty>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Nhấn vào từng dòng để xem danh sách đơn hàng trong ngày.
          </p>

          {/* Desktop table */}
          <Card className="hidden border-none shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-black tracking-widest uppercase">
                    Ngày
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    Doanh thu
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    COGS
                  </TableHead>
                  <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                    LN gộp
                  </TableHead>
                  <TableHead className="text-xs font-black tracking-widest uppercase">
                    Biên LN
                  </TableHead>
                  <TableHead className="text-center text-xs font-black tracking-widest uppercase">
                    Đơn
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const margin = row.revenue > 0 ? (row.grossProfit / row.revenue) * 100 : 0;
                  const { day, date } = formatDate(row.date);
                  return (
                    <TableRow
                      key={row.date}
                      onClick={() => setOpenDay(row.date)}
                      className="group cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-black">
                            {day}
                          </Badge>
                          <span className="text-sm font-semibold tabular-nums">{date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold tabular-nums text-blue-600">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(row.cogs)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-bold tabular-nums ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {formatCurrency(row.grossProfit)}
                      </TableCell>
                      <TableCell>
                        <MarginBar margin={margin} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-black">
                          {row.orderCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
                        →
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row) => {
              const margin = row.revenue > 0 ? (row.grossProfit / row.revenue) * 100 : 0;
              const { day, date } = formatDate(row.date);
              return (
                <Card
                  key={row.date}
                  onClick={() => setOpenDay(row.date)}
                  className="cursor-pointer border-none shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="px-1.5 text-xs font-black">
                        {day}
                      </Badge>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold tabular-nums">{date}</span>
                        <span className="text-xs text-muted-foreground">{row.orderCount} đơn</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-black tabular-nums text-blue-600">
                        {formatCurrency(row.revenue)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold tabular-nums ${row.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          LN {formatCurrency(row.grossProfit)}
                        </span>
                        <span
                          className={`text-xs font-bold ${margin >= 0 ? "text-emerald-500" : "text-red-400"}`}
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <FinanceDayDrawer date={openDay} onClose={() => setOpenDay(null)} />
    </div>
  );
}
