import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
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
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

interface CategoryEditSheetProps {
  categories: any[];
  editingCategory: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryEditSheet({
  categories,
  editingCategory,
  isOpen,
  onOpenChange,
}: CategoryEditSheetProps) {
  if (!editingCategory) return null;

  // Filter out self to avoid circular parent dependency
  const parentOptions = categories.filter((c) => c.id !== editingCategory.id);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa danh mục</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin danh mục "{editingCategory.name}".
          </SheetDescription>
        </SheetHeader>
        <form method="post">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={editingCategory.id} />

          <div className="flex flex-col gap-6 py-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label
                  htmlFor="edit-category-name"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Tên danh mục
                </label>
                <Input
                  id="edit-category-name"
                  name="name"
                  defaultValue={editingCategory.name}
                  placeholder="Ví dụ: Dưỡng da mùa đông..."
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-category-parent"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Danh mục cha (Tùy chọn)
                </label>
                <Select name="parentId" defaultValue={editingCategory.parentId || "none"}>
                  <SelectTrigger
                    id="edit-category-parent"
                    className="h-11 w-full bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  >
                    <SelectValue placeholder="Chọn danh mục cha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    {parentOptions.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-category-description"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Mô tả
                </label>
                <textarea
                  id="edit-category-description"
                  name="description"
                  defaultValue={editingCategory.description || ""}
                  className="focus-visible:ring-primary flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/50"
                  placeholder="Mô tả về danh mục này..."
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 font-bold dark:border-slate-800"
            >
              Hủy bỏ
            </Button>
            <Button type="submit" className="shadow-primary/20 font-black shadow-lg">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
