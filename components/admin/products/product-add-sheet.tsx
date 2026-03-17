import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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

interface ProductAddSheetProps {
  categories: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductAddSheet({ categories, isOpen, onOpenChange }: ProductAddSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Thêm sản phẩm mới</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Điền đầy đủ thông tin bên dưới để đăng tải sản phẩm mới lên cửa hàng.
          </SheetDescription>
        </SheetHeader>
        <form method="post" encType="multipart/form-data">
          <input type="hidden" name="intent" value="add" />
          <div className="flex flex-col gap-6 py-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Tên sản phẩm
                </label>
                <Input
                  name="name"
                  placeholder="Ví dụ: Serum dưỡng da..."
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Thương hiệu
                  </label>
                  <Input
                    name="brand"
                    placeholder="Anua, COSRX..."
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Danh mục
                  </label>
                  <Select name="categoryId" required>
                    <SelectTrigger className="h-11 w-full bg-slate-50/50 font-medium dark:bg-slate-900/50">
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
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Giá bán (VNĐ)
                  </label>
                  <NumberInput
                    name="price"
                    placeholder="0"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Giá vốn (VNĐ)
                  </label>
                  <NumberInput
                    name="costPrice"
                    placeholder="0"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Số lượng tồn kho
                </label>
                <NumberInput
                  name="stock"
                  placeholder="0"
                  decimalScale={0}
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Mô tả sản phẩm
                </label>
                <textarea
                  name="description"
                  className="focus-visible:ring-primary flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50"
                  placeholder="Mô tả chi tiết về công dụng, thành phần..."
                />
              </div>
              <div className="grid gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-4 dark:border-slate-800">
                <div className="grid gap-2">
                  <label className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    <ImageIcon className="h-4 w-4" />
                    Tải ảnh lên
                  </label>
                  <Input
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    className="h-11 border-none bg-white font-medium shadow-sm dark:bg-slate-950"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 font-bold text-slate-500">Hoặc dùng URL</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Input
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    className="h-11 border-none bg-white font-medium shadow-sm dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-slate-200 px-6 font-bold dark:border-slate-800"
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
