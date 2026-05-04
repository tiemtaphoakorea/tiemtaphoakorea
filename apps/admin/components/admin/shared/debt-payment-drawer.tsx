"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { formatVnd } from "./format-vnd";
import { StatusBadge, type StatusType } from "./status-badge";

type DebtPaymentDrawerProps = {
  /** Customer id to display unpaid orders for. null/undefined = closed. */
  customerId: string | null | undefined;
  onClose: () => void;
};

const fmtDate = (d: Date | string | null): string =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

/** Drawer for recording debt payments — list unpaid orders, pick one, enter amount. */
export function DebtPaymentDrawer({ customerId, onClose }: DebtPaymentDrawerProps) {
  const open = !!customerId;
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [refCode, setRefCode] = useState("");
  const [note, setNote] = useState("");

  const debtQuery = useQuery({
    queryKey: customerId ? queryKeys.customerDebt(customerId) : ["customer-debt", "none"],
    queryFn: async () => (customerId ? adminClient.getCustomerDebt(customerId) : null),
    enabled: open,
    staleTime: 15_000,
  });

  // Reset form when drawer opens or customer changes.
  useEffect(() => {
    if (!open) return;
    setSelectedOrderId(null);
    setAmount("");
    setMethod("cash");
    setRefCode("");
    setNote("");
  }, [open]);

  const recordMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: { amount: number; method: string; referenceCode?: string; note?: string };
    }) => adminClient.recordOrderPayment(orderId, data),
    onSuccess: () => {
      toast.success("Đã ghi nhận thanh toán");
      queryClient.invalidateQueries({ queryKey: queryKeys.debts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.debtSummary });
      if (customerId)
        queryClient.invalidateQueries({ queryKey: queryKeys.customerDebt(customerId) });
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleSubmit = () => {
    if (!selectedOrderId) {
      toast.error("Chọn đơn để thanh toán");
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Số tiền phải > 0");
      return;
    }
    recordMutation.mutate({
      orderId: selectedOrderId,
      data: {
        amount: amountNum,
        method,
        referenceCode: refCode.trim() || undefined,
        note: note.trim() || undefined,
      },
    });
  };

  const debt = debtQuery.data;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-120">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-sm font-bold">
            Thu tiền nợ — {debt?.customer.fullName ?? "..."}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
          {debtQuery.isLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          )}
          {debtQuery.error && <div className="text-sm text-red-600">Lỗi tải dữ liệu</div>}
          {debt && (
            <FieldGroup>
              {/* Summary */}
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tổng nợ
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-red-600">
                  {formatVnd(debt.totalDebt)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {debt.unpaidOrders.length} đơn chưa thanh toán đủ
                </div>
              </div>

              {/* Unpaid order picker */}
              <Field>
                <FieldLabel>Chọn đơn cần ghi thanh toán</FieldLabel>
                <div className="flex flex-col gap-1.5">
                  {debt.unpaidOrders.length === 0 && (
                    <p className="text-xs text-muted-foreground">Không còn đơn nào.</p>
                  )}
                  {debt.unpaidOrders.map((o) => {
                    const remaining = Number(o.total ?? 0) - Number(o.paidAmount ?? 0);
                    const isSelected = selectedOrderId === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(o.id);
                          setAmount(String(remaining));
                        }}
                        className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-semibold">{o.orderNumber}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{fmtDate(o.createdAt)}</span>
                            <StatusBadge type={o.paymentStatus as StatusType} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold tabular-nums text-red-600">
                            Còn {formatVnd(remaining)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            /{formatVnd(Number(o.total ?? 0))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {selectedOrderId && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field>
                      <FieldLabel>Số tiền (đ)</FieldLabel>
                      <NumberInput
                        decimalScale={0}
                        value={amount}
                        onValueChange={({ value }) => setAmount(value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Phương thức</FieldLabel>
                      <Select value={method} onValueChange={setMethod} className="w-full">
                        <SelectOption value="cash">Tiền mặt</SelectOption>
                        <SelectOption value="bank_transfer">Chuyển khoản</SelectOption>
                        <SelectOption value="card">Thẻ</SelectOption>
                        <SelectOption value="other">Khác</SelectOption>
                      </Select>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Mã tham chiếu (nếu có)</FieldLabel>
                    <Input
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      placeholder="VD: TXN12345"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Ghi chú</FieldLabel>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  </Field>
                </>
              )}
            </FieldGroup>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedOrderId || recordMutation.isPending}>
            {recordMutation.isPending ? "Đang ghi..." : "Ghi nhận TT"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
