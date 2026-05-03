"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient, type InventoryMovement } from "@/services/admin.client";

const MOVEMENT_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  stock_out: { label: "Xuất kho", variant: "destructive" },
  supplier_receipt: { label: "Nhập hàng", variant: "default" },
  manual_adjustment: { label: "Điều chỉnh", variant: "secondary" },
  cancellation: { label: "Hoàn hàng", variant: "outline" },
};

const movementColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
  },
  {
    accessorKey: "variantSku",
    header: "SKU",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.variantSku}</div>
        <div className="text-xs text-muted-foreground">{row.original.variantName}</div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const cfg = MOVEMENT_LABELS[row.original.type];
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: "quantity",
    header: "Số lượng",
    cell: ({ row }) => {
      const qty = row.original.quantity;
      return (
        <span className={qty > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {qty > 0 ? `+${qty}` : qty}
        </span>
      );
    },
  },
  {
    id: "onHand",
    header: "Tồn kho",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.onHandBefore} → {row.original.onHandAfter}
      </span>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Người thực hiện",
    cell: ({ row }) => row.original.createdByName ?? "Hệ thống",
  },
  {
    accessorKey: "note",
    header: "Ghi chú",
    cell: ({ row }) => row.original.note ?? "—",
  },
];

export function InventoryMovementsTab() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const queryClient = useQueryClient();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.admin.inventory.movements({ page, limit }),
    queryFn: () => adminClient.getInventoryMovements({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.admin.products.withVariants,
    queryFn: () => adminClient.getProductsWithVariants(),
    enabled: adjustOpen,
    staleTime: 5 * 60_000,
  });

  const products = productsQuery.data?.products ?? [];
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const adjustMutation = useMutation({
    mutationFn: (body: { variantId: string; quantity: number; note?: string }) =>
      adminClient.adjustInventory(body),
    onSuccess: () => {
      toast.success("Đã điều chỉnh tồn kho");
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory", "movements"] });
      setAdjustOpen(false);
      setProductId("");
      setVariantId("");
      setQuantity("");
      setNote("");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể điều chỉnh tồn kho";
      toast.error(msg);
    },
  });

  const movements = data?.data ?? [];
  const metadata = data?.metadata;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!variantId) {
      toast.error("Vui lòng chọn sản phẩm và biến thể");
      return;
    }
    if (!Number.isFinite(qty) || qty === 0) {
      toast.error("Số lượng phải khác 0");
      return;
    }
    adjustMutation.mutate({
      variantId,
      quantity: qty,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setAdjustOpen(true)}>
          <Plus className="h-4 w-4" />
          Điều chỉnh tồn kho
        </Button>
      </div>

      <DataTable
        columns={movementColumns}
        data={movements}
        isLoading={isLoading}
        isFetching={isFetching}
        pageCount={metadata?.totalPages ?? 1}
        pagination={{ pageIndex: page - 1, pageSize: limit }}
        onPaginationChange={(p) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("page", String(p.pageIndex + 1));
          router.push(`${pathname}?${params.toString()}`);
        }}
        emptyMessage="Chưa có giao dịch kho nào."
      />

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
              <DialogDescription>Số lượng dương để cộng thêm, âm để trừ bớt.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="productId">Sản phẩm</FieldLabel>
                  <Select
                    value={productId}
                    onValueChange={(v) => {
                      setProductId(v);
                      setVariantId("");
                    }}
                    disabled={productsQuery.isLoading}
                  >
                    <SelectOption value="">
                      {productsQuery.isLoading ? "Đang tải..." : "-- Chọn sản phẩm --"}
                    </SelectOption>
                    {products.map((p) => (
                      <SelectOption key={p.id} value={p.id}>
                        {p.name}
                      </SelectOption>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="variantId">Biến thể</FieldLabel>
                  <Select
                    value={variantId}
                    onValueChange={setVariantId}
                    disabled={!selectedProduct}
                  >
                    <SelectOption value="">
                      {selectedProduct ? "-- Chọn biến thể --" : "Vui lòng chọn sản phẩm trước"}
                    </SelectOption>
                    {selectedProduct?.variants.map((v) => (
                      <SelectOption key={v.id} value={v.id}>
                        {v.sku} · Tồn {v.onHand ?? 0}
                      </SelectOption>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="quantity">Số lượng</FieldLabel>
                  <Input
                    id="quantity"
                    type="number"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="VD: 10 hoặc -5"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Lý do điều chỉnh..."
                  />
                </Field>
              </FieldGroup>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustOpen(false)}
                disabled={adjustMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
