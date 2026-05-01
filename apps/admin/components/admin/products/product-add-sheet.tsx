import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
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
import { Image as ImageIcon } from "lucide-react";

interface ProductAddSheetProps {
  categories: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductAddSheet({ categories, isOpen, onOpenChange }: ProductAddSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6">
          <SheetTitle className="text-2xl font-black">Thêm sản phẩm mới</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Điền đầy đủ thông tin bên dưới để đăng tải sản phẩm mới lên cửa hàng.
          </SheetDescription>
        </SheetHeader>
        <form method="post" encType="multipart/form-data">
          <Input type="hidden" name="intent" value="add" />
          <div className="flex flex-col gap-6 py-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="add-product-name">Tên sản phẩm</Label>
                <Input
                  id="add-product-name"
                  name="name"
                  placeholder="Ví dụ: Serum dưỡng da..."
                  className="h-11 bg-slate-50/50 font-medium"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-product-brand">Thương hiệu</Label>
                  <Input
                    id="add-product-brand"
                    name="brand"
                    placeholder="Anua, COSRX..."
                    className="h-11 bg-slate-50/50 font-medium"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-product-category">Danh mục</Label>
                  <Select name="categoryId" required>
                    <SelectTrigger
                      id="add-product-category"
                      className="h-11 w-full bg-slate-50/50 font-medium"
                    >
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-product-price">Giá bán (VNĐ)</Label>
                  <NumberInput
                    id="add-product-price"
                    name="price"
                    placeholder="0"
                    className="h-11 bg-slate-50/50 font-medium"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-product-cost-price">Giá vốn (VNĐ)</Label>
                  <NumberInput
                    id="add-product-cost-price"
                    name="costPrice"
                    placeholder="0"
                    className="h-11 bg-slate-50/50 font-medium"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-product-stock">Số lượng tồn kho</Label>
                <NumberInput
                  id="add-product-stock"
                  name="stock"
                  placeholder="0"
                  decimalScale={0}
                  className="h-11 bg-slate-50/50 font-medium"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-product-description">Mô tả sản phẩm</Label>
                <textarea
                  id="add-product-description"
                  name="description"
                  className="focus-visible:ring-primary flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Mô tả chi tiết về công dụng, thành phần..."
                />
              </div>
              <div className="grid gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="add-product-image-file">
                    <ImageIcon className="h-4 w-4" />
                    Tải ảnh lên
                  </Label>
                  <Input
                    id="add-product-image-file"
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    className="h-11 border-none bg-white font-medium shadow-sm"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 font-bold text-slate-500">Hoặc dùng URL</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Input
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    className="h-11 border-none bg-white font-medium shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t border-slate-100 pt-6">
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-slate-200 px-6 font-bold"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" className="shadow-primary/20 h-11 px-6 font-bold shadow-lg">
                Lưu sản phẩm
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
