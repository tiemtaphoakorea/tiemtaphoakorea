"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ProductWithVariantsRow = {
  id: string;
  name: string;
  variants: Array<{ id: string; name?: string | null; sku: string }>;
};

export function CreateSupplierOrderDialog({
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
