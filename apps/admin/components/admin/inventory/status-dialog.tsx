"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type SupplierOrderStatusFormValues,
  supplierOrderStatusSchema,
} from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
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
import { NumberInput } from "@workspace/ui/components/number-input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Controller, useForm } from "react-hook-form";

interface InventoryStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: any;
  statusConfig: Record<string, { label: string }>;
  isSubmitting: boolean;
  onUpdateStatus?: (data: any) => void;
  onClose: () => void;
}

export function InventoryStatusDialog({
  open,
  onOpenChange,
  selectedOrder,
  statusConfig,
  isSubmitting,
  onUpdateStatus,
  onClose,
}: InventoryStatusDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierOrderStatusFormValues>({
    resolver: zodResolver(supplierOrderStatusSchema),
    values: selectedOrder
      ? {
          status: selectedOrder.status || "pending",
          actualCostPrice: selectedOrder.actualCostPrice?.toString() ?? "",
          expectedDate: selectedOrder.expectedDate
            ? new Date(selectedOrder.expectedDate).toISOString().split("T")[0]
            : "",
          note: selectedOrder.note ?? "",
        }
      : { status: "", actualCostPrice: "", expectedDate: "", note: "" },
  });

  const onFormSubmit = (data: SupplierOrderStatusFormValues) => {
    if (!selectedOrder || !onUpdateStatus) return;
    onUpdateStatus({
      id: selectedOrder.id,
      status: data.status,
      actualCostPrice: data.actualCostPrice,
      expectedDate: data.expectedDate || undefined,
      note: data.note ?? undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho đơn đặt hàng #{selectedOrder?.order?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Trạng thái</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={key}
                        value={key}
                        {...register("status")}
                        className="peer text-primary focus:ring-primary h-4 w-4 border-gray-300"
                      />
                      <FieldLabel
                        htmlFor={key}
                        className="cursor-pointer text-sm font-medium text-slate-700"
                      >
                        {config.label}
                      </FieldLabel>
                    </div>
                  ))}
                </div>
                {errors.status && (
                  <p className="text-destructive text-sm">{errors.status.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="actualCostPrice">Giá vốn thực tế (VND)</FieldLabel>
                <Controller
                  name="actualCostPrice"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      id="actualCostPrice"
                      value={field.value}
                      onValueChange={(values) => field.onChange(values.value ?? "")}
                      placeholder="Nhập giá vốn nếu có thay đổi"
                    />
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="expectedDate">Ngày dự kiến về</FieldLabel>
                <Input id="expectedDate" type="date" {...register("expectedDate")} />
              </Field>

              <Field>
                <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
                <Textarea id="note" {...register("note")} placeholder="Ghi chú thêm..." />
                <p className="text-[10px] font-medium text-slate-400">
                  * Ghi chú này sẽ được lưu lại khi bạn nhấn nút "Lưu thay đổi".
                </p>
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
