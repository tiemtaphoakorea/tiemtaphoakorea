"use client";

import type { CustomerDebtResponse } from "@workspace/database/types/admin";
import { PAYMENT_METHOD } from "@workspace/shared/constants";
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
import { useState } from "react";
import { adminClient } from "@/services/admin.client";

type UnpaidOrder = CustomerDebtResponse["unpaidOrders"][number];
type PaymentMethodValue = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

interface BulkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidOrders: UnpaidOrder[];
  totalDebt: number;
  onSuccess: (summary: { paidAmount: number; affectedOrders: number }) => void;
  onError: (error: { message: string; orderNumber?: string }) => void;
}

type AllocationPlan = {
  orderId: string;
  orderNumber: string;
  allocate: number;
};

function buildAllocationPlan(orders: UnpaidOrder[], amount: number): AllocationPlan[] {
  // FIFO by stockOutAt. Nulls go last.
  const sorted = [...orders].sort(
    (a, b) => (a.stockOutAt?.getTime() ?? Infinity) - (b.stockOutAt?.getTime() ?? Infinity),
  );

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
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethodValue>(PAYMENT_METHOD.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount(0);
    setMethod(PAYMENT_METHOD.CASH);
    setReferenceCode("");
    setNote("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!Number.isFinite(amount) || amount <= 0) {
      onError({ message: "Số tiền phải lớn hơn 0." });
      return;
    }

    if (amount > totalDebt) {
      const excess = amount - totalDebt;
      onError({
        message: `Số tiền vượt tổng nợ (còn thừa ${formatCurrency(excess)}).`,
      });
      return;
    }

    const plan = buildAllocationPlan(unpaidOrders, amount);
    if (plan.length === 0) {
      onError({ message: "Không có đơn hàng nào đủ điều kiện để thu tiền." });
      return;
    }

    setIsSubmitting(true);
    let paidAmount = 0;
    let affectedOrders = 0;
    try {
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
          const errorMessage =
            err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra khi ghi nhận thanh toán.";
          onError({
            message: `Lỗi ở đơn ${step.orderNumber}: ${errorMessage}`,
            orderNumber: step.orderNumber,
          });
          return;
        }
      }
      onSuccess({ paidAmount, affectedOrders });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
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
              <NumberInput
                id="bulk-payment-amount"
                value={amount}
                onValueChange={(values) => setAmount(values.floatValue ?? 0)}
                placeholder="Nhập số tiền"
                max={totalDebt}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-method">Phương thức</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as PaymentMethodValue)}
              >
                <SelectTrigger id="bulk-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PAYMENT_METHOD.CASH}>Tiền mặt</SelectItem>
                  <SelectItem value={PAYMENT_METHOD.BANK_TRANSFER}>Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-ref">Mã tham chiếu (tuỳ chọn)</Label>
              <Input
                id="bulk-payment-ref"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="Mã giao dịch nếu có"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk-payment-note">Ghi chú (tuỳ chọn)</Label>
              <Textarea
                id="bulk-payment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm..."
              />
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
