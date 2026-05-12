"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DateRange,
  FinanceRangePicker,
} from "@/components/admin/analytics/finance-range-picker";
import { TableEmptyRow, TableLoadingRows } from "@/components/admin/shared/data-state";
import { fmtDateTime } from "@/lib/report-formatters";
import {
  type MissingCostOrderItem,
  type MissingCostOrderRow,
  reportsClient,
} from "@/services/reports.client";

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

type SelectedItem = {
  order: MissingCostOrderRow;
  item: MissingCostOrderItem;
};

export default function MissingCostOrdersContent() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<DateRange>(getThisMonthRange());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [unitCost, setUnitCost] = useState("");
  const [note, setNote] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "profit-loss-missing-cost", range, search, page],
    queryFn: () =>
      reportsClient.getMissingCostOrders({
        startDate: range.startDate,
        endDate: range.endDate,
        search,
        page,
        limit: 20,
      }),
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Chưa chọn dòng đơn hàng");
      return reportsClient.updateMissingCostOrderItem({
        orderId: selected.order.orderId,
        orderItemId: selected.item.orderItemId,
        unitCost: Number(unitCost),
        note: note.trim() || undefined,
        clientToken: crypto.randomUUID(),
      });
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật giá vốn.");
      setSelected(null);
      setUnitCost("");
      setNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reports", "profit-loss-missing-cost"] }),
        queryClient.invalidateQueries({ queryKey: ["reports", "profit-loss"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Cập nhật giá vốn thất bại");
    },
  });

  const rows = data?.data ?? [];
  const itemRows = rows.flatMap((order) => order.items.map((item) => ({ order, item })));
  const showLoading = hasMounted && isLoading;

  function openCostDialog(order: MissingCostOrderRow, item: MissingCostOrderItem) {
    setSelected({ order, item });
    setUnitCost(item.currentCostPrice > 0 ? String(item.currentCostPrice) : "");
    setNote("");
  }

  function submitCost() {
    const cost = Number(unitCost);
    if (!Number.isFinite(cost) || cost <= 0) {
      toast.error("Giá vốn phải lớn hơn 0.");
      return;
    }
    mutation.mutate();
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
        <h1 className="mt-1 text-2xl font-black tracking-tight">Đơn thiếu giá vốn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Các đơn đã xuất kho nhưng chưa đủ giá vốn, đang bị loại khỏi P&L chính thức.
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
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 w-64 pl-8 text-xs"
            placeholder="Mã đơn / khách / SKU"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {data && (
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Đơn ngoại lệ
            </div>
            <div className="mt-1 text-2xl font-black">{data.summary.orderCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Dòng thiếu giá vốn
            </div>
            <div className="mt-1 text-2xl font-black">{data.summary.itemCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Doanh thu chưa tính
            </div>
            <div className="mt-1 text-2xl font-black text-amber-600">
              {formatCurrency(data.summary.excludedRevenue)}
            </div>
          </Card>
        </div>
      )}

      <Card className="gap-0 overflow-hidden border-none p-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase">Đơn</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">
                Khách hàng
              </TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase">SKU</TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                SL
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Doanh thu dòng
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                WAC hiện tại
              </TableHead>
              <TableHead className="text-right text-xs font-black tracking-widest uppercase">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoading ? (
              <TableLoadingRows cols={7} rows={6} />
            ) : itemRows.length === 0 ? (
              <TableEmptyRow cols={7} message="Không có đơn thiếu giá vốn trong khoảng này." />
            ) : (
              itemRows.map(({ order, item }) => (
                <TableRow key={item.orderItemId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={ADMIN_ROUTES.ORDER_DETAIL(order.orderId)}
                        className="font-mono text-xs font-bold text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {fmtDateTime(order.stockOutAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{order.customerName ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.customerPhone ?? ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold">{item.sku}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.productName} / {item.variantName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(item.currentCostPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => openCostDialog(order, item)}>
                      Bổ sung giá vốn
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data && data.metadata.totalPages > 1 && (
        <PaginationControls
          currentPage={page}
          totalPages={data.metadata.totalPages}
          onPageChange={setPage}
        />
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bổ sung giá vốn</DialogTitle>
            <DialogDescription>
              {selected?.order.orderNumber} · {selected?.item.sku}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="unitCost" className="text-sm font-semibold">
                Giá vốn
              </label>
              <NumberInput
                id="unitCost"
                aria-label="Giá vốn"
                value={unitCost}
                min={1}
                decimalScale={0}
                onValueChange={(values) => setUnitCost(values.value)}
                placeholder="80.000"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="costNote" className="text-sm font-semibold">
                Ghi chú
              </label>
              <Input
                id="costNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="VD: theo phiếu nhập ngày 12/05"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button onClick={submitCost} disabled={mutation.isPending}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
