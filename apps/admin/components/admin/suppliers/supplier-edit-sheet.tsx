import type { Supplier } from "@workspace/database/types/admin";
import { Badge } from "@workspace/ui/components/badge";
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
        <form method="post" className="py-8">
          <Input type="hidden" name="intent" value="edit" />
          <Input type="hidden" name="id" value={supplier.id} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-supplier-name">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="edit-supplier-name"
                name="name"
                defaultValue={supplier.name}
                placeholder="Công ty TNHH ABC"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="edit-supplier-phone">Số điện thoại</FieldLabel>
                <Input
                  id="edit-supplier-phone"
                  name="phone"
                  defaultValue={supplier.phone || ""}
                  placeholder="09xx xxx xxx"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-supplier-email">Email</FieldLabel>
                <Input
                  id="edit-supplier-email"
                  name="email"
                  type="email"
                  defaultValue={supplier.email || ""}
                  placeholder="contact@supplier.com"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="edit-supplier-address">Địa chỉ</FieldLabel>
              <Input
                id="edit-supplier-address"
                name="address"
                defaultValue={supplier.address || ""}
                placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-supplier-payment-terms">Điều khoản thanh toán</FieldLabel>
              <Input
                id="edit-supplier-payment-terms"
                name="paymentTerms"
                defaultValue={supplier.paymentTerms || ""}
                placeholder="VD: Thanh toán sau 30 ngày, COD, ..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-supplier-note">Ghi chú</FieldLabel>
              <Textarea
                id="edit-supplier-note"
                name="note"
                defaultValue={supplier.note || ""}
                placeholder="Thông tin thêm về nhà cung cấp..."
                className="min-h-[80px]"
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
                {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
