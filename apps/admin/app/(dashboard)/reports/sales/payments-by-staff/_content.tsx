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
import { ArrowLeft, CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportDrilldownPaymentsSheet } from "@/components/admin/reports/report-drilldown-payments-sheet";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import {
  buildSalesExportUrl,
  type PaymentsByStaffRow,
  salesReportsClient,
} from "@/services/reports-sales.client";

function thisMonth(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function PaymentsByStaffContent() {
  const [range, setRange] = useState<DateRange>(thisMonth());
  const [search, setSearch] = useState("");
  const [drilldown, setDrilldown] = useState<PaymentsByStaffRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "payments-by-staff", range, search],
    queryFn: () => salesReportsClient.getPaymentsByStaff({ ...range, search, page: 1, limit: 100 }),
  });

  const s = data?.summary;
  const kpiItems: MetricStatItem[] | null = s
    ? [
        {
          label: "Số NV thu",
          value: s.staffCount,
          icon: <Users className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
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
          label: "TB/NV",
          value: formatCurrency(s.avgPerStaff),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildSalesExportUrl("payments-by-staff", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      search,
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Thu tiền theo nhân viên</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FinanceRangePicker value={range} onChange={setRange} />
        <Input
          placeholder="Tìm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-48 text-xs"
        />
      </div>

      {kpiItems && <MetricStatBar items={kpiItems} />}

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Nhân viên
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số đơn LQ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số GD
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tổng thu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                TB/GD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={5} rows={5} />
            ) : (data?.data ?? []).length === 0 ? (
              <TableEmptyRow cols={5} message="Không có dữ liệu" />
            ) : (
              (data?.data ?? []).map((r) => (
                <TableRow
                  key={r.staffId ?? r.staffName}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDrilldown(r)}
                >
                  <TableCell className="text-sm font-semibold">{r.staffName}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.orderCount}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.txCount}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.total)}
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

      <ReportDrilldownPaymentsSheet
        open={!!drilldown}
        onOpenChange={(o) => {
          if (!o) setDrilldown(null);
        }}
        title={drilldown ? `Thanh toán — ${drilldown.staffName}` : ""}
        filter={{ startDate: range.startDate, endDate: range.endDate }}
      />

      <p className="text-xs text-muted-foreground">
        * "NV ghi nhận thanh toán" = người tạo giao dịch thanh toán (không phải NV bán hàng). Không
        tính hoàn hàng.
      </p>
    </div>
  );
}
