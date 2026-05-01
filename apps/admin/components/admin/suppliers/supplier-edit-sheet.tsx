import type { Supplier } from "@workspace/database/types/admin";
import { Badge } from "@workspace/ui/components/badge";
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
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";

interface SupplierEditSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  isSubmitting: boolean;
}

export function SupplierEditSheet({
  isOpen,
  onOpenChange,
  supplier,
  isSubmitting,
}: SupplierEditSheetProps) {
  if (!supplier) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl font-black">Chỉnh sửa nhà cung cấp</SheetTitle>
            <Badge variant="outline" className="font-black">
              {supplier.code}
            </Badge>
          </div>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin nhà cung cấp.
          </SheetDescription>
        </SheetHeader>
        <form method="post" className="flex flex-col gap-6 py-8">
          <Input type="hidden" name="intent" value="edit" />
          <Input type="hidden" name="id" value={supplier.id} />
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier-name">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-supplier-name"
                name="name"
                defaultValue={supplier.name}
                placeholder="Công ty TNHH ABC"
                className="h-11 bg-slate-50/50 font-medium"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-supplier-phone">Số điện thoại</Label>
                <Input
                  id="edit-supplier-phone"
                  name="phone"
                  defaultValue={supplier.phone || ""}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-supplier-email">Email</Label>
                <Input
                  id="edit-supplier-email"
                  name="email"
                  type="email"
                  defaultValue={supplier.email || ""}
                  placeholder="contact@supplier.com"
                  className="h-11 bg-slate-50/50 font-medium"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier-address">Địa chỉ</Label>
              <Input
                id="edit-supplier-address"
                name="address"
                defaultValue={supplier.address || ""}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                className="h-11 bg-slate-50/50 font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier-payment-terms">Điều khoản thanh toán</Label>
              <Input
                id="edit-supplier-payment-terms"
                name="paymentTerms"
                defaultValue={supplier.paymentTerms || ""}
                placeholder="VD: Thanh toán sau 30 ngày, COD, ..."
                className="h-11 bg-slate-50/50 font-medium"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-supplier-note">Ghi chú</Label>
              <Textarea
                id="edit-supplier-note"
                name="note"
                defaultValue={supplier.note || ""}
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
                {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
