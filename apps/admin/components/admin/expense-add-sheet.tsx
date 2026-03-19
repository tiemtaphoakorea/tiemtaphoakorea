"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ExpenseFormValues, expenseSchema } from "@repo/shared/schemas";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { NumberInput } from "@repo/ui/components/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
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
      <SheetContent className="bg-white p-10 sm:max-w-[440px]">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex h-full flex-col">
          <SheetHeader className="mb-8 p-0">
            <SheetTitle className="text-2xl font-black">Thêm chi phí</SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              Ghi nhận các khoản chi phí vận hành cố định hoặc biến đổi.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black tracking-widest text-slate-500 uppercase">
                Mô tả chi phí
              </Label>
              <Input
                {...register("description")}
                placeholder="Ví dụ: Tiền thuê mặt bằng tháng 1"
                className="h-12 rounded-xl border-slate-200 bg-white font-medium"
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Số tiền (VNĐ)
                </Label>
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
                      className="h-12 rounded-xl border-slate-200 bg-white font-black"
                      aria-invalid={!!errors.amount}
                    />
                  )}
                />
                {errors.amount && (
                  <p className="text-destructive text-sm">{errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Loại chi phí
                </Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fixed" className="font-bold">
                          Cố định
                        </SelectItem>
                        <SelectItem value="variable" className="font-bold">
                          Biến đổi
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black tracking-widest text-slate-500 uppercase">
                Ngày ghi nhận
              </Label>
              <Input
                {...register("date")}
                type="date"
                className="h-12 rounded-xl border-slate-200 bg-white font-medium"
                aria-invalid={!!errors.date}
              />
              {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
            </div>
          </div>

          <SheetFooter className="mt-8 flex-row justify-end gap-3 border-t border-slate-100 p-0 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-xl px-6 font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shadow-primary/20 h-12 rounded-xl px-8 font-black shadow-lg"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu chi phí"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
