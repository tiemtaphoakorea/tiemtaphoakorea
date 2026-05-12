"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { buildSalesExportUrl, salesReportsClient } from "@/services/reports-sales.client";

function thisMonth(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function PaymentsByMethodContent() {
  const [range, setRange] = useState<DateRange>(thisMonth());

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "payments-by-method", range],
    queryFn: () => salesReportsClient.getPaymentsByMethod(range),
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
          label: "TB/GD",
          value: formatCurrency(s.avgPerTx),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Phương thức nhiều nhất",
          value: s.topMethod ?? "—",
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildSalesExportUrl("payments-by-method", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Thu tiền theo phương thức</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FinanceRangePicker value={range} onChange={setRange} />
      </div>

      {kpiItems && <MetricStatBar items={kpiItems} />}

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Phương thức
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số GD
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tổng tiền
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                % Tổng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                TB/GD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={5} rows={3} />
            ) : (data?.data ?? []).length === 0 ? (
              <TableEmptyRow cols={5} message="Không có giao dịch nào" />
            ) : (
              (data?.data ?? []).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-semibold">{r.method}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.txCount}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.total)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {r.pct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.avgPerTx)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        * Chỉ tính giao dịch thanh toán trên đơn chưa hủy trong kỳ.
      </p>
    </div>
  );
}
