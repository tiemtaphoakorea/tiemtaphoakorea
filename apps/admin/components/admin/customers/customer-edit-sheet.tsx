"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CustomerFormValues,
  customerSchema,
  objectToFormData,
} from "@workspace/shared/schemas";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Controller, useForm } from "react-hook-form";

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
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    values: customer
      ? {
          fullName: customer.fullName ?? "",
          phone: customer.phone ?? "",
          address: customer.address ?? "",
          customerType: (customer.customerType as "retail" | "wholesale") ?? "retail",
        }
      : { fullName: "", phone: "", address: "", customerType: "retail" },
  });

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
        <SheetHeader className="border-b border-slate-100 px-6 pb-6">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa khách hàng</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin chi tiết cho khách hàng {customer?.fullName}.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-6 px-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customer-full-name">Họ và tên</Label>
              <Input
                id="edit-customer-full-name"
                {...register("fullName")}
                placeholder="Nguyễn Văn A"
                className="h-11 bg-slate-50/50 font-medium"
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-destructive text-sm">{errors.fullName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-customer-phone">Số điện thoại</Label>
                <Input
                  id="edit-customer-phone"
                  {...register("phone")}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-customer-type">Loại khách hàng</Label>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="edit-customer-type" className="h-11 bg-slate-50/50">
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
              <Label htmlFor="edit-customer-address">Địa chỉ</Label>
              <Input
                id="edit-customer-address"
                {...register("address")}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                className="h-11 bg-slate-50/50 font-medium"
              />
            </div>
          </div>
          <SheetFooter className="border-t border-slate-100 px-6 pt-6">
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
