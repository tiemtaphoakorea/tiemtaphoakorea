"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { AdminOrderListItem } from "@workspace/database/types/admin";
import { PAYMENT_METHOD } from "@workspace/shared/constants";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { useState } from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/admin.client";

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: AdminOrderListItem[];
  onSuccess: () => void;
}

export function QuickPaymentDialog({
  open,
  onOpenChange,
  selectedOrders,
  onSuccess,
}: QuickPaymentDialogProps) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<string>(PAYMENT_METHOD.BANK_TRANSFER);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eligibleOrders = selectedOrders.filter(
    (o) => o.paymentStatus === "unpaid" || o.paymentStatus === "partial",
  );
  const ineligibleCount = selectedOrders.length - eligibleOrders.length;
  const totalPayable = eligibleOrders.reduce(
    (sum, o) => sum + (Number(o.total) - Number(o.paidAmount)),
    0,
  );

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) setMethod(PAYMENT_METHOD.BANK_TRANSFER);
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (eligibleOrders.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    let successCount = 0;
    try {
      for (const order of eligibleOrders) {
        const amount = Number(order.total) - Number(order.paidAmount);
        try {
          await adminClient.recordOrderPayment(order.id, { amount, method });
          successCount += 1;
        } catch (err: unknown) {
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
          const message =
            err instanceof Error ? err.message : "Có lỗi xảy ra khi ghi nhận thanh toán.";
          toast.error("Lỗi thanh toán", {
            description: `Lỗi ở đơn ${order.orderNumber}: ${message}. Đã ghi nhận ${successCount}/${eligibleOrders.length} đơn.`,
          });
          return;
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Thanh toán thành công", {
        description: `Đã ghi nhận thanh toán cho ${successCount} đơn hàng.`,
      });
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Thanh toán nhanh đơn hàng</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Field>
            <FieldLabel>Chọn phương thức thanh toán</FieldLabel>
            <Select
              value={method}
              onValueChange={setMethod}
              disabled={isSubmitting}
              className="w-full"
            >
              <SelectOption value={PAYMENT_METHOD.CASH}>Tiền mặt</SelectOption>
              <SelectOption value={PAYMENT_METHOD.BANK_TRANSFER}>Chuyển khoản</SelectOption>
              <SelectOption value={PAYMENT_METHOD.CARD}>Quẹt thẻ</SelectOption>
            </Select>
          </Field>
          <div className="grid gap-2 rounded-lg border border-slate-100 p-4">
            <div className="flex justify-between text-sm">
              <span>Số đơn đủ điều kiện:</span>
              <span className="font-bold">{eligibleOrders.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Số đơn không đủ điều kiện:</span>
              <span className={`font-bold ${ineligibleCount > 0 ? "text-red-500" : ""}`}>
                {ineligibleCount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tổng tiền có thể thanh toán:</span>
              <span className="font-bold">{formatCurrency(totalPayable)}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 italic">
            Lưu ý: Hệ thống sẽ thanh toán lần lượt các đơn và tạo ra nhiều phiếu thu tương ứng với
            số lượng đơn hàng cần thanh toán.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Thoát
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || eligibleOrders.length === 0}
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
