"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
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
import {
  ArrowLeft,
  DollarSign,
  ExternalLink,
  ShoppingCart,
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
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { fmtDate } from "@/lib/report-formatters";
import { PAYMENT_STATUS_LABELS } from "@/lib/report-sales-labels";
import { buildSalesExportUrl, salesReportsClient } from "@/services/reports-sales.client";

function thisMonth(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export default function SalesByOrderContent() {
  const [range, setRange] = useState<DateRange>(thisMonth());
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "sales-by-order", range, search],
    queryFn: () => salesReportsClient.getByOrder({ ...range, search, page: 1, limit: 50 }),
  });

  const s = data?.summary;
  const kpiItems: MetricStatItem[] | null = s
    ? [
        {
          label: "Số đơn",
          value: s.totalOrders,
          icon: <ShoppingCart className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "Doanh thu",
          value: <span className="text-blue-600">{formatCurrency(s.totalRevenue)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Đã thu",
          value: formatCurrency(s.totalPaid),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Còn nợ",
          value: (
            <span className={s.totalDebt > 0 ? "text-red-500" : ""}>
              {formatCurrency(s.totalDebt)}
            </span>
          ),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
        {
          label: "Lợi nhuận",
          value: <span className="text-emerald-600">{formatCurrency(s.totalProfit)}</span>,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildSalesExportUrl("by-order", {
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Chi tiết đơn hàng</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <FinanceRangePicker value={range} onChange={setRange} />
        <Input
          placeholder="Tìm mã đơn / khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 w-56 text-xs"
        />
      </div>

      {kpiItems && <MetricStatBar items={kpiItems} />}

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Mã đơn</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">Ngày</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Khách hàng
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">NV</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                TT thanh toán
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Còn nợ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                LN
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={8} rows={5} />
            ) : (data?.data ?? []).length === 0 ? (
              <TableEmptyRow cols={8} message="Không có đơn hàng nào" />
            ) : (
              (data?.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`${ADMIN_ROUTES.ORDERS}/${r.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {r.orderNumber}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{r.customerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.staffName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.revenue)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-sm tabular-nums ${r.debtAmount > 0 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}
                  >
                    {formatCurrency(r.debtAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-emerald-600">
                    {formatCurrency(r.profit)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-xs text-muted-foreground">
        * Chỉ hiển thị đơn chưa hủy. Click mã đơn để mở trang chi tiết. Không tính hoàn hàng.
      </p>
    </div>
  );
}
