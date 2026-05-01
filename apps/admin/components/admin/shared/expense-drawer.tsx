"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateExpenseData } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-foreground";

type ExpenseDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function ExpenseDrawer({ open, onClose }: ExpenseDrawerProps) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"fixed" | "variable">("variable");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    setDescription("");
    setAmount("");
    setType("variable");
    setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) => adminClient.createExpense(data),
    onSuccess: () => {
      toast.success("Đã ghi nhận chi phí");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.expenses.all });
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleSave = () => {
    if (!description.trim()) {
      toast.error("Mô tả bắt buộc");
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Số tiền phải > 0");
      return;
    }
    createMutation.mutate({
      description: description.trim(),
      amount: amountNum,
      type,
      date: new Date(date),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">Ghi chi phí mới</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Mô tả khoản chi</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Thuê kho bãi tháng 5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Số tiền (đ)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Loại</Label>
              <Select value={type} onValueChange={(v) => setType(v as "fixed" | "variable")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Cố định</SelectItem>
                  <SelectItem value="variable">Biến đổi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Ngày phát sinh</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Ghi chi phí"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
