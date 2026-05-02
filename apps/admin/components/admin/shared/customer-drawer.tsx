"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCustomerData,
  CustomerStatsItem,
  UpdateCustomerData,
} from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type CustomerDrawerProps = {
  open: boolean;
  customer: CustomerStatsItem | null;
  onClose: () => void;
};

export function CustomerDrawer({ open, customer, onClose }: CustomerDrawerProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState("retail");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setFullName(customer?.fullName ?? "");
    setPhone(customer?.phone ?? "");
    setAddress(customer?.address ?? "");
    setCustomerType(customer?.customerType ?? "retail");
    setIsActive(customer?.isActive ?? true);
  }, [customer, open]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerData) => adminClient.createCustomer(data),
    onSuccess: () => {
      toast.success("Đã thêm khách hàng");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerData }) =>
      adminClient.updateCustomer(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Họ tên bắt buộc");
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      customerType,
    };
    if (customer) {
      updateMutation.mutate({ id: customer.id, data: { ...payload, isActive } });
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
            {customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-[22px] py-[22px]">
          <FieldGroup>
            <Field>
              <FieldLabel>Họ và tên</FieldLabel>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Số điện thoại</FieldLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Địa chỉ</FieldLabel>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Loại khách hàng</FieldLabel>
              <Select value={customerType} onValueChange={setCustomerType} className="w-full">
                <SelectOption value="retail">Bán lẻ</SelectOption>
                <SelectOption value="wholesale">Bán sỉ</SelectOption>
                <SelectOption value="vip">VIP</SelectOption>
              </Select>
            </Field>
            {customer && (
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
            {isPending ? "Đang lưu..." : customer ? "Lưu thay đổi" : "Thêm"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
