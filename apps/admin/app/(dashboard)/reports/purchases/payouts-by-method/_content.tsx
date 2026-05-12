"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Card } from "@workspace/ui/components/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, CreditCard, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { fmtDateTime, fmtPercent } from "@/lib/report-formatters";
import { fmtPaymentMethod } from "@/lib/report-purchases-labels";
import {
  buildPurchasesExportUrl,
  type PayoutTxRow,
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

interface TxSheetProps {
  method: string | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

function PayoutTxSheet({ method, startDate, endDate, onClose }: TxSheetProps) {
  const open = method !== null;
  const { data, isLoading } = useQuery({
    queryKey: ["purchases-payout-tx", method, startDate, endDate],
    queryFn: () =>
      purchasesReportsClient.getPayoutTransactions({ method: method!, startDate, endDate }),
    enabled: open,
  });

  const rows: PayoutTxRow[] = data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{method ? fmtPaymentMethod(method) : ""}</SheetTitle>
          <SheetDescription>
            Kỳ {startDate} → {endDate}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-auto pr-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">Ngày</TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Mã phiếu
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">NCC</TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Số tiền
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRows rows={5} cols={4} />
              ) : rows.length === 0 ? (
                <TableEmptyRow cols={4} message="Không có giao dịch." />
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {fmtDateTime(r.paidAt)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{r.code}</TableCell>
                    <TableCell className="text-sm">{r.supplierName ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums">
                      {formatCurrency(r.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function PayoutsByMethodContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [drillMethod, setDrillMethod] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "purchases-payouts-by-method", range],
    queryFn: () => purchasesReportsClient.getPayoutsByMethod(range),
  });

  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Tổng chi",
          value: <span className="text-primary">{formatCurrency(summary.totalAmount)}</span>,
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
        {
          label: "Số giao dịch",
          value: summary.txCount,
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "TB/GD",
          value: formatCurrency(summary.avgAmount),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "PT nhiều nhất",
          value: (
            <span className="truncate text-xl font-black">
              {summary.topMethod ? fmtPaymentMethod(summary.topMethod) : "—"}
            </span>
          ),
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildPurchasesExportUrl("payouts-by-method", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Chi trả NCC theo phương thức</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <FinanceRangePicker value={range} onChange={setRange} />

      {statItems && <MetricStatBar items={statItems} />}

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
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
                Tổng chi
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tỷ lệ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                TB/GD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={4} cols={5} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={5} message="Không có giao dịch chi trả trong kỳ này." />
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.method}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDrillMethod(r.method)}
                >
                  <TableCell className="text-sm font-semibold">
                    {fmtPaymentMethod(r.method)}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {r.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.txCount}</TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {fmtPercent(r.pct)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.avgAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PayoutTxSheet
        method={drillMethod}
        startDate={range.startDate}
        endDate={range.endDate}
        onClose={() => setDrillMethod(null)}
      />
    </div>
  );
}
