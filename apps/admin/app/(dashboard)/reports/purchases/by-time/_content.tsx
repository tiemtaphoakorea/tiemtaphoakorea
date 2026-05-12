"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, Box, CreditCard, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { PurchasesTrendChart } from "@/components/admin/reports/purchases-trend-chart";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { GROUP_BY_LABELS } from "@/lib/report-purchases-labels";
import {
  buildPurchasesExportUrl,
  purchasesReportsClient,
} from "@/services/reports-purchases.client";

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

type GroupBy = "day" | "week" | "month";

export default function PurchasesByTimeContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "purchases-by-time", range, groupBy],
    queryFn: () => purchasesReportsClient.getByTime({ ...range, groupBy }),
  });

  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Số phiếu",
          value: summary.totalReceipts,
          icon: <Receipt className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Số lượng",
          value: summary.totalQty,
          icon: <Box className="h-3.5 w-3.5" />,
          iconClassName: "bg-violet-500/10 text-violet-500",
        },
        {
          label: "Giá trị nhập",
          value: <span className="text-primary">{formatCurrency(summary.totalPayable)}</span>,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
        {
          label: "Đã trả",
          value: <span className="text-emerald-600">{formatCurrency(summary.totalPaid)}</span>,
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Còn nợ",
          value: <span className="text-red-500">{formatCurrency(summary.totalDebt)}</span>,
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildPurchasesExportUrl("by-time", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      groupBy,
    });
  }

  const rows = data?.rows ?? [];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={ADMIN_ROUTES.REPORTS}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Báo cáo
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Nhập hàng theo thời gian</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker value={range} onChange={setRange} />
        <div className="flex gap-1">
          {(["day", "week", "month"] as GroupBy[]).map((g) => (
            <Button
              key={g}
              size="sm"
              variant={groupBy === g ? "default" : "outline"}
              className="h-7 rounded-full px-3 text-xs font-bold"
              onClick={() => setGroupBy(g)}
            >
              {GROUP_BY_LABELS[g]}
            </Button>
          ))}
        </div>
      </div>

      {statItems && <MetricStatBar items={statItems} />}

      <PurchasesTrendChart rows={rows} loading={isLoading} />

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Kỳ</TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số phiếu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                SL
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Giá trị
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Đã trả
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Còn nợ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={7} cols={6} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={6} message="Không có dữ liệu nhập hàng trong kỳ này." />
            ) : (
              rows.map((r) => (
                <TableRow key={r.period}>
                  <TableCell className="text-sm font-semibold tabular-nums">{r.period}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {r.receiptCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.totalQty}</TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {formatCurrency(r.payableAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-emerald-600">
                    {formatCurrency(r.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-red-500">
                    {formatCurrency(r.debtAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
