"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryWithChildren } from "@workspace/database/types/admin";
import { type CategoryFormValues, categorySchema } from "@workspace/shared/schemas";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useReducer } from "react";
import { Controller, useForm } from "react-hook-form";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { toast } from "sonner";

// ── UI state ──────────────────────────────────────────────────────────────────

type UIState = {
  expandedMap: Record<string, boolean>;
  isSheetOpen: boolean;
  editingCategory: CategoryWithChildren | null;
  formMode: "add" | "edit";
  isSubmitting: boolean;
};

type UIAction =
  | { type: "TOGGLE_EXPAND"; id: string; currentValue: boolean }
  | { type: "OPEN_ADD" }
  | { type: "OPEN_EDIT"; category: CategoryWithChildren }
  | { type: "CLOSE_SHEET" }
  | { type: "SET_SUBMITTING"; value: boolean };

const initialUIState: UIState = {
  expandedMap: {},
  isSheetOpen: false,
  editingCategory: null,
  formMode: "add",
  isSubmitting: false,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "TOGGLE_EXPAND":
      return {
        ...state,
        expandedMap: { ...state.expandedMap, [action.id]: !action.currentValue },
      };
    case "OPEN_ADD":
      return { ...state, formMode: "add", editingCategory: null, isSheetOpen: true };
    case "OPEN_EDIT":
      return {
        ...state,
        formMode: "edit",
        editingCategory: action.category,
        isSheetOpen: true,
      };
    case "CLOSE_SHEET":
      return { ...state, isSheetOpen: false };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.value };
    default:
      return state;
  }
}

// ── Recursive row component ───────────────────────────────────────────────────

const CategoryRow = ({
  category,
  level = 0,
  expandedMap,
  toggleExpand,
  onEdit,
  onDelete,
}: {
  category: CategoryWithChildren;
  level: number;
  expandedMap: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onEdit: (cat: CategoryWithChildren) => void;
  onDelete: (cat: CategoryWithChildren) => void;
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedMap[category.id];

  return (
    <>
      <TableRow className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
        <TableCell className="w-[400px]">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(category.id)}
                className="rounded p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-6" /> // Spacer
            )}

            <FolderOpen
              className={cn(
                "h-4 w-4",
                level === 0 ? "fill-primary/20 text-primary" : "text-slate-400",
              )}
            />

            <div className="flex flex-col">
              <span
                className={cn(
                  "font-bold text-slate-700 dark:text-slate-200",
                  level === 0 && "text-base",
                )}
              >
                {category.name}
              </span>
              {category.description && (
                <span className="max-w-[200px] truncate text-xs font-medium text-slate-400">
                  {category.description}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800">
            /{category.slug}
          </code>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">#{category.displayOrder}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={category.isActive ? "outline" : "secondary"} className="text-[10px]">
            {category.isActive ? "Hiển thị" : "Đã ẩn"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-lg p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 font-bold">
              <DropdownMenuItem onClick={() => onEdit(category)} className="gap-2">
                <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="gap-2 text-red-500 focus:bg-red-50 focus:text-red-500"
              >
                <Trash2 className="h-4 w-4 shrink-0 text-red-500" /> Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {isExpanded &&
        category.children?.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
};

// ── Sheet form sub-component ──────────────────────────────────────────────────

const CategorySheetForm = ({
  isOpen,
  onOpenChange,
  formMode,
  editingCategory,
  isSubmitting,
  form,
  flatCategories,
  onSubmit,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formMode: "add" | "edit";
  editingCategory: CategoryWithChildren | null;
  isSubmitting: boolean;
  form: ReturnType<typeof useForm<CategoryFormValues>>;
  flatCategories: Array<{ id: string; name: string; depth?: number | null }>;
  onSubmit: (data: CategoryFormValues) => Promise<void>;
}) => (
  <Sheet open={isOpen} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
      <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <SheetTitle className="text-2xl font-black">
          {formMode === "add" ? "Thêm danh mục" : "Chỉnh sửa danh mục"}
        </SheetTitle>
        <SheetDescription className="font-medium text-slate-500">
          {formMode === "add"
            ? "Tạo danh mục sản phẩm mới."
            : `Cập nhật thông tin cho "${editingCategory?.name}".`}
        </SheetDescription>
      </SheetHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 py-8">
        <div className="space-y-4">
          <div className="grid gap-2">
            <label
              htmlFor="category-name"
              className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
            >
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <Input
              id="category-name"
              {...form.register("name")}
              placeholder="Ví dụ: Áo Thun, Quần Jean..."
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="category-parent"
              className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
            >
              Danh mục cha
            </label>
            <Controller
              name="parentId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value ?? "root_none_value"} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="category-parent"
                    className="h-11 bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <SelectValue placeholder="--- Không (Danh mục gốc) ---" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root_none_value">--- Không (Danh mục gốc) ---</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        disabled={editingCategory?.id === cat.id}
                      >
                        {Array(cat.depth || 0)
                          .fill("— ")
                          .join("") + cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="category-description"
              className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
            >
              Mô tả
            </label>
            <Input
              id="category-description"
              {...form.register("description")}
              placeholder="Mô tả ngắn về danh mục..."
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="category-display-order"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Thứ tự hiển thị
              </label>
              <Controller
                name="displayOrder"
                control={form.control}
                render={({ field }) => (
                  <NumberInput
                    id="category-display-order"
                    decimalScale={0}
                    value={field.value}
                    onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    aria-invalid={!!form.formState.errors.displayOrder}
                  />
                )}
              />
              {form.formState.errors.displayOrder && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.displayOrder.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="category-status"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Trạng thái
              </label>
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(v) => field.onChange(v === "true")}
                  >
                    <SelectTrigger
                      id="category-status"
                      className="h-11 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Hiển thị</SelectItem>
                      <SelectItem value="false">Ẩn</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl font-black shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Đang lưu..." : formMode === "add" ? "Tạo danh mục" : "Lưu thay đổi"}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
);

// ── Page shell ────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  return (
    <Suspense fallback={<div />}>
      <AdminCategoriesContent />
    </Suspense>
  );
}

// ── Main content component ────────────────────────────────────────────────────

function AdminCategoriesContent() {
  "use no memo";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchTerm = searchParams.get("search") || "";

  const [ui, dispatch] = useReducer(uiReducer, initialUIState);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      parentId: null,
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.categories.list(searchTerm),
    queryFn: () => adminClient.getCategories({ search: searchTerm }),
  });
  const categories = data?.categories || [];
  const flatCategories = data?.flatCategories || [];

  // Auto-expand all if searching or initially
  const autoExpandedMap = useMemo(() => {
    const allIds: Record<string, boolean> = {};
    const traverse = (cats: CategoryWithChildren[]) => {
      cats.forEach((c) => {
        allIds[c.id] = true;
        if (c.children) traverse(c.children);
      });
    };
    if (categories.length > 0) {
      traverse(categories);
    }
    return allIds;
  }, [categories]);
  const displayExpandedMap =
    Object.keys(ui.expandedMap).length > 0
      ? { ...autoExpandedMap, ...ui.expandedMap }
      : autoExpandedMap;

  const toggleExpand = (id: string) => {
    const currentValue = id in ui.expandedMap ? ui.expandedMap[id] : autoExpandedMap[id];
    dispatch({ type: "TOGGLE_EXPAND", id, currentValue });
  };

  const handleSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("search", val);
    else params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  const openAdd = () => {
    dispatch({ type: "OPEN_ADD" });
    form.reset({
      name: "",
      parentId: "root_none_value",
      description: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const openEdit = (cat: CategoryWithChildren) => {
    dispatch({ type: "OPEN_EDIT", category: cat });
    form.reset({
      name: cat.name,
      parentId: cat.parentId || "root_none_value",
      description: cat.description ?? "",
      displayOrder: cat.displayOrder ?? 0,
      isActive: cat.isActive !== false,
    });
  };

  const handleDelete = async (cat: CategoryWithChildren) => {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"? Danh mục này sẽ bị xóa vĩnh viễn.`)) {
      try {
        await adminClient.deleteCategory(cat.id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, exact: false });
        toast.success("Đã xóa danh mục");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete");
      }
    }
  };

  const handleSubmit = async (data: CategoryFormValues) => {
    dispatch({ type: "SET_SUBMITTING", value: true });
    const parentId = data.parentId === "root_none_value" || !data.parentId ? null : data.parentId;
    const payload = {
      name: data.name,
      parentId,
      description: data.description ?? "",
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    };
    try {
      if (ui.formMode === "add") {
        await adminClient.createCategory(payload);
      } else {
        if (!ui.editingCategory) return;
        await adminClient.updateCategory(ui.editingCategory.id, payload);
      }
      dispatch({ type: "CLOSE_SHEET" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all, exact: false });
      toast.success("Đã lưu danh mục");
      dispatch({ type: "SET_SUBMITTING", value: false });
    } catch (error: any) {
      toast.error(error.message || "Action failed");
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Danh mục
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Quản lý cây danh mục sản phẩm của hệ thống.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="h-11 gap-2 rounded-xl px-6 font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Thêm danh mục
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border-none py-0 shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10 border-none bg-slate-50/50 pl-10 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    level={0}
                    expandedMap={displayExpandedMap}
                    toggleExpand={toggleExpand}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center font-medium text-slate-500">
                    Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <CategorySheetForm
        isOpen={ui.isSheetOpen}
        onOpenChange={(open) => !open && dispatch({ type: "CLOSE_SHEET" })}
        formMode={ui.formMode}
        editingCategory={ui.editingCategory}
        isSubmitting={ui.isSubmitting}
        form={form}
        flatCategories={flatCategories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
