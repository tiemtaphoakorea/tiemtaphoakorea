import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Supplier } from "@/types/admin";

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
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
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
          <input type="hidden" name="intent" value="edit" />
          <input type="hidden" name="id" value={supplier.id} />
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                defaultValue={supplier.name}
                placeholder="Công ty TNHH ABC"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Số điện thoại
                </label>
                <Input
                  name="phone"
                  defaultValue={supplier.phone || ""}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={supplier.email || ""}
                  placeholder="contact@supplier.com"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Địa chỉ
              </label>
              <Input
                name="address"
                defaultValue={supplier.address || ""}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Điều khoản thanh toán
              </label>
              <Input
                name="paymentTerms"
                defaultValue={supplier.paymentTerms || ""}
                placeholder="VD: Thanh toán sau 30 ngày, COD, ..."
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                Ghi chú
              </label>
              <Textarea
                name="note"
                defaultValue={supplier.note || ""}
                placeholder="Thông tin thêm về nhà cung cấp..."
                className="min-h-[80px] bg-slate-50/50 font-medium dark:bg-slate-900/50"
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
                {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
