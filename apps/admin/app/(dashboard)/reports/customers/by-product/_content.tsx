"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, BarChart3, Package, Search, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import {
  type CustomerDrilldownTarget,
  ReportDrilldownCustomersSheet,
} from "@/components/admin/reports/report-drilldown-customers-sheet";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { CUSTOMER_BY_PRODUCT_SORT_OPTIONS } from "@/lib/report-customers-labels";
import {
  buildCustomerExportUrl,
  type CustomersByProductRow,
  customersReportClient,
} from "@/services/reports-customers.client";

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

export default function CustomersByProductContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"customer_count" | "revenue" | "qty">("customer_count");
  const [page, setPage] = useState(1);
  const [drilldown, setDrilldown] = useState<CustomerDrilldownTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "customers", "by-product", range, search, sortBy, page],
    queryFn: () =>
      customersReportClient.getByProduct({
        startDate: range.startDate,
        endDate: range.endDate,
        search,
        sortBy,
        page,
        limit: 20,
      }),
  });

  const rows = data?.data ?? [];
  const summary = data?.summary;

  const statItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Số SKU bán",
          value: summary.skuCount.toLocaleString("vi-VN"),
          icon: <Package className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "KH unique",
          value: summary.totalUniqueCustomers.toLocaleString("vi-VN"),
          icon: <Users className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "SP nhiều KH nhất",
          value: (
            <span className="truncate text-base font-black">{summary.topProductName ?? "—"}</span>
          ),
          icon: <BarChart3 className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "TB KH/SKU",
          value: summary.avgCustomersPerSku.toFixed(1),
          icon: <Wallet className="h-3.5 w-3.5" />,
          iconClassName: "bg-purple-500/10 text-purple-500",
        },
      ]
    : null;

  function openDrilldown(row: CustomersByProductRow) {
    setDrilldown({
      kind: "variant",
      variantId: row.variantId,
      label: `${row.productName}${row.variantName ? ` - ${row.variantName}` : ""}`,
    });
  }

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildCustomerExportUrl("by-product", {
      ...range,
      format: format === "csv-detail" ? "csv" : format,
      search,
      sortBy,
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
            <span className="font-medium text-foreground">Khách hàng theo sản phẩm</span>
          </nav>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Khách hàng theo sản phẩm</h1>
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
            placeholder="Tìm sản phẩm / SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={(v) => {
            setSortBy(v as typeof sortBy);
            setPage(1);
          }}
        >
          {CUSTOMER_BY_PRODUCT_SORT_OPTIONS.map((o) => (
            <SelectOption key={o.value} value={o.value}>
              Sắp xếp: {o.label}
            </SelectOption>
          ))}
        </Select>
      </div>

      {statItems && <MetricStatBar items={statItems} />}

      {/* Horizontal bar chart: top 10 products by customer count */}
      {rows.length > 0 && page === 1 && (
        <Card className="border-none shadow-sm p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Top {Math.min(10, rows.length)} sản phẩm theo số khách
          </p>
          <div className="flex flex-col gap-2">
            {rows.slice(0, 10).map((r) => {
              const maxCustomers = rows[0]?.customerCount ?? 1;
              const pct = maxCustomers > 0 ? (r.customerCount / maxCustomers) * 100 : 0;
              return (
                <div key={r.variantId} className="flex items-center gap-2">
                  <span className="w-36 truncate text-xs text-muted-foreground">
                    {r.productName}
                    {r.variantName ? ` – ${r.variantName}` : ""}
                  </span>
                  <div className="flex-1 rounded bg-muted h-5 overflow-hidden">
                    <div
                      className="h-full rounded bg-orange-500/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums font-semibold">
                    {r.customerCount} KH
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
              <TableHead className="text-xs font-black tracking-widest uppercase">SKU</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Sản phẩm
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Biến thể
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số KH
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số đơn
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                SL bán
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={10} cols={7} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={7} message="Không có dữ liệu trong kỳ này." />
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.variantId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDrilldown(r)}
                >
                  <TableCell className="text-sm tabular-nums font-mono text-muted-foreground">
                    {r.sku}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{r.productName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.variantName}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-bold text-blue-600">
                    {r.customerCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {r.orderCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.qty}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
                    {formatCurrency(r.revenue)}
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

      <ReportDrilldownCustomersSheet
        target={drilldown}
        startDate={range.startDate}
        endDate={range.endDate}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
}
