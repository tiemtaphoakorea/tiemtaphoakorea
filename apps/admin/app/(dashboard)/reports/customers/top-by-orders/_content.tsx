"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, BarChart3, Search, ShoppingBag, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { buildCustomerExportUrl, customersReportClient } from "@/services/reports-customers.client";

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
function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}

export default function TopByOrdersContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "customers", "top-by-orders", range, search, page],
    queryFn: () =>
      customersReportClient.getTopByOrders({
        startDate: range.startDate,
        endDate: range.endDate,
        search,
        page,
        limit: 20,
      }),
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Khách hàng mua",
          value: summary.customerCount.toLocaleString("vi-VN"),
          icon: <Users className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Tổng doanh thu",
          value: formatCurrency(summary.totalRevenue),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "DT trung bình/KH",
          value: formatCurrency(summary.avgRevenuePerCustomer),
          icon: <BarChart3 className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "KH đơn nhiều nhất",
          value: rows[0]?.orderCount.toLocaleString("vi-VN") ?? "—",
          icon: <ShoppingBag className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildCustomerExportUrl("top-by-orders", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      search,
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href={ADMIN_ROUTES.REPORTS}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Báo cáo
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Top khách theo số đơn</span>
          </nav>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Top khách theo số đơn</h1>
        </div>
        <ReportExportMenu
          getExportUrl={getExportUrl}
          onPrint={() => window.print()}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker
          value={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
        />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-8 text-sm"
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {statItems && <MetricStatBar items={statItems} />}

      {/* Horizontal bar chart: top 10 customers by order count */}
      {rows.length > 0 && page === 1 && (
        <Card className="border-none shadow-sm p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Top {Math.min(10, rows.length)} khách theo số đơn
          </p>
          <div className="flex flex-col gap-2">
            {rows.slice(0, 10).map((r) => {
              const maxOrders = rows[0]?.orderCount ?? 1;
              const pct = maxOrders > 0 ? (r.orderCount / maxOrders) * 100 : 0;
              return (
                <div key={r.customerId} className="flex items-center gap-2">
                  <span className="w-28 truncate text-xs text-muted-foreground">{r.fullName}</span>
                  <div className="flex-1 rounded bg-muted h-5 overflow-hidden">
                    <div
                      className="h-full rounded bg-purple-500/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums font-semibold">
                    {r.orderCount} đơn
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">#</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Khách hàng
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">Mã KH</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">SĐT</TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số đơn
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                AOV
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Mua gần nhất
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={10} cols={8} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={8} message="Không có dữ liệu trong kỳ này." />
            ) : (
              rows.map((r, idx) => (
                <TableRow key={r.customerId}>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {(page - 1) * 20 + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={ADMIN_ROUTES.CUSTOMER_DETAIL(r.customerId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {r.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {r.customerCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {r.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-bold">
                    {r.orderCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(r.aov)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {fmtDate(r.lastOrderAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data?.metadata && data.metadata.totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={data.metadata.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
