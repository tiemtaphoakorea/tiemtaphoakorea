"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { BookOpen, DollarSign, PackageCheck, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import { VariantPickerCombobox } from "@/components/admin/reports/variant-picker-combobox";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { TonePill } from "@/components/admin/shared/status-badge";
import { fmtDateTime } from "@/lib/report-formatters";
import { getMovementTypeLabel } from "@/lib/report-inventory-labels";
import {
  buildInventoryExportUrl,
  inventoryReportsClient,
  type VariantSearchRow,
} from "@/services/reports-inventory.client";

type TypeFilter = "all" | "in" | "out" | "adjust";

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

export default function LedgerContent() {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantSearchRow | null>(null);
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);

  const enabled = !!variantId;

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "inventory", "ledger", variantId, range, typeFilter, page],
    queryFn: () =>
      inventoryReportsClient.getLedger({
        variantId: variantId!,
        startDate: range.startDate,
        endDate: range.endDate,
        typeFilter,
        page,
        limit: 50,
      }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const kpi = data?.kpi;
  const rows = data?.data ?? [];
  const meta = data?.metadata;

  const statItems: MetricStatItem[] | null = kpi
    ? [
        {
          label: "Tồn đầu kỳ",
          value: kpi.openingBalance.toLocaleString("vi-VN"),
          icon: <BookOpen className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Tổng nhập",
          value: <span className="text-emerald-600">{kpi.totalQtyIn.toLocaleString("vi-VN")}</span>,
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Tổng xuất",
          value: <span className="text-red-500">{kpi.totalQtyOut.toLocaleString("vi-VN")}</span>,
          icon: <TrendingDown className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
        {
          label: "Tồn cuối kỳ",
          value: <span className="font-black">{kpi.closingBalance.toLocaleString("vi-VN")}</span>,
          icon: <PackageCheck className="h-3.5 w-3.5" />,
          iconClassName: "bg-indigo-500/10 text-indigo-500",
        },
        {
          label: "Giá trị nhập (ước tính)",
          value: formatCurrency(kpi.estimatedValueIn),
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-amber-500/10 text-amber-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildInventoryExportUrl("ledger", {
      variantId: variantId ?? "",
      ...range,
      typeFilter,
      format,
    });
  }

  const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "in", label: "Nhập" },
    { value: "out", label: "Xuất" },
    { value: "adjust", label: "Điều chỉnh" },
  ];

  function movementTone(type: string) {
    if (type === "supplier_receipt") return "green" as const;
    if (type === "stock_out") return "red" as const;
    return "gray" as const;
  }

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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Sổ kho</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nhật ký nhập-xuất chi tiết theo biến thể sản phẩm
          </p>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={!enabled || isLoading} />
      </div>

      {/* Controls: variant picker + date range + type filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <VariantPickerCombobox
            value={variantId}
            onChange={(id, v) => {
              setVariantId(id);
              setSelectedVariant(v);
              setPage(1);
            }}
            placeholder="Chọn sản phẩm/biến thể..."
          />
        </div>
        <FinanceRangePicker
          value={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
        />
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTypeFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                typeFilter === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Variant info bar */}
      {selectedVariant && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm">
          <span className="font-mono font-semibold">{selectedVariant.sku}</span>
          <span className="text-muted-foreground">—</span>
          <span className="font-semibold">{selectedVariant.productName}</span>
          {selectedVariant.variantName !== selectedVariant.productName && (
            <span className="text-muted-foreground">{selectedVariant.variantName}</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Tồn hiện tại: <strong>{selectedVariant.onHand}</strong>
          </span>
        </div>
      )}

      {/* Empty state — no variant selected */}
      {!variantId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-semibold">Chọn 1 sản phẩm/biến thể để xem sổ kho</p>
            <p className="text-sm text-muted-foreground">
              Sử dụng ô tìm kiếm phía trên để tìm theo SKU hoặc tên sản phẩm.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI bar */}
      {statItems && <MetricStatBar items={statItems} />}

      {/* Estimated cost disclaimer */}
      {enabled && (
        <p className="text-xs text-muted-foreground">
          * Giá vốn ước tính theo WAC hiện tại — chưa snapshot giá vốn tại thời điểm giao dịch.
        </p>
      )}

      {/* Table */}
      {variantId && (
        <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Ngày giờ
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Loại GD
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Nhập
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Xuất
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Tồn sau
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  WAC*
                </TableHead>
                <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                  Giá trị*
                </TableHead>
                <TableHead className="text-xs font-black tracking-widest uppercase">
                  Chứng từ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRows rows={8} cols={8} />
              ) : rows.length === 0 ? (
                <TableEmptyRow cols={8} message="Không có giao dịch trong kỳ này." />
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {fmtDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <TonePill tone={movementTone(r.type)}>
                        {getMovementTypeLabel(r.type)}
                      </TonePill>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums text-emerald-600">
                      {r.qtyIn > 0 ? `+${r.qtyIn}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold tabular-nums text-red-500">
                      {r.qtyOut > 0 ? `-${r.qtyOut}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-black tabular-nums">
                      {r.onHandAfter}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(r.estimatedUnitCost)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {r.estimatedValue > 0 ? formatCurrency(r.estimatedValue) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.referenceRoute ? (
                        <Link
                          href={r.referenceRoute}
                          className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                          target="_blank"
                        >
                          {r.referenceId?.slice(0, 8)}…
                        </Link>
                      ) : r.note ? (
                        <span className="truncate text-xs text-muted-foreground">{r.note}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

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
