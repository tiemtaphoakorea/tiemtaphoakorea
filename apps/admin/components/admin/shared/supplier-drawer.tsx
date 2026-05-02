"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSupplierData,
  Supplier,
  UpdateSupplierData,
} from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type SupplierDrawerProps = {
  open: boolean;
  /** Editing existing supplier, null = adding new. */
  supplier: Supplier | null;
  onClose: () => void;
};

export function SupplierDrawer({ open, supplier, onClose }: SupplierDrawerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [note, setNote] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(supplier?.name ?? "");
    setPhone(supplier?.phone ?? "");
    setEmail(supplier?.email ?? "");
    setAddress(supplier?.address ?? "");
    setPaymentTerms(supplier?.paymentTerms ?? "");
    setNote(supplier?.note ?? "");
    setIsActive(supplier?.isActive ?? true);
  }, [supplier, open]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierData) => adminClient.createSupplier(data),
    onSuccess: () => {
      toast.success("Đã thêm nhà cung cấp");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierData }) =>
      adminClient.updateSupplier(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Tên nhà cung cấp bắt buộc");
      return;
    }
    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      paymentTerms: paymentTerms.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (supplier) {
      updateMutation.mutate({ id: supplier.id, data: { ...payload, isActive } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">
            {supplier ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-[22px] py-[22px]">
          <FieldGroup>
            <Field>
              <FieldLabel>Tên nhà cung cấp</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lotte Trading Korea"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field>
                <FieldLabel>Số điện thoại</FieldLabel>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@..."
                />
              </Field>
            </div>
            <Field>
              <FieldLabel>Địa chỉ</FieldLabel>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Điều khoản thanh toán</FieldLabel>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="VD: NET 30, COD..."
              />
            </Field>
            <Field>
              <FieldLabel>Ghi chú</FieldLabel>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </Field>
            {supplier && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-[13px] font-medium">Đang hoạt động</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </FieldGroup>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Đang lưu..." : supplier ? "Lưu thay đổi" : "Thêm"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
