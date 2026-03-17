"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { type SupplierOrderStatusFormValues, supplierOrderStatusSchema } from "@/lib/schemas";

interface SupplierOrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: any;
  statusConfig: Record<string, { label: string }>;
  isSubmitting: boolean;
  onUpdateStatus?: (data: any) => void;
  onClose: () => void;
}

export function SupplierOrderStatusDialog({
  open,
  onOpenChange,
  selectedOrder,
  statusConfig,
  isSubmitting,
  onUpdateStatus,
  onClose,
}: SupplierOrderStatusDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierOrderStatusFormValues>({
    resolver: zodResolver(supplierOrderStatusSchema),
    defaultValues: {
      status: "",
      actualCostPrice: "",
      expectedDate: "",
      note: "",
    },
  });

  useEffect(() => {
    if (selectedOrder) {
      reset({
        status: selectedOrder.status || "pending",
        actualCostPrice: selectedOrder.actualCostPrice?.toString() ?? "",
        expectedDate: selectedOrder.expectedDate
          ? new Date(selectedOrder.expectedDate).toISOString().split("T")[0]
          : "",
        note: selectedOrder.note ?? "",
      });
    }
  }, [selectedOrder, reset]);

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
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Trạng thái</Label>
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
                    <Label
                      htmlFor={key}
                      className="cursor-pointer text-sm font-medium text-slate-700"
                    >
                      {config.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.status && <p className="text-destructive text-sm">{errors.status.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actualCostPrice">Giá vốn thực tế (VND)</Label>
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expectedDate">Ngày dự kiến về</Label>
              <Input id="expectedDate" type="date" {...register("expectedDate")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea id="note" {...register("note")} placeholder="Ghi chú thêm..." />
              <p className="text-[10px] font-medium text-slate-400">
                * Ghi chú này sẽ được lưu lại khi bạn nhấn nút "Lưu thay đổi".
              </p>
            </div>
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
