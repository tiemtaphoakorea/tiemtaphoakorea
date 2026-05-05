"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCustomerData,
  CustomerStatsItem,
  UpdateCustomerData,
} from "@workspace/database/types/admin";
import { customerSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const formSchema = customerSchema.extend({ isActive: z.boolean().optional() });
type FormValues = z.infer<typeof formSchema>;

type CustomerDrawerProps = {
  open: boolean;
  customer: CustomerStatsItem | null;
  onClose: () => void;
};

export function CustomerDrawer({ open, customer, onClose }: CustomerDrawerProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      customerType: "retail",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      fullName: customer?.fullName ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      customerType: (customer?.customerType as "retail" | "wholesale") ?? "retail",
      isActive: customer?.isActive ?? true,
    });
  }, [customer, open, reset]);

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

  const onFormSubmit = (values: FormValues) => {
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone?.trim() || undefined,
      address: values.address?.trim() || undefined,
      customerType: values.customerType,
    };
    if (customer) {
      updateMutation.mutate({ id: customer.id, data: { ...payload, isActive: values.isActive } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-120">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-sm font-bold">
            {customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel required>Họ và tên</FieldLabel>
                <Input {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-destructive text-sm">{errors.fullName.message}</p>
                )}
              </Field>
              <Field>
                <FieldLabel>Số điện thoại</FieldLabel>
                <Input {...register("phone")} />
                {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
              </Field>
              <Field>
                <FieldLabel>Địa chỉ</FieldLabel>
                <Input {...register("address")} />
              </Field>
              <Field>
                <FieldLabel>Loại khách hàng</FieldLabel>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} className="w-full">
                      <SelectOption value="retail">Bán lẻ</SelectOption>
                      <SelectOption value="wholesale">Bán sỉ</SelectOption>
                      <SelectOption value="vip">VIP</SelectOption>
                    </Select>
                  )}
                />
              </Field>
              {customer && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <span className="text-sm font-medium">Đang hoạt động</span>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              )}
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : customer ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
