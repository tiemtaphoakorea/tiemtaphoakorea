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
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Textarea } from "@workspace/ui/components/textarea";
import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  type PickedVariant,
  VariantSearchPicker,
} from "@/components/admin/shared/variant-search-picker";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { toDateInputValue } from "../_shared";

type LineItem = {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: string;
  unitCost: string;
  discount: string;
  note: string;
};

type SupplierRow = { id: string; name: string };

export default function NewReceiptContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const purchaseOrderIdFromQuery = searchParams.get("purchaseOrderId") ?? "";

  const [supplierId, setSupplierId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState(purchaseOrderIdFromQuery);
  const [invoiceDate, setInvoiceDate] = useState(toDateInputValue(new Date()));
  const [invoiceRef, setInvoiceRef] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [extraCost, setExtraCost] = useState("0");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);

  const suppliersQuery = useQuery({
    queryKey: queryKeys.admin.suppliersActive,
    queryFn: async () => {
      const res = await adminClient.getSuppliers({ limit: 200 });
      return (res as unknown as { data: SupplierRow[] }).data ?? [];
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const items = lines.map((l) => ({
        variantId: l.variantId,
        quantity: Number(l.quantity),
        unitCost: l.unitCost,
        discount: l.discount !== "0" && l.discount !== "" ? l.discount : undefined,
        note: l.note || undefined,
      }));

      if (items.length === 0) throw new Error("Cần ít nhất 1 sản phẩm");

      return adminClient.createReceipt({
        supplierId: supplierId || undefined,
        purchaseOrderId: purchaseOrderId || undefined,
        invoiceDate: invoiceDate || undefined,
        invoiceRef: invoiceRef || undefined,
        discountAmount: discountAmount !== "0" ? discountAmount : undefined,
        extraCost: extraCost !== "0" ? extraCost : undefined,
        note: note || undefined,
        items,
      });
    },
    onSuccess: () => {
      toast.success("Đã tạo phiếu nhập hàng");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.receipts.all });
      router.push("/receipts");
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể tạo phiếu nhập");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Cần ít nhất 1 sản phẩm");
      return;
    }
    for (const l of lines) {
      const q = Number(l.quantity);
      if (!Number.isFinite(q) || q < 1) {
        toast.error("Số lượng phải lớn hơn 0");
        return;
      }
    }
    createMutation.mutate();
  }

  function handlePick(variant: PickedVariant) {
    setLines((prev) => {
      const existing = prev.findIndex((r) => r.variantId === variant.variantId);
      if (existing >= 0) {
        return prev.map((r, i) =>
          i === existing ? { ...r, quantity: String(Number(r.quantity) + 1) } : r,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.variantId,
          productName: variant.productName,
          variantName: variant.variantName,
          sku: variant.sku,
          quantity: "1",
          unitCost: variant.costPrice ?? "0",
          discount: "0",
          note: "",
        },
      ];
    });
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  const suppliers: SupplierRow[] = suppliersQuery.data ?? [];

  // Live aggregate so user can preview total before submit.
  const totals = lines.reduce(
    (acc, l) => {
      const qty = Number(l.quantity) || 0;
      const cost = Number(l.unitCost) || 0;
      const disc = Number(l.discount) || 0;
      acc.qty += qty;
      acc.amount += qty * cost - disc;
      return acc;
    },
    { qty: 0, amount: 0 },
  );
  const headerDiscount = Number(discountAmount) || 0;
  const headerExtra = Number(extraCost) || 0;
  const payable = totals.amount - headerDiscount + headerExtra;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pb-10">
      <div className="flex items-start gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/receipts">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Tạo phiếu nhập hàng
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
            Hoàn tất phiếu sẽ tăng tồn kho và cập nhật giá vốn (WAC liên hoàn).
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-3.5 border border-border p-5 shadow-none">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Nhà cung cấp</FieldLabel>
            <Select
              value={supplierId}
              onValueChange={setSupplierId}
              disabled={suppliersQuery.isLoading}
            >
              <SelectOption value="">
                {suppliersQuery.isLoading ? "Đang tải..." : "-- Chọn NCC --"}
              </SelectOption>
              {suppliers.map((s) => (
                <SelectOption key={s.id} value={s.id}>
                  {s.name}
                </SelectOption>
              ))}
            </Select>
          </Field>
          <Field>
            <FieldLabel>Ngày lập phiếu</FieldLabel>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Mã hoá đơn NCC (tuỳ chọn)</FieldLabel>
            <Input
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="Số hoá đơn / chứng từ"
            />
          </Field>
          <Field>
            <FieldLabel>Mã đặt hàng (tuỳ chọn)</FieldLabel>
            <Input
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              placeholder="ID đơn đặt hàng"
            />
          </Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 border border-border p-5 shadow-none">
        <FieldLabel required className="text-sm">
          Sản phẩm
        </FieldLabel>

        <VariantSearchPicker
          selectedIds={lines.map((l) => l.variantId)}
          onPick={handlePick}
          emptyHint="Chưa có sản phẩm nào — gõ tìm kiếm để bắt đầu"
        />

        {lines.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm đã chọn</TableHead>
                  <TableHead className="w-20">SL</TableHead>
                  <TableHead className="w-32">Đơn giá</TableHead>
                  <TableHead className="w-28">Chiết khấu</TableHead>
                  <TableHead className="w-32 text-right">Thành tiền</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => {
                  const qty = Number(line.quantity) || 0;
                  const cost = Number(line.unitCost) || 0;
                  const disc = Number(line.discount) || 0;
                  const lineTotal = qty * cost - disc;
                  return (
                    <TableRow key={line.variantId}>
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">{line.productName}</span>
                          <span className="text-xs text-muted-foreground">
                            <span className="font-mono">{line.sku}</span>
                            {line.variantName && (
                              <>
                                {" · "}
                                <span className="text-primary">{line.variantName}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={line.unitCost}
                          onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={line.discount}
                          onChange={(e) => updateLine(idx, { discount: e.target.value })}
                          className="w-24"
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
                          onClick={() => removeLine(idx)}
                          aria-label="Xoá dòng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3.5 border border-border p-5 shadow-none">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Chiết khấu tổng (đ)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field>
            <FieldLabel>Phí phát sinh (đ)</FieldLabel>
            <Input
              type="number"
              min={0}
              value={extraCost}
              onChange={(e) => setExtraCost(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú nội bộ"
          />
        </Field>

        <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng SL</span>
            <span className="tabular-nums font-semibold">{totals.qty}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tổng tiền hàng</span>
            <span className="tabular-nums">{totals.amount.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Chiết khấu / Phí phát sinh</span>
            <span className="tabular-nums">
              -{headerDiscount.toLocaleString("vi-VN")} / +{headerExtra.toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
            <span className="font-semibold">Phải trả NCC</span>
            <span className="tabular-nums text-base font-bold">
              {payable.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2.5">
        <Button asChild type="button" variant="outline">
          <Link href="/receipts">Huỷ</Link>
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Đang tạo..." : "Tạo phiếu"}
        </Button>
      </div>
    </form>
  );
}
