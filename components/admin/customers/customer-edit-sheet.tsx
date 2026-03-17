"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type CustomerFormValues, customerSchema, objectToFormData } from "@/lib/schemas";

interface CustomerEditSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  isSubmitting: boolean;
  onSubmit: (formData: FormData) => void;
}

export function CustomerEditSheet({
  isOpen,
  onOpenChange,
  customer,
  isSubmitting,
  onSubmit,
}: CustomerEditSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      customerType: "retail",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        fullName: customer.fullName ?? "",
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        customerType: (customer.customerType as "retail" | "wholesale") ?? "retail",
      });
    }
  }, [customer, reset]);

  const onFormSubmit = (data: CustomerFormValues) => {
    const fd = objectToFormData({
      ...data,
      intent: "edit",
      id: customer?.id,
    });
    onSubmit(fd);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa khách hàng</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin chi tiết cho khách hàng {customer?.fullName}.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6 py-8">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Họ và tên
              </label>
              <Input
                {...register("fullName")}
                placeholder="Nguyễn Văn A"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-destructive text-sm">{errors.fullName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Số điện thoại
                </label>
                <Input
                  {...register("phone")}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Loại khách hàng
                </label>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-900/50">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Khách lẻ</SelectItem>
                        <SelectItem value="wholesale">Khách sỉ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Địa chỉ
              </label>
              <Input
                {...register("address")}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
          </div>
          <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-6 font-bold"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-primary/20 h-11 px-6 font-bold shadow-lg"
              >
                {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
