"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CustomerDebtResponse } from "@workspace/database/types/admin";
import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { type BulkPaymentFormValues, bulkPaymentSchema } from "@workspace/shared/schemas";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Controller, useForm } from "react-hook-form";
import { adminClient } from "@/services/admin.client";

type UnpaidOrder = CustomerDebtResponse["unpaidOrders"][number];

interface BulkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidOrders: UnpaidOrder[];
  totalDebt: number;
  onSuccess: (summary: { paidAmount: number; affectedOrders: number }) => void | Promise<void>;
  onError: (error: { message: string; orderNumber?: string }) => void | Promise<void>;
}

type AllocationPlan = {
  orderId: string;
  orderNumber: string;
  allocate: number;
};

// stockOutAt arrives from the API as an ISO string (JSON serialization erases Date),
// but Drizzle types it as Date | null. Normalize defensively.
function stockOutMs(val: Date | string | null | undefined): number {
  if (val == null) return Infinity;
  const ms = val instanceof Date ? val.getTime() : new Date(val).getTime();
  return Number.isNaN(ms) ? Infinity : ms;
}

function buildAllocationPlan(orders: UnpaidOrder[], amount: number): AllocationPlan[] {
  // FIFO by stockOutAt. Nulls (and unparsable values) go last.
  const sorted = [...orders].sort((a, b) => stockOutMs(a.stockOutAt) - stockOutMs(b.stockOutAt));

  let remaining = amount;
  const plan: AllocationPlan[] = [];
  for (const order of sorted) {
    if (remaining <= 0) break;
    const debt = Number(order.total ?? 0) - Number(order.paidAmount ?? 0);
    if (debt <= 0) continue;
    const allocate = Math.min(remaining, debt);
    if (allocate > 0) {
      plan.push({ orderId: order.id, orderNumber: order.orderNumber, allocate });
      remaining -= allocate;
    }
  }
  return plan;
}

export function BulkPaymentDialog({
  open,
  onOpenChange,
  unpaidOrders,
  totalDebt,
  onSuccess,
  onError,
}: BulkPaymentDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BulkPaymentFormValues>({
    resolver: zodResolver(bulkPaymentSchema),
    defaultValues: {
      amount: 0,
      method: "cash",
      referenceCode: "",
      note: "",
    },
  });

  const amount = watch("amount");

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = async ({ amount, method, referenceCode, note }: BulkPaymentFormValues) => {
    if (isSubmitting) return;

    if (amount > totalDebt) {
      const excess = amount - totalDebt;
      await onError({
        message: `Số tiền vượt tổng nợ (còn thừa ${formatCurrency(excess)}).`,
      });
      return;
    }

    const plan = buildAllocationPlan(unpaidOrders, amount);
    if (plan.length === 0) {
      await onError({ message: "Không có đơn hàng nào đủ điều kiện để thu tiền." });
      return;
    }

    let paidAmount = 0;
    let affectedOrders = 0;
    for (const step of plan) {
      try {
        await adminClient.recordOrderPayment(step.orderId, {
          amount: step.allocate,
          method,
          referenceCode: referenceCode || undefined,
          note: note || undefined,
        });
        paidAmount += step.allocate;
        affectedOrders += 1;
      } catch (err: any) {
        const errorMessage = err?.message ?? "Có lỗi xảy ra khi ghi nhận thanh toán.";
        await onError({
          message: `Lỗi ở đơn ${step.orderNumber}: ${errorMessage}`,
          orderNumber: step.orderNumber,
        });
        return;
      }
    }
    await onSuccess({ paidAmount, affectedOrders });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Thu tiền công nợ</DialogTitle>
            <DialogDescription>
              Tổng nợ hiện tại: <span className="font-bold">{formatCurrency(totalDebt)}</span>. Số
              tiền sẽ được phân bổ lần lượt từ đơn cũ nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-amount">Số tiền (VND)</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <NumberInput
                    id="bulk-payment-amount"
                    value={field.value}
                    onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                    placeholder="Nhập số tiền"
                    max={totalDebt}
                  />
                )}
              />
              {errors.amount?.message ? (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-method">Phương thức</Label>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="bulk-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PAYMENT_METHOD.CASH}>Tiền mặt</SelectItem>
                      <SelectItem value={PAYMENT_METHOD.BANK_TRANSFER}>Chuyển khoản</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.method?.message ? (
                <p className="text-sm text-destructive">{errors.method.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-ref">Mã tham chiếu (tuỳ chọn)</Label>
              <Input
                id="bulk-payment-ref"
                {...register("referenceCode")}
                placeholder="Mã giao dịch nếu có"
              />
              {errors.referenceCode?.message ? (
                <p className="text-sm text-destructive">{errors.referenceCode.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-note">Ghi chú (tuỳ chọn)</Label>
              <Textarea
                id="bulk-payment-note"
                {...register("note")}
                placeholder="Ghi chú thêm..."
              />
              {errors.note?.message ? (
                <p className="text-sm text-destructive">{errors.note.message}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || amount <= 0}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
