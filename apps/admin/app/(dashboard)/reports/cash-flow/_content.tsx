"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
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

const GROUP_BY_OPTIONS: { value: "day" | "week" | "month"; label: string }[] = [
  { value: "day", label: "Theo ngày" },
  { value: "week", label: "Theo tuần" },
  { value: "month", label: "Theo tháng" },
];

export default function CashFlowContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "cash-flow", range, groupBy],
    queryFn: () =>
      reportsClient.getCashFlow({
        startDate: range.startDate,
        endDate: range.endDate,
        groupBy,
      }),
  });

  const summaryItems: MetricStatItem[] | null = data
    ? [
        {
          label: "Tiền vào",
          value: <span className="text-emerald-600">{formatCurrency(data.totalInflow)}</span>,
          icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
          trend: {
            text: `KH thu: ${formatCurrency(data.breakdown.customerPayments)}`,
            className: "text-muted-foreground",
          },
        },
        {
          label: "Tiền ra",
          value: <span className="text-red-500">{formatCurrency(data.totalOutflow)}</span>,
          icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
          trend: {
            text: `NCC ${formatCurrency(data.breakdown.supplierPayments)} • CP ${formatCurrency(data.breakdown.expenses)}`,
            className: "text-muted-foreground",
          },
        },
        {
          label: "Chênh lệch",
          value: (
            <span className={data.netCashFlow >= 0 ? "text-emerald-600" : "text-red-500"}>
              {formatCurrency(data.netCashFlow)}
            </span>
          ),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
          trend: { text: "Tiền vào − tiền ra", className: "text-muted-foreground" },
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildExportUrl("cash-flow", { ...range, format, groupBy });
  }

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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Báo cáo dòng tiền</h1>
        </div>
        <ReportExportMenu
          getExportUrl={getExportUrl}
          onPrint={() => window.print()}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker value={range} onChange={setRange} />
        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}
          className="h-8 w-32 text-xs font-bold"
        >
          {GROUP_BY_OPTIONS.map((o) => (
            <SelectOption key={o.value} value={o.value}>
              {o.label}
            </SelectOption>
          ))}
        </Select>
      </div>

      {summaryItems && <MetricStatBar items={summaryItems} />}

      <Card className="border-none p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold tracking-tight">Biểu đồ vào / ra</h2>
        {isLoading || !data ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : data.byPeriod.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Không có giao dịch trong khoảng này.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.byPeriod}>
              <defs>
                <linearGradient id="cf-inflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cf-outflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="period" fontSize={11} />
              <YAxis
                fontSize={11}
                tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}k`)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "inflow" ? "Tiền vào" : name === "outflow" ? "Tiền ra" : "Chênh lệch",
                ]}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cf-inflow)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#cf-outflow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Kỳ</TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tiền vào
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tiền ra
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Chênh lệch
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={4} rows={6} />
            ) : !data || data.byPeriod.length === 0 ? (
              <TableEmptyRow cols={4} message="Không có giao dịch trong khoảng này." />
            ) : (
              data.byPeriod.map((p) => (
                <TableRow key={p.period}>
                  <TableCell className="text-sm font-semibold tabular-nums">{p.period}</TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums text-emerald-600">
                    {formatCurrency(p.inflow)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums text-red-500">
                    {formatCurrency(p.outflow)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm font-black tabular-nums ${p.net >= 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {formatCurrency(p.net)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data && data.byPeriod.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="text-sm font-black uppercase">Tổng</TableCell>
                <TableCell className="text-right text-sm font-black tabular-nums text-emerald-600">
                  {formatCurrency(data.totalInflow)}
                </TableCell>
                <TableCell className="text-right text-sm font-black tabular-nums text-red-500">
                  {formatCurrency(data.totalOutflow)}
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-black tabular-nums ${data.netCashFlow >= 0 ? "text-emerald-600" : "text-red-500"}`}
                >
                  {formatCurrency(data.netCashFlow)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </Card>
    </div>
  );
}
