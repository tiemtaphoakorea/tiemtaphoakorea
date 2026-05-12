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
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Percent,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { MetricStatBar, type MetricStatItem } from "@/components/admin/shared/metric-stat-bar";
import { fmtDate, fmtPercent } from "@/lib/report-formatters";
import {
  type ProfitByOrderRow,
  type ProfitByOrderSort,
  reportsClient,
} from "@/services/reports.client";

function thisMonth(): DateRange {
  const now = new Date();
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

const SORT_OPTIONS: Array<{ value: ProfitByOrderSort; label: string }> = [
  { value: "recent", label: "Mới nhất" },
  { value: "profit_desc", label: "Lợi nhuận cao nhất" },
  { value: "profit_asc", label: "Lợi nhuận thấp nhất" },
  { value: "margin_desc", label: "Margin % cao nhất" },
];

function ProfitPctCell({ value }: { value: number }) {
  const tone = value >= 0 ? "text-emerald-600" : "text-red-500";
  return <span className={`tabular-nums font-semibold ${tone}`}>{fmtPercent(value)}</span>;
}

function ProfitCell({ value }: { value: number }) {
  const tone = value >= 0 ? "text-emerald-600" : "text-red-500";
  return <span className={`tabular-nums font-bold ${tone}`}>{formatCurrency(value)}</span>;
}

function OrderItemsTable({ items }: { items: ProfitByOrderRow["items"] }) {
  if (items.length === 0) {
    return (
      <div className="px-6 py-4 text-center text-xs text-muted-foreground">
        Đơn không có dòng sản phẩm.
      </div>
    );
  }
  return (
    <div className="border-l-2 border-primary/30 bg-muted/30 px-2 py-2">
      <Table>
        <TableHeader>
          <TableRow className="border-b-muted-foreground/10">
            <TableHead className="h-8 text-xs font-bold tracking-wide uppercase">
              Sản phẩm
            </TableHead>
            <TableHead className="h-8 text-xs font-bold tracking-wide uppercase">SKU</TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              SL
            </TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              Đơn giá
            </TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              Giá vốn
            </TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              Doanh thu
            </TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              Lợi nhuận
            </TableHead>
            <TableHead className="h-8 text-right text-xs font-bold tracking-wide uppercase">
              Margin
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.orderItemId} className="border-b-muted-foreground/5">
              <TableCell className="py-2 text-sm">
                <div className="font-semibold">{item.productName}</div>
                {item.variantName && item.variantName !== item.productName && (
                  <div className="text-xs text-muted-foreground">{item.variantName}</div>
                )}
              </TableCell>
              <TableCell className="py-2 font-mono text-xs">{item.sku}</TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                {item.quantity}
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums text-muted-foreground">
                {item.costPriceAtOrderTime > 0 ? (
                  formatCurrency(item.costPriceAtOrderTime)
                ) : (
                  <span className="text-amber-600">Chưa có</span>
                )}
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums font-semibold">
                {formatCurrency(item.lineTotal)}
              </TableCell>
              <TableCell className="py-2 text-right text-sm">
                <ProfitCell value={item.lineProfit} />
              </TableCell>
              <TableCell className="py-2 text-right text-sm">
                <ProfitPctCell value={item.lineProfitPct} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ProfitByOrderContent() {
  const [range, setRange] = useState<DateRange>(thisMonth());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ProfitByOrderSort>("recent");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "profit-by-order", range, search, sort, page],
    queryFn: () => reportsClient.getProfitByOrder({ ...range, search, sort, page, limit: 20 }),
  });

  const summary = data?.summary;
  const kpiItems: MetricStatItem[] | null = summary
    ? [
        {
          label: "Số đơn",
          value: summary.orderCount,
          icon: <ShoppingCart className="h-3.5 w-3.5" />,
          iconClassName: "bg-orange-500/10 text-orange-500",
        },
        {
          label: "Doanh thu",
          value: <span className="text-blue-600">{formatCurrency(summary.totalRevenue)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-blue-500/10 text-blue-500",
        },
        {
          label: "Giá vốn",
          value: <span className="text-muted-foreground">{formatCurrency(summary.totalCost)}</span>,
          icon: <DollarSign className="h-3.5 w-3.5" />,
          iconClassName: "bg-slate-500/10 text-slate-500",
        },
        {
          label: "Lợi nhuận",
          value: (
            <span className={summary.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
              {formatCurrency(summary.totalProfit)}
            </span>
          ),
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          iconClassName: "bg-emerald-500/10 text-emerald-500",
        },
        {
          label: "Margin TB",
          value: (
            <span className={summary.avgMargin >= 0 ? "text-emerald-600" : "text-red-500"}>
              {fmtPercent(summary.avgMargin)}
            </span>
          ),
          icon: <Percent className="h-3.5 w-3.5" />,
          iconClassName: "bg-primary/10 text-primary",
        },
      ]
    : null;

  const rows = data?.data ?? [];
  const totalPages = data?.metadata.totalPages ?? 1;

  function toggleExpanded(orderId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <Link
          href={ADMIN_ROUTES.REPORTS_PROFIT_LOSS}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Báo cáo lãi lỗ
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Lợi nhuận theo đơn hàng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chi tiết lợi nhuận từng đơn và từng dòng sản phẩm. Click vào dòng để xem chi tiết line
          items.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FinanceRangePicker
          value={range}
          onChange={(next) => {
            setRange(next);
            setPage(1);
          }}
        />
        <Input
          placeholder="Tìm mã đơn / khách hàng..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 w-56 text-xs"
        />
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as ProfitByOrderSort);
            setPage(1);
          }}
          className="h-8 w-44 text-xs"
        >
          {SORT_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>
      </div>

      {kpiItems && <MetricStatBar items={kpiItems} />}

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="text-xs font-black tracking-widest uppercase">Mã đơn</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">Ngày</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Khách hàng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Số dòng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Giá vốn
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Lợi nhuận
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Margin
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoadingRows cols={9} rows={5} />
            ) : rows.length === 0 ? (
              <TableEmptyRow cols={9} message="Không có đơn hàng nào trong kỳ" />
            ) : (
              rows.map((row) => {
                const isOpen = expanded.has(row.orderId);
                return (
                  <Row key={row.orderId} row={row} isOpen={isOpen} onToggle={toggleExpanded} />
                );
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-end border-t border-border bg-muted/20 px-4 py-2.5">
            <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        * Tính theo đơn đã xuất kho hoặc hoàn tất, không tính đơn đã hủy. Margin = Lợi nhuận / Doanh
        thu × 100%.
      </p>
    </div>
  );
}

function Row({
  row,
  isOpen,
  onToggle,
}: {
  row: ProfitByOrderRow;
  isOpen: boolean;
  onToggle: (orderId: string) => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onToggle(row.orderId)}>
        <TableCell className="text-muted-foreground">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-mono text-xs">
          <Link
            href={`${ADMIN_ROUTES.ORDERS}/${row.orderId}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {row.orderNumber}
            <ExternalLink className="h-3 w-3" />
          </Link>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{fmtDate(row.stockOutAt)}</TableCell>
        <TableCell className="text-sm">{row.customerName ?? "—"}</TableCell>
        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
          {row.itemCount}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums font-semibold">
          {formatCurrency(row.revenue)}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
          {formatCurrency(row.cost)}
        </TableCell>
        <TableCell className="text-right text-sm">
          <ProfitCell value={row.profit} />
        </TableCell>
        <TableCell className="text-right text-sm">
          <ProfitPctCell value={row.profitPct} />
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell colSpan={9} className="p-0">
            <OrderItemsTable items={row.items} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
