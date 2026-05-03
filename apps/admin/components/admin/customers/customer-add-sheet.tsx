"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CustomerFormValues,
  customerSchema,
  objectToFormData,
} from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import { FieldGroup } from "@workspace/ui/components/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
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
import { useForm } from "react-hook-form";

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
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      customerType: "retail",
    },
  });

  useEffect(() => {
    if (!isOpen) form.reset();
  }, [isOpen, form]);

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
        <SheetHeader className="border-b border-slate-100 pb-6">
          <SheetTitle className="text-2xl font-black">Thêm khách hàng mới</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Nhập thông tin cơ bản để tạo tài khoản khách hàng. Hệ thống sẽ tự động tạo mã định danh
            và mật khẩu.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="py-8">
            <FieldGroup>
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Họ và tên <span className="text-destructive ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="09xx xxx xxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại khách hàng</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                          placeholder="Chọn loại"
                        >
                          <SelectOption value="retail">Khách lẻ</SelectOption>
                          <SelectOption value="wholesale">Khách sỉ</SelectOption>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FieldGroup>
            <SheetFooter className="border-t border-slate-100 pt-6">
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
        </Form>
      </SheetContent>
    </Sheet>
  );
}
