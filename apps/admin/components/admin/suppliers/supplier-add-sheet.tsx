import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
        <form method="post" className="flex flex-col gap-6 py-8">
          <Input type="hidden" name="intent" value="add" />
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="add-supplier-name">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-supplier-name"
                name="name"
                placeholder="Công ty TNHH ABC"
                className="h-11 bg-slate-50/50 font-medium"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-supplier-phone">Số điện thoại</Label>
                <Input
                  id="add-supplier-phone"
                  name="phone"
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-supplier-email">Email</Label>
                <Input
                  id="add-supplier-email"
                  name="email"
                  type="email"
                  placeholder="contact@supplier.com"
                  className="h-11 bg-slate-50/50 font-medium"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-supplier-address">Địa chỉ</Label>
              <Input
                id="add-supplier-address"
                name="address"
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                className="h-11 bg-slate-50/50 font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-supplier-payment-terms">Điều khoản thanh toán</Label>
              <Input
                id="add-supplier-payment-terms"
                name="paymentTerms"
                placeholder="VD: Thanh toán sau 30 ngày, COD, ..."
                className="h-11 bg-slate-50/50 font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-supplier-note">Ghi chú</Label>
              <Textarea
                id="add-supplier-note"
                name="note"
                placeholder="Thông tin thêm về nhà cung cấp..."
                className="min-h-[80px] bg-slate-50/50 font-medium"
              />
            </div>
          </div>
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
