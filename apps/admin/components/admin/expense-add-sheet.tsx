"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ExpenseFormValues, expenseSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Controller, useForm } from "react-hook-form";

interface ExpenseAddSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    description: string;
    amount: number;
    type: "fixed" | "variable";
    date: Date;
  }) => void;
  isSubmitting?: boolean;
}

export function ExpenseAddSheet({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ExpenseAddSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "fixed",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onFormSubmit = (data: ExpenseFormValues) => {
    onSubmit({
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: new Date(data.date),
    });
    reset();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-white p-6 sm:max-w-[440px] sm:p-10">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex h-full flex-col">
          <SheetHeader className="mb-8 p-0">
            <SheetTitle className="text-2xl font-black">Thêm chi phí</SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              Ghi nhận các khoản chi phí vận hành cố định hoặc biến đổi.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1">
            <FieldGroup>
              <Field>
                <FieldLabel>Mô tả chi phí</FieldLabel>
                <Input
                  {...register("description")}
                  placeholder="Ví dụ: Tiền thuê mặt bằng tháng 1"
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-destructive text-sm">{errors.description.message}</p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Số tiền (VNĐ)</FieldLabel>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        allowNegative
                        required
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                        placeholder="0"
                        aria-invalid={!!errors.amount}
                      />
                    )}
                  />
                  {errors.amount && (
                    <p className="text-destructive text-sm">{errors.amount.message}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Loại chi phí</FieldLabel>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} className="w-full">
                        <SelectOption value="fixed">Cố định</SelectOption>
                        <SelectOption value="variable">Biến đổi</SelectOption>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Ngày ghi nhận</FieldLabel>
                <Input {...register("date")} type="date" aria-invalid={!!errors.date} />
                {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="mt-8 flex-row justify-end gap-3 border-t border-slate-100 p-0 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shadow-primary/20 h-12 px-8 font-black shadow-lg"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu chi phí"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
