"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateExpenseData } from "@workspace/database/types/admin";
import { type ExpenseFormValues, expenseSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ExpenseDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const defaultValues: ExpenseFormValues = {
  description: "",
  amount: 0,
  type: "variable",
  date: new Date().toISOString().slice(0, 10),
};

export function ExpenseDrawer({ open, onClose }: ExpenseDrawerProps) {
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, reset } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset({ ...defaultValues, date: new Date().toISOString().slice(0, 10) });
  }, [open, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) => adminClient.createExpense(data),
    onSuccess: () => {
      toast.success("Đã ghi nhận chi phí");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.expenses.all });
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createMutation.mutate({
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">Ghi chi phí mới</SheetTitle>
        </SheetHeader>

        <form
          id="expense-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto px-[22px] py-[22px]"
        >
          <FieldGroup>
            <Field>
              <FieldLabel required>Mô tả khoản chi</FieldLabel>
              <Input {...register("description")} placeholder="VD: Thuê kho bãi tháng 5" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field>
                <FieldLabel required>Số tiền (đ)</FieldLabel>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <NumberInput
                      decimalScale={0}
                      value={field.value}
                      onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                      placeholder="15000000"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Loại</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as "fixed" | "variable")}
                      className="w-full"
                    >
                      <SelectOption value="fixed">Cố định</SelectOption>
                      <SelectOption value="variable">Biến đổi</SelectOption>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel required>Ngày phát sinh</FieldLabel>
              <Input type="date" {...register("date")} />
            </Field>
          </FieldGroup>
        </form>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="expense-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang lưu..." : "Ghi chi phí"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
