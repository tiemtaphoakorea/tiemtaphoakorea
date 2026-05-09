"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { NumberInput } from "@workspace/ui/components/number-input";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditOpeningStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  variantSku: string;
  variantName: string;
  onUpdated?: (result: {
    oldOpening: number;
    newOpening: number;
    oldOnHand: number;
    newOnHand: number;
    noop: boolean;
  }) => void;
}

export function EditOpeningStockDialog({
  open,
  onOpenChange,
  variantId,
  variantSku,
  variantName,
  onUpdated,
}: EditOpeningStockDialogProps) {
  const [currentOpening, setCurrentOpening] = useState<number | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch the current opening quantity each time the dialog opens. Without
  // this, prefilling from `product_variants.on_hand` would silently corrupt
  // the opening on save (on_hand reflects post-stockout state, not opening).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setCurrentOpening(null);
    setNewQuantity(undefined);
    fetch(`/api/admin/inventory/opening-stock?variantId=${encodeURIComponent(variantId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Không tải được tồn đầu kỳ hiện tại");
        return res.json() as Promise<{ quantity: number | null }>;
      })
      .then((data) => {
        if (cancelled) return;
        setCurrentOpening(data.quantity);
        setNewQuantity(data.quantity ?? 0);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Không tải được");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, variantId]);

  const handleSubmit = async () => {
    if (newQuantity === undefined || !Number.isInteger(newQuantity) || newQuantity < 0) {
      toast.error("Số lượng phải là số nguyên không âm");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/opening-stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, newQuantity }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Cập nhật thất bại");
      }
      const result = await res.json();
      toast.success(
        result.noop
          ? "Tồn đầu kỳ không thay đổi"
          : `Đã cập nhật: ${result.oldOpening} → ${result.newOpening} · tồn kho hiện tại: ${result.newOnHand}`,
      );
      onUpdated?.(result);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa tồn đầu kỳ</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{variantSku}</span> · {variantName}
          </DialogDescription>
        </DialogHeader>
        <div className="my-2 flex flex-col gap-3">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Tồn đầu kỳ hiện tại: </span>
            <span className="font-semibold tabular-nums">
              {loading ? "..." : (currentOpening ?? "(chưa có)")}
            </span>
          </div>
          <Field>
            <FieldLabel htmlFor="newOpening">Số lượng tồn đầu kỳ mới</FieldLabel>
            <NumberInput
              id="newOpening"
              decimalScale={0}
              value={newQuantity}
              onValueChange={(v) => setNewQuantity(Math.max(0, v.floatValue ?? 0))}
              disabled={loading}
            />
          </Field>
          <p className="rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            ⚠️ Việc thay đổi sẽ tính lại toàn bộ chuỗi xuất/nhập của biến thể này và đồng bộ lại tồn
            kho hiện tại. Báo cáo XNT từ kỳ này về sau sẽ phản ánh giá trị mới.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={submitting}>
              Huỷ
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
