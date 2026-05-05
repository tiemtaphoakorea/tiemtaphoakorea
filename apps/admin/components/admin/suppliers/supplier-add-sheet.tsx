import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { Plus } from "lucide-react";

interface SupplierAddSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
}

export function SupplierAddSheet({ isOpen, onOpenChange, isSubmitting }: SupplierAddSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="shadow-primary/20 h-11 gap-2 self-start px-6 font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] md:self-auto">
          <Plus className="h-5 w-5" />
          Thêm nhà cung cấp
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6">
          <SheetTitle className="text-2xl font-black">Thêm nhà cung cấp mới</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Nhập thông tin nhà cung cấp. Hệ thống sẽ tự động tạo mã NCC.
          </SheetDescription>
        </SheetHeader>
        <form method="post" className="py-8">
          <Input type="hidden" name="intent" value="add" />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="add-supplier-name">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </FieldLabel>
              <Input id="add-supplier-name" name="name" placeholder="Công ty TNHH ABC" required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="add-supplier-phone">Số điện thoại</FieldLabel>
                <Input id="add-supplier-phone" name="phone" placeholder="09xx xxx xxx" />
              </Field>
              <Field>
                <FieldLabel htmlFor="add-supplier-email">Email</FieldLabel>
                <Input
                  id="add-supplier-email"
                  name="email"
                  type="email"
                  placeholder="contact@supplier.com"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="add-supplier-address">Địa chỉ</FieldLabel>
              <Input
                id="add-supplier-address"
                name="address"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="add-supplier-payment-terms">Điều khoản thanh toán</FieldLabel>
              <Input
                id="add-supplier-payment-terms"
                name="paymentTerms"
                placeholder="VD: Thanh toán sau 30 ngày, COD, ..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="add-supplier-note">Ghi chú</FieldLabel>
              <Textarea
                id="add-supplier-note"
                name="note"
                placeholder="Thông tin thêm về nhà cung cấp..."
                className="min-h-20"
              />
            </Field>
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
                {isSubmitting ? "Đang xử lý..." : "Thêm nhà cung cấp"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
