"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Card } from "@workspace/ui/components/card";
import { Switch } from "@workspace/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { formatPnlMetricValue, PNL_METRIC_LABELS } from "@/lib/report-formatters";
import { buildExportUrl, reportsClient } from "@/services/reports.client";

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

function DeltaCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-bold tabular-nums ${positive ? "text-emerald-600" : "text-red-500"}`}
    >
      {positive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function ProfitLossContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [compare, setCompare] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "profit-loss", range, compare],
    queryFn: () =>
      reportsClient.getProfitLoss({
        startDate: range.startDate,
        endDate: range.endDate,
        compare,
      }),
  });

  const current = data?.current;
  const summaryItems: MetricStatItem[] | null = current
    ? [
        {
          label: "Doanh thu",
          value: <span className="text-blue-600">{formatCurrency(current.salesRevenue)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Giá vốn",
          value: formatCurrency(current.cogs),
          icon: <PieChart className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "LN gộp",
          value: (
            <span className={current.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
              {formatCurrency(current.grossProfit)}
            </span>
          ),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Chi phí khác",
          value: formatCurrency(current.otherExpense),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
        {
          label: "LN ròng",
          value: (
            <span className={current.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
              {formatCurrency(current.netProfit)}
            </span>
          ),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildExportUrl("profit-loss", { ...range, format, compare });
  }

  const metricKeys = Object.keys(PNL_METRIC_LABELS) as (keyof typeof PNL_METRIC_LABELS)[];
  const hasMissingCost =
    current !== undefined &&
    ((current.missingCostItems ?? 0) > 0 || (current.excludedRevenue ?? 0) > 0);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={ADMIN_ROUTES.REPORTS}
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Báo cáo tài chính
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Báo cáo lãi lỗ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ghi nhận theo ngày xuất kho; đơn thiếu giá vốn được tách khỏi tổng chính thức.
          </p>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} onPrint={() => window.print()} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FinanceRangePicker value={range} onChange={setRange} />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={compare} onCheckedChange={setCompare} />
          <span className="font-semibold">So sánh kỳ trước</span>
        </label>
      </div>

      {summaryItems && <MetricStatBar items={summaryItems} />}

      {current && hasMissingCost && (
        <Alert className="border-amber-500/40 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Đã loại đơn thiếu giá vốn khỏi P&L</AlertTitle>
          <AlertDescription>
            {formatPnlMetricValue("missingCostOrderCount", current.missingCostOrderCount)} đơn /{" "}
            {formatPnlMetricValue("missingCostItems", current.missingCostItems)} dòng thiếu giá vốn,
            doanh thu {formatCurrency(current.excludedRevenue)} chưa được tính vào doanh thu và lợi
            nhuận chính thức.{" "}
            <Link
              href={ADMIN_ROUTES.REPORTS_PROFIT_LOSS_MISSING_COST}
              className="font-bold underline underline-offset-2"
            >
              Xem đơn thiếu giá vốn
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Chỉ số</TableHead>
              {compare && (
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Kỳ trước
                </TableHead>
              )}
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Kỳ hiện tại
              </TableHead>
              {compare && (
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Thay đổi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data
              ? Array.from({ length: metricKeys.length }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={compare ? 4 : 2}>
                      <div className="h-6 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              : metricKeys.map((key) => {
                  const cur = (data.current as unknown as Record<string, number>)[key] ?? 0;
                  const prev = data.previous
                    ? ((data.previous as unknown as Record<string, number>)[key] ?? 0)
                    : null;
                  const delta = data.delta?.[key as keyof typeof data.delta] ?? null;
                  return (
                    <TableRow key={key}>
                      <TableCell className="text-sm font-semibold">
                        {PNL_METRIC_LABELS[key]}
                      </TableCell>
                      {compare && (
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {prev !== null ? formatPnlMetricValue(key, prev) : "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-right text-sm font-bold tabular-nums">
                        {formatPnlMetricValue(key, cur)}
                      </TableCell>
                      {compare && (
                        <TableCell className="text-right">
                          <DeltaCell value={delta} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </Card>

      {data?.previousPeriod && (
        <p className="text-xs text-muted-foreground">
          Kỳ trước: {data.previousPeriod.startDate.slice(0, 10)} →{" "}
          {data.previousPeriod.endDate.slice(0, 10)}
        </p>
      )}
    </div>
  );
}
