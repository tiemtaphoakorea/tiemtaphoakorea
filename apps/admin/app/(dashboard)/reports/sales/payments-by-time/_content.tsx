"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Switch } from "@workspace/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, CreditCard, DollarSign, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { SalesTrendChart } from "@/components/admin/reports/sales-trend-chart";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { GROUP_BY_LABELS } from "@/lib/report-sales-labels";
import { buildSalesExportUrl, salesReportsClient } from "@/services/reports-sales.client";

function thisMonth(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function PaymentsByTimeContent() {
  const [range, setRange] = useState<DateRange>(thisMonth());
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [compare, setCompare] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "payments-by-time", range, groupBy, compare],
    queryFn: () => salesReportsClient.getPaymentsByTime({ ...range, groupBy, compare }),
  });

  const s = data?.summary;
  const kpiItems: MetricStatItem[] | null = s
    ? [
        {
          label: "Tổng thu",
          value: <span className="text-blue-600">{formatCurrency(s.totalAmount)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Số GD",
          value: s.totalTx,
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "TB/ngày",
          value: formatCurrency(s.avgPerDay),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Kỳ đỉnh",
          value: s.peakPeriod ?? "—",
          icon: <Zap className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
      ]
    : null;

  const chartData = (data?.data ?? []).map((r) => ({
    period: r.period,
    cash: r.cashTotal,
    bank: r.bankTotal,
    card: r.cardTotal,
  }));

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildSalesExportUrl("payments-by-time", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      groupBy,
      compare,
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={ADMIN_ROUTES.REPORTS}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Báo cáo
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Thu tiền theo thời gian</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FinanceRangePicker value={range} onChange={setRange} />
        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}
          className="h-7 w-28 text-xs font-bold"
        >
          {(["day", "week", "month"] as const).map((g) => (
            <SelectOption key={g} value={g}>
              {GROUP_BY_LABELS[g]}
            </SelectOption>
          ))}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={compare} onCheckedChange={setCompare} />
          <span className="font-semibold">So sánh kỳ trước</span>
        </label>
      </div>

      {kpiItems && <MetricStatBar items={kpiItems} />}

      <Card className="overflow-hidden border-none shadow-sm p-4">
        <SalesTrendChart
          data={chartData}
          series={[
            { key: "cash", label: "Tiền mặt", color: "hsl(142 71% 45%)" },
            { key: "bank", label: "Chuyển khoản", color: "hsl(221 83% 53%)" },
            { key: "card", label: "Thẻ", color: "hsl(280 65% 55%)" },
          ]}
        />
      </Card>

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Kỳ</TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số GD
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tiền mặt
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                CK
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Thẻ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tổng thu
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={6} rows={7} />
            ) : (data?.data ?? []).length === 0 ? (
              <TableEmptyRow cols={6} message="Không có giao dịch nào" />
            ) : (
              (data?.data ?? []).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{r.period}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.txCount}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.cashTotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.bankTotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.cardTotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data?.previousPeriod && compare && (
        <p className="text-xs text-muted-foreground">
          Kỳ trước: {data.previousPeriod.startDate.slice(0, 10)} →{" "}
          {data.previousPeriod.endDate.slice(0, 10)}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        * Chỉ tính giao dịch thanh toán trên đơn chưa hủy trong kỳ.
      </p>
    </div>
  );
}
