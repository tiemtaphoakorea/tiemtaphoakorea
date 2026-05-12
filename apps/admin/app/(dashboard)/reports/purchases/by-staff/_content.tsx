"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, CreditCard, Receipt, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import {
  type ReceiptDrilldownTarget,
  ReportDrilldownReceiptsSheet,
} from "@/components/admin/reports/report-drilldown-receipts-sheet";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
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

export default function PurchasesByStaffContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [drilldown, setDrilldown] = useState<ReceiptDrilldownTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "purchases-by-staff", range, search],
    queryFn: () => purchasesReportsClient.getByStaff({ ...range, search: search || undefined }),
  });

  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Số NV nhập",
          value: summary.staffCount,
          icon: <Users className="h-3.5 w-3.5" />,
          iconClassName: "bg-violet-500/10 text-violet-500",
        },
        {
          label: "Tổng phiếu",
          value: summary.totalReceipts,
          icon: <Receipt className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Tổng giá trị",
          value: <span className="text-primary">{formatCurrency(summary.totalPayable)}</span>,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
        {
          label: "NV top",
          value: <span className="truncate text-xl font-black">{summary.topStaffName ?? "—"}</span>,
          icon: <CreditCard className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildPurchasesExportUrl("by-staff", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      search: search || undefined,
    });
  }

  const rows = data?.data ?? [];

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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Nhập hàng theo nhân viên</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker value={range} onChange={setRange} />
        <Input
          placeholder="Tìm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-52 text-sm"
        />
      </div>

      {statItems && <MetricStatBar items={statItems} />}

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Nhân viên
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Phiếu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                SL nhập
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
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                TB/phiếu
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={7} cols={7} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={7} message="Không có dữ liệu." />
            ) : (
              rows.map((r, i) => (
                <TableRow
                  key={r.staffId ?? `unknown-${i}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    setDrilldown({
                      kind: "staff",
                      id: r.staffId ?? "unknown",
                      name: r.staffName,
                    })
                  }
                >
                  <TableCell className="text-sm font-semibold">{r.staffName}</TableCell>
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
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(r.avgPerReceipt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ReportDrilldownReceiptsSheet
        target={drilldown}
        startDate={range.startDate}
        endDate={range.endDate}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
}
