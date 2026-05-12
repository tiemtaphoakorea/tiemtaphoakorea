"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
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
import { AlertTriangle, Package, PackageOpen, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { TonePill } from "@/components/admin/shared/status-badge";
import { getStockStatusLabel } from "@/lib/report-inventory-labels";
import {
  buildInventoryExportUrl,
  inventoryReportsClient,
} from "@/services/reports-inventory.client";

type StatusFilter = "all" | "low" | "out";

export default function LowStockContent() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "inventory", "low-stock", search, status, page],
    queryFn: () => inventoryReportsClient.getLowStock({ search, status, page, limit: 50 }),
    placeholderData: (prev) => prev,
  });

  const kpi = data?.kpi;
  const rows = data?.data ?? [];
  const meta = data?.metadata;

  const statItems: MetricStatItem[] | null = kpi
    ? [
        {
          label: "SKU sắp hết",
          value: (
            <span className={kpi.lowStockSkus > 0 ? "text-amber-600" : ""}>{kpi.lowStockSkus}</span>
          ),
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          iconClassName: "bg-amber-500/10 text-amber-500",
        },
        {
          label: "SKU hết hàng",
          value: (
            <span className={kpi.outOfStockSkus > 0 ? "text-red-500" : ""}>
              {kpi.outOfStockSkus}
            </span>
          ),
          icon: <PackageOpen className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
        {
          label: "Tổng SL còn lại",
          value: kpi.totalRemainingUnits.toLocaleString("vi-VN"),
          icon: <Package className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildInventoryExportUrl("low-stock", { search, status, format });
  }

  const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "low", label: "Sắp hết (> 0)" },
    { value: "out", label: "Hết hàng (= 0)" },
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Cảnh báo hết hàng</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            SKU có tồn kho ≤ ngưỡng cảnh báo (mặc định 5)
          </p>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      {statItems && <MetricStatBar items={statItems} />}

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
                setStatus(opt.value);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                status === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
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
                Tồn kho
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Ngưỡng
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Trạng thái
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={8} cols={7} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={7} message="Không có SKU nào cần cảnh báo." />
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
                  <TableCell className="text-right">
                    <span
                      className={`text-sm font-black tabular-nums ${
                        r.onHand <= 0 ? "text-red-500" : "text-amber-600"
                      }`}
                    >
                      {r.onHand}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {r.lowStockThreshold}
                  </TableCell>
                  <TableCell>
                    <TonePill tone={r.status === "out-of-stock" ? "red" : "amber"}>
                      {getStockStatusLabel(r.status)}
                    </TonePill>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`${ADMIN_ROUTES.PURCHASES}/new?variantId=${r.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Tạo đơn nhập
                    </Link>
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
