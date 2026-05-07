"use client";

import { useMutation } from "@tanstack/react-query";
import {
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABEL,
  type PaymentMethodValue,
} from "@workspace/shared/constants";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/admin.client";
import { toDateInputValue } from "./_shared";

type Props = {
  open: boolean;
  receiptId: string;
  supplierId: string;
  maxAmount: number;
  onClose: () => void;
  onPaid: () => void;
};

export function PaymentDialog({ open, receiptId, supplierId, maxAmount, onClose, onPaid }: Props) {
  const [amount, setAmount] = useState(String(maxAmount > 0 ? maxAmount : ""));
  const [method, setMethod] = useState<PaymentMethodValue>(PAYMENT_METHOD.CASH);
  const [referenceCode, setReferenceCode] = useState("");
  const [paidAt, setPaidAt] = useState(toDateInputValue(new Date()));
  const [note, setNote] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const amountNum = Number(amount);
      if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw new Error("Số tiền phải lớn hơn 0");
      }
      return adminClient.createPayout({
        supplierId,
        receiptId,
        amount: String(amountNum),
        method,
        referenceCode: referenceCode || undefined,
        paidAt: paidAt || undefined,
        note: note || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Đã ghi nhận thanh toán");
      onPaid();
      handleClose();
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể ghi nhận thanh toán");
    },
  });

  function handleClose() {
    setAmount(String(maxAmount > 0 ? maxAmount : ""));
    setMethod(PAYMENT_METHOD.CASH);
    setReferenceCode("");
    setPaidAt(toDateInputValue(new Date()));
    setNote("");
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  const methods = [
    { value: PAYMENT_METHOD.CASH, label: PAYMENT_METHOD_LABEL.cash },
    { value: PAYMENT_METHOD.BANK_TRANSFER, label: PAYMENT_METHOD_LABEL.bank_transfer },
    { value: PAYMENT_METHOD.CARD, label: PAYMENT_METHOD_LABEL.card },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            <DialogDescription>
              Thanh toán công nợ cho phiếu nhập. Còn phải trả:{" "}
              <span className="font-semibold text-foreground">
                {maxAmount.toLocaleString("vi-VN")}đ
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 flex flex-col gap-3.5">
            <Field>
              <FieldLabel required>Số tiền (đ)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel required>Phương thức</FieldLabel>
              <div className="flex gap-2">
                {methods.map((m) => (
                  <Button
                    key={m.value}
                    type="button"
                    variant={method === m.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setMethod(m.value)}
                    className="flex-1"
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </Field>

            {method === PAYMENT_METHOD.BANK_TRANSFER && (
              <Field>
                <FieldLabel>Mã tham chiếu</FieldLabel>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="Số giao dịch / mã CK"
                />
              </Field>
            )}

            <Field>
              <FieldLabel>Ngày thanh toán</FieldLabel>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú nội bộ"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
