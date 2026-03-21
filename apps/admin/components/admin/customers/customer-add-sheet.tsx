"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CustomerFormValues,
  customerSchema,
  objectToFormData,
} from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface CustomerAddSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (formData: FormData) => void;
}

export function CustomerAddSheet({
  isOpen,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: CustomerAddSheetProps) {
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
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const onFormSubmit = (data: CustomerFormValues) => {
    const fd = objectToFormData({ ...data, intent: "add" });
    onSubmit(fd);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="shadow-primary/20 h-11 gap-2 self-start rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] md:self-auto">
          <UserPlus className="h-5 w-5" />
          Thêm khách hàng
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Thêm khách hàng mới</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Nhập thông tin cơ bản để tạo tài khoản khách hàng. Hệ thống sẽ tự động tạo mã định danh
            và mật khẩu.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6 py-8">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label
                htmlFor="add-customer-full-name"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Họ và tên
              </label>
              <Input
                id="add-customer-full-name"
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
                <label
                  htmlFor="add-customer-phone"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Số điện thoại
                </label>
                <Input
                  id="add-customer-phone"
                  {...register("phone")}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="add-customer-type"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Loại khách hàng
                </label>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="add-customer-type"
                        className="h-11 bg-slate-50/50 dark:bg-slate-900/50"
                      >
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
              <label
                htmlFor="add-customer-address"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Địa chỉ
              </label>
              <Input
                id="add-customer-address"
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
                {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
