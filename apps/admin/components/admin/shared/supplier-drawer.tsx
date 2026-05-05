"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateSupplierData,
  Supplier,
  UpdateSupplierData,
} from "@workspace/database/types/admin";
import { supplierSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

// Extend the shared supplierSchema with isActive for edit mode
const formSchema = supplierSchema.extend({ isActive: z.boolean().optional() });
type FormValues = z.infer<typeof formSchema>;

type SupplierDrawerProps = {
  open: boolean;
  /** Editing existing supplier, null = adding new. */
  supplier: Supplier | null;
  onClose: () => void;
};

export function SupplierDrawer({ open, supplier, onClose }: SupplierDrawerProps) {
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
      name: "",
      phone: "",
      email: "",
      address: "",
      paymentTerms: "",
      note: "",
      isActive: true,
    },
  });

  // Reset form fields whenever the drawer opens or the target supplier changes
  useEffect(() => {
    if (!open) return;
    reset({
      name: supplier?.name ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      paymentTerms: supplier?.paymentTerms ?? "",
      note: supplier?.note ?? "",
      isActive: supplier?.isActive ?? true,
    });
  }, [supplier, open, reset]);

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

  const onFormSubmit = (values: FormValues) => {
    const payload = {
      name: values.name.trim(),
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      paymentTerms: values.paymentTerms?.trim() || undefined,
      note: values.note?.trim() || undefined,
    };

    if (supplier) {
      updateMutation.mutate({ id: supplier.id, data: { ...payload, isActive: values.isActive } });
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
            {supplier ? "Chỉnh sửa nhà cung cấp" : "Thêm nhà cung cấp"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel required>Tên nhà cung cấp</FieldLabel>
                <Input
                  {...register("name")}
                  placeholder="VD: Lotte Trading Korea"
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <Input {...register("phone")} />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    {...register("email")}
                    placeholder="contact@..."
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel>Địa chỉ</FieldLabel>
                <Input {...register("address")} />
              </Field>

              <Field>
                <FieldLabel>Điều khoản thanh toán</FieldLabel>
                <Input {...register("paymentTerms")} placeholder="VD: NET 30, COD..." />
              </Field>

              <Field>
                <FieldLabel>Ghi chú</FieldLabel>
                <Textarea {...register("note")} rows={3} />
              </Field>

              {supplier && (
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
              {isPending ? "Đang lưu..." : supplier ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
