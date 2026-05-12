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
import { ArrowDownCircle, ArrowUpCircle, Layers, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { ReportExportMenu } from "@/components/admin/reports/report-export-menu";
import {
  type MovementsLogTarget,
  ReportMovementsLogSheet,
} from "@/components/admin/reports/report-movements-log-sheet";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import {
  buildInventoryExportUrl,
  type InOutMovementRow,
  inventoryReportsClient,
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

export default function InOutMovementContent() {
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(1);
  const [drillTarget, setDrillTarget] = useState<MovementsLogTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "inventory", "in-out-movement", range, search, typeFilter, page],
    queryFn: () =>
      inventoryReportsClient.getInOutMovement({
        ...range,
        search,
        typeFilter,
        page,
        limit: 50,
      }),
    placeholderData: (prev) => prev,
  });

  const kpi = data?.kpi;
  const rows = data?.data ?? [];
  const meta = data?.metadata;

  const statItems: MetricStatItem[] | null = kpi
    ? [
        {
          label: "Tổng nhập",
          value: <span className="text-emerald-600">{kpi.totalQtyIn.toLocaleString("vi-VN")}</span>,
          icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Tổng xuất",
          value: <span className="text-red-500">{kpi.totalQtyOut.toLocaleString("vi-VN")}</span>,
          icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
          iconClassName: "bg-red-500/10 text-red-500",
        },
        {
          label: "Điều chỉnh",
          value: kpi.totalQtyAdjust.toLocaleString("vi-VN"),
          icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "SKU có biến động",
          value: kpi.variantsWithMovement.toLocaleString("vi-VN"),
          icon: <Layers className="h-3.5 w-3.5" />,
          iconClassName: "bg-indigo-500/10 text-indigo-500",
        },
      ]
    : null;

  function getExportUrl(format: "csv" | "csv-detail" | "xlsx") {
    return buildInventoryExportUrl("in-out-movement", { ...range, search, typeFilter, format });
  }

  function openDrill(r: InOutMovementRow) {
    setDrillTarget({
      variantId: r.variantId,
      sku: r.sku,
      productName: r.productName,
      variantName: r.variantName,
    });
  }

  const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "in", label: "Nhập" },
    { value: "out", label: "Xuất" },
    { value: "adjust", label: "Điều chỉnh" },
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
          <h1 className="mt-1 text-2xl font-black tracking-tight">Xuất nhập tồn theo kỳ</h1>
        </div>
        <ReportExportMenu getExportUrl={getExportUrl} disabled={isLoading} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker
          value={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
        />
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

      <Card className="overflow-hidden border-none shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">SKU</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Sản phẩm
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tồn đầu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Nhập
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Xuất
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Điều chỉnh
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Tồn cuối
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows rows={8} cols={7} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={7} message="Không có biến động trong kỳ." />
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.variantId}
                  className="cursor-pointer hover:bg-accent/40"
                  onClick={() => openDrill(r)}
                >
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
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {r.opening}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums text-emerald-600">
                    {r.qtyIn > 0 ? `+${r.qtyIn}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums text-red-500">
                    {r.qtyOut > 0 ? `-${r.qtyOut}` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {r.qtyAdjust !== 0 ? (r.qtyAdjust > 0 ? `+${r.qtyAdjust}` : r.qtyAdjust) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-black tabular-nums">
                    {r.closing}
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

      <ReportMovementsLogSheet
        target={drillTarget}
        startDate={range.startDate}
        endDate={range.endDate}
        onClose={() => setDrillTarget(null)}
      />
    </div>
  );
}
