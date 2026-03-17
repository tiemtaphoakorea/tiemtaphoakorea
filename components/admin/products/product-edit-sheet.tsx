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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface ProductEditSheetProps {
  categories: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: any;
}

export function ProductEditSheet({
  categories,
  isOpen,
  onOpenChange,
  editingProduct,
}: ProductEditSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa sản phẩm</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin chi tiết cho sản phẩm {editingProduct?.name}.
          </SheetDescription>
        </SheetHeader>
        {editingProduct && (
          <form method="post" encType="multipart/form-data">
            <input type="hidden" name="intent" value="edit" />
            <input type="hidden" name="id" value={editingProduct.id} />
            <div className="flex flex-col gap-6 py-8">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Tên sản phẩm
                  </label>
                  <Input
                    name="name"
                    defaultValue={editingProduct.name}
                    placeholder="Ví dụ: Serum dưỡng da..."
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Danh mục
                  </label>
                  <Select name="categoryId" defaultValue={editingProduct.categoryId} required>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Giá bán (VNĐ)
                    </label>
                    <NumberInput
                      name="price"
                      defaultValue={editingProduct.variants[0]?.price}
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
                      defaultValue={editingProduct.variants[0]?.costPrice}
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
                    defaultValue={editingProduct.variants[0]?.stockQuantity}
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
                    defaultValue={editingProduct.description || ""}
                    className="focus-visible:ring-primary flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50"
                    placeholder="Mô tả chi tiết về công dụng, thành phần..."
                  />
                </div>

                {editingProduct.variants[0]?.costHistory?.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Lịch sử giá vốn
                    </label>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                          <TableRow>
                            <TableHead className="h-10 text-xs font-black text-slate-500 uppercase">
                              Ngày
                            </TableHead>
                            <TableHead className="h-10 text-xs font-black text-slate-500 uppercase">
                              Giá vốn
                            </TableHead>
                            <TableHead className="h-10 text-xs font-black text-slate-500 uppercase">
                              Ghi chú
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingProduct.variants[0].costHistory.map((history: any) => (
                            <TableRow key={history.id} className="hover:bg-transparent">
                              <TableCell className="py-3 text-xs font-medium">
                                {new Date(history.effectiveDate).toLocaleDateString("vi-VN")}
                              </TableCell>
                              <TableCell className="py-3 text-xs font-black text-slate-900 dark:text-white">
                                {formatCurrency(Number(history.costPrice))}
                              </TableCell>
                              <TableCell className="py-3 text-xs font-medium text-slate-500">
                                {history.note || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-4 dark:border-slate-800">
                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      <ImageIcon className="h-4 w-4" />
                      Tải ảnh mới (Tùy chọn)
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
                      <span className="bg-slate-50 px-2 font-bold text-slate-500">
                        Hoặc dùng URL mới
                      </span>
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
                  onClick={() => onOpenChange(false)}
                  className="h-11 border-slate-200 px-6 font-bold dark:border-slate-800"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="shadow-primary/20 h-11 px-6 font-bold shadow-lg"
                  onClick={() => setTimeout(() => onOpenChange(false), 500)}
                >
                  Cập nhật sản phẩm
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
