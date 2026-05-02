"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPPLIER_ORDER_STATUS, SUPPLIER_ORDER_STATUS_ALL } from "@workspace/shared/constants";
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
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { Package, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { type BadgeTone, TonePill } from "@/components/admin/shared/status-badge";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type SupplierOrderRow = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string | Date | null;
  expectedDate: string | Date | null;
  note?: string | null;
  item: {
    productName?: string;
    variantName?: string;
    sku?: string;
  };
};

const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  [SUPPLIER_ORDER_STATUS.PENDING]: { tone: "amber", label: "Chờ đặt" },
  [SUPPLIER_ORDER_STATUS.ORDERED]: { tone: "blue", label: "Đã đặt" },
  [SUPPLIER_ORDER_STATUS.RECEIVED]: { tone: "green", label: "Đã nhận" },
  [SUPPLIER_ORDER_STATUS.CANCELLED]: { tone: "red", label: "Đã huỷ" },
};

const STATUS_OPTIONS = [
  { value: SUPPLIER_ORDER_STATUS_ALL, label: "Tất cả trạng thái" },
  { value: SUPPLIER_ORDER_STATUS.PENDING, label: "Chờ đặt" },
  { value: SUPPLIER_ORDER_STATUS.ORDERED, label: "Đã đặt" },
  { value: SUPPLIER_ORDER_STATUS.RECEIVED, label: "Đã nhận" },
  { value: SUPPLIER_ORDER_STATUS.CANCELLED, label: "Đã huỷ" },
];

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { tone: "gray" as BadgeTone, label: status };
  return <TonePill tone={meta.tone}>{meta.label}</TonePill>;
}

export default function SupplierOrdersContent() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [statusFilter, setStatusFilter] = useState<string>(SUPPLIER_ORDER_STATUS_ALL);
  const [createOpen, setCreateOpen] = useState(false);

  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: queryKeys.admin.supplierOrders.list(debouncedQuery, statusFilter),
    queryFn: async () =>
      (await adminClient.getSupplierOrders({
        search: debouncedQuery || undefined,
        status: statusFilter,
      })) as unknown as SupplierOrderRow[],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const list: SupplierOrderRow[] = ordersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo SKU, sản phẩm, ghi chú..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[260px]"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="h-[34px] w-full sm:w-[180px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <SelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </SelectOption>
          ))}
        </Select>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tạo đơn nhập
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Sản phẩm", "SKU", "SL", "Trạng thái", "Ngày dự kiến", "Ngày tạo"].map((h, i) => (
                  <TableHead
                    key={i}
                    className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.isLoading && <TableLoadingRows cols={6} rows={5} />}
              {ordersQuery.error && <TableErrorRow cols={6} message={String(ordersQuery.error)} />}
              {!ordersQuery.isLoading && list.length === 0 && (
                <TableEmptyRow cols={6} message="Chưa có đơn nhập" />
              )}
              {list.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-primary/10">
                        <Package className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold">
                          {o.item.productName ?? "—"}
                        </span>
                        {o.item.variantName && (
                          <span className="text-[11px] text-muted-foreground">
                            {o.item.variantName}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {o.item.sku ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums">{o.quantity}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <StatusPill status={o.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs">
                    {formatDate(o.expectedDate)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateSupplierOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.supplierOrders.all });
        }}
      />
    </div>
  );
}

type ProductWithVariantsRow = {
  id: string;
  name: string;
  variants: Array<{ id: string; name?: string | null; sku: string }>;
};

function CreateSupplierOrderDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");

  const productsQuery = useQuery({
    queryKey: queryKeys.products.variants(""),
    queryFn: async () => await adminClient.getProductsWithVariants(),
    enabled: open,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      await adminClient.createSupplierOrder({
        variantId,
        quantity: Number(quantity),
        expectedDate: expectedDate || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã tạo đơn nhập");
      onCreated();
      handleClose();
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể tạo đơn nhập");
    },
  });

  function handleClose() {
    setVariantId("");
    setQuantity("1");
    setExpectedDate("");
    setNote("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!variantId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 1) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
    createMutation.mutate();
  }

  const products: ProductWithVariantsRow[] =
    (productsQuery.data?.products as ProductWithVariantsRow[] | undefined) ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo đơn nhập hàng</DialogTitle>
            <DialogDescription>
              Tạo đơn nhập hàng mới từ nhà cung cấp. Tồn kho sẽ tăng khi đơn chuyển sang "Đã nhận".
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex flex-col gap-3.5">
            <Field>
              <FieldLabel>Sản phẩm</FieldLabel>
              <Select
                value={variantId}
                onValueChange={setVariantId}
                disabled={productsQuery.isLoading}
              >
                <SelectOption value="">
                  {productsQuery.isLoading ? "Đang tải..." : "-- Chọn sản phẩm --"}
                </SelectOption>
                {products.flatMap((p) =>
                  p.variants.map((v) => (
                    <SelectOption key={v.id} value={v.id}>
                      {p.name}
                      {v.name ? ` — ${v.name}` : ""} ({v.sku})
                    </SelectOption>
                  )),
                )}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field>
                <FieldLabel>Số lượng</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Ngày dự kiến (tuỳ chọn)</FieldLabel>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đặt gấp cho đơn #123"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo đơn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
