"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  type PickedVariant,
  VariantSearchPicker,
} from "@/components/admin/shared/variant-search-picker";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ItemRow = {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  orderedQty: string;
  unitCost: string;
  discount: string;
};

export default function NewPurchaseContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.admin.suppliersActive,
    queryFn: async () => {
      const res = await adminClient.getSuppliers({ limit: 200 });
      return (res as unknown as { data: { id: string; name: string }[] }).data ?? [];
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      await adminClient.createPurchase({
        supplierId: supplierId || undefined,
        expectedDate: expectedDate || undefined,
        note: note || undefined,
        items: items.map((r) => ({
          variantId: r.variantId,
          orderedQty: Number(r.orderedQty),
          unitCost: r.unitCost,
          discount: r.discount || undefined,
        })),
      }),
    onSuccess: () => {
      toast.success("Đã tạo đơn nhập");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.purchases.all });
      router.push("/purchases");
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể tạo đơn nhập");
    },
  });

  function handlePick(variant: PickedVariant) {
    setItems((prev) => {
      // Bumping qty on a duplicate pick is friendlier than ignoring the click.
      const existing = prev.findIndex((r) => r.variantId === variant.variantId);
      if (existing >= 0) {
        return prev.map((r, i) =>
          i === existing ? { ...r, orderedQty: String(Number(r.orderedQty) + 1) } : r,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.variantId,
          productName: variant.productName,
          variantName: variant.variantName,
          sku: variant.sku,
          orderedQty: "1",
          unitCost: variant.costPrice ?? "0",
          discount: "",
        },
      ];
    });
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateRow(idx: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Cần ít nhất 1 sản phẩm");
      return;
    }
    for (const [i, row] of items.entries()) {
      const qty = Number(row.orderedQty);
      if (!Number.isFinite(qty) || qty < 1) {
        toast.error(`Dòng ${i + 1}: số lượng phải lớn hơn 0`);
        return;
      }
      const cost = Number(row.unitCost);
      if (!Number.isFinite(cost) || cost < 0) {
        toast.error(`Dòng ${i + 1}: giá nhập không hợp lệ`);
        return;
      }
    }
    createMutation.mutate();
  }

  const suppliers: { id: string; name: string }[] = suppliersQuery.data ?? [];

  // Live aggregate so user can see total before submit (Sapo-style footer).
  const totals = items.reduce(
    (acc, r) => {
      const qty = Number(r.orderedQty) || 0;
      const cost = Number(r.unitCost) || 0;
      const disc = Number(r.discount) || 0;
      acc.qty += qty;
      acc.amount += qty * cost - disc;
      return acc;
    },
    { qty: 0, amount: 0 },
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pb-10">
      <div className="flex items-start gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/purchases">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Tạo đơn đặt hàng nhập
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
            Tồn kho sẽ chỉ tăng khi phiếu nhập hàng (PON) được hoàn tất từ đơn này.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 border border-border p-5 shadow-none">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Nhà cung cấp (tuỳ chọn)</FieldLabel>
            <Select
              value={supplierId}
              onValueChange={setSupplierId}
              disabled={suppliersQuery.isLoading}
            >
              <SelectOption value="">
                {suppliersQuery.isLoading ? "Đang tải..." : "-- Chọn nhà cung cấp --"}
              </SelectOption>
              {suppliers.map((s) => (
                <SelectOption key={s.id} value={s.id}>
                  {s.name}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field>
            <FieldLabel>Ngày dự kiến nhập</FieldLabel>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 border border-border p-5 shadow-none">
        <FieldLabel required className="text-sm">
          Sản phẩm
        </FieldLabel>

        <VariantSearchPicker
          selectedIds={items.map((r) => r.variantId)}
          onPick={handlePick}
          emptyHint="Chưa có sản phẩm nào — gõ tìm kiếm để bắt đầu"
        />

        {items.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm đã chọn</TableHead>
                  <TableHead className="w-20">SL</TableHead>
                  <TableHead className="w-32">Giá nhập (đ)</TableHead>
                  <TableHead className="w-28">Giảm giá (đ)</TableHead>
                  <TableHead className="w-32 text-right">Thành tiền</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row, idx) => {
                  const qty = Number(row.orderedQty) || 0;
                  const cost = Number(row.unitCost) || 0;
                  const disc = Number(row.discount) || 0;
                  const lineTotal = qty * cost - disc;
                  return (
                    <TableRow key={row.variantId}>
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{row.productName}</span>
                          <span className="text-xs text-muted-foreground">
                            <span className="font-mono">{row.sku}</span>
                            {row.variantName && (
                              <>
                                {" · "}
                                <span className="text-primary">{row.variantName}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={row.orderedQty}
                          onChange={(e) => updateRow(idx, "orderedQty", e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={row.unitCost}
                          onChange={(e) => updateRow(idx, "unitCost", e.target.value)}
                          className="h-8 w-full text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={row.discount}
                          onChange={(e) => updateRow(idx, "discount", e.target.value)}
                          placeholder="0"
                          className="h-8 w-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">
                        {lineTotal.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost-destructive"
                          size="icon-xs"
                          onClick={() => removeRow(idx)}
                          aria-label="Xoá dòng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="text-xs font-semibold text-muted-foreground">
                    Tổng
                  </TableCell>
                  <TableCell className="text-xs font-bold tabular-nums">{totals.qty}</TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right text-sm font-bold tabular-nums">
                    {totals.amount.toLocaleString("vi-VN")}đ
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3 border border-border p-5 shadow-none">
        <Field>
          <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú nội bộ cho đơn nhập"
          />
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-2.5">
        <Button asChild type="button" variant="outline">
          <Link href="/purchases">Huỷ</Link>
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Đang tạo..." : "Tạo đơn"}
        </Button>
      </div>
    </form>
  );
}
