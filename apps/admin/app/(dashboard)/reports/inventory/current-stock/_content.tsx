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
import { BarChart2, Package, PackageOpen, Search, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { TonePill } from "@/components/admin/shared/status-badge";
import { getStockStatusLabel } from "@/lib/report-inventory-labels";
import {
  buildInventoryExportUrl,
  type CurrentStockRow,
  inventoryReportsClient,
} from "@/services/reports-inventory.client";

type StockStatusFilter = "all" | "in-stock" | "out-of-stock" | "low";

function stockStatusTone(s: CurrentStockRow["stockStatus"]) {
  if (s === "out-of-stock") return "red" as const;
  if (s === "low") return "amber" as const;
  return "green" as const;
}

export default function CurrentStockContent() {
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "inventory", "current-stock", search, stockStatus, page],
    queryFn: () => inventoryReportsClient.getCurrentStock({ search, stockStatus, page, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  const { data: catData } = useQuery({
    queryKey: ["reports", "inventory", "current-stock", "category"],
    queryFn: () => inventoryReportsClient.getCategoryBreakdown(),
    staleTime: 60_000,
  });

  const kpi = data?.kpi;
  const rows = data?.data ?? [];
  const meta = data?.metadata;

  const statItems: MetricStatItem[] | null = kpi
    ? [
        {
          label: "Số SKU",
          value: kpi.totalSkus.toLocaleString("vi-VN"),
          icon: <Package className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Tổng tồn kho",
          value: kpi.totalUnits.toLocaleString("vi-VN"),
          icon: <BarChart2 className="h-3.5 w-3.5" />,
          iconClassName: "bg-indigo-500/10 text-indigo-500",
        },
        {
          label: "Giá trị kho (WAC)",
          value: <span className="text-emerald-600">{formatCurrency(kpi.totalValue)}</span>,
          icon: <TrendingDown className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "SKU sắp hết",
          value: (
            <span className={kpi.lowStockSkus > 0 ? "text-amber-600" : ""}>{kpi.lowStockSkus}</span>
          ),
          icon: <PackageOpen className="h-3.5 w-3.5" />,
          iconClassName: "bg-amber-500/10 text-amber-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildInventoryExportUrl("current-stock", { search, stockStatus, format });
  }

  const STATUS_OPTIONS: { value: StockStatusFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "in-stock", label: "Còn hàng" },
    { value: "low", label: "Sắp hết" },
    { value: "out-of-stock", label: "Hết hàng" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={ADMIN_ROUTES.REPORTS}
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Báo cáo
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Tồn kho hiện tại</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Giá trị kho tại thời điểm xem — chưa hỗ trợ snapshot lịch sử
          </p>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      {statItems && <MetricStatBar items={statItems} />}

      {/* Category breakdown mini-table */}
      {catData && catData.data.length > 0 && (
        <Card className="overflow-hidden border-none shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-black tracking-widest uppercase">Phân bổ theo danh mục</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4 pt-2 sm:grid-cols-3 lg:grid-cols-5">
            {catData.data.slice(0, 5).map((c) => (
              <div key={c.categoryId ?? "none"} className="rounded-lg border border-border p-3">
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {c.categoryName}
                </p>
                <p className="mt-1 text-lg font-black tabular-nums">{c.pctOfTotal.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(c.totalValue)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8 w-60"
            placeholder="Tìm SKU, sản phẩm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStockStatus(opt.value);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                stockStatus === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">SKU</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Sản phẩm
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Danh mục
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tồn
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Giữ chỗ
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Khả dụng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                WAC
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Giá trị
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={8} cols={9} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={9} message="Không có dữ liệu tồn kho." />
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">{r.sku}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{r.productName}</span>
                      {r.variantName !== r.productName && (
                        <span className="text-xs text-muted-foreground">{r.variantName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{r.categoryName ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {r.onHand}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {r.reserved}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.available}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(r.costPrice)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {formatCurrency(r.stockValue)}
                  </TableCell>
                  <TableCell>
                    <TonePill tone={stockStatusTone(r.stockStatus)}>
                      {getStockStatusLabel(r.stockStatus)}
                    </TonePill>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} / {meta.total}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded border px-3 py-1 text-xs hover:bg-accent disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Trước
            </button>
            <button
              className="rounded border px-3 py-1 text-xs hover:bg-accent disabled:opacity-40"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
