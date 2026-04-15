"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ApiError, axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
import { Switch } from "@workspace/ui/components/switch";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";

const ACCENT_COLORS = [
  { value: "from-violet-500/70", label: "Tím" },
  { value: "from-orange-500/70", label: "Cam" },
  { value: "from-sky-500/70", label: "Xanh nhạt" },
  { value: "from-rose-500/70", label: "Hồng" },
  { value: "from-green-500/70", label: "Xanh lá" },
  { value: "from-blue-500/70", label: "Xanh dương" },
  { value: "from-pink-500/70", label: "Hồng nhạt" },
];

type Category = { id: string; name: string; slug: string };

type CardData = {
  id?: string;
  type: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  countText?: string | null;
  linkUrl?: string | null;
  accentColor?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CardData | null;
  categories: Category[];
};

const defaultForm = (): CardData => ({
  type: "category",
  categoryId: null,
  imageUrl: null,
  title: null,
  countText: null,
  linkUrl: null,
  accentColor: "from-violet-500/70",
  isActive: true,
  sortOrder: 0,
});

export function CategoryCardForm({ isOpen, onOpenChange, card, categories }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CardData>(defaultForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!card?.id;

  useEffect(() => {
    if (isOpen) {
      setForm(card ? { ...defaultForm(), ...card } : defaultForm());
      setError(null);
    }
  }, [isOpen, card]);

  const set = (field: keyof CardData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.type === "custom" && !form.imageUrl) {
      setError("Vui lòng upload ảnh.");
      return;
    }
    if (form.type === "category" && !form.categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };

      if (isEdit) {
        await axios.patch(API_ENDPOINTS.ADMIN.CATEGORY_CARD_DETAIL(card!.id!), payload);
      } else {
        await axios.post(API_ENDPOINTS.ADMIN.CATEGORY_CARDS, payload);
      }

      await qc.invalidateQueries({ queryKey: queryKeys.categoryCards.all });
      onOpenChange(false);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(
        (apiErr?.data?.error as string | undefined) ??
          (err instanceof Error ? err.message : null) ??
          "Đã có lỗi xảy ra.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-lg">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">
            {isEdit ? "Chỉnh sửa ô danh mục" : "Thêm ô danh mục"}
          </SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Ô danh mục hiển thị bên dưới banner trang chủ (tối đa 4 ô).
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-6">
          {/* Type toggle */}
          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Loại</Label>
            <div className="flex gap-2">
              {(["category", "custom"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                    form.type === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {t === "category" ? "📂 Từ danh mục" : "🖼 Tùy chọn"}
                </button>
              ))}
            </div>
          </div>

          {form.type === "category" && (
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Danh mục <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.categoryId ?? ""}
                onValueChange={(v) => set("categoryId", v || null)}
              >
                <SelectTrigger className="h-11 w-full bg-slate-50/50 font-medium dark:bg-slate-900/50">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.type === "custom" && (
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Ảnh <span className="text-red-500">*</span>
              </Label>
              <ImageUploader
                value={form.imageUrl ? [form.imageUrl] : []}
                onChange={(urls) => set("imageUrl", urls[0] ?? null)}
                maxFiles={1}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">
              Tiêu đề{" "}
              {form.type === "category" && (
                <span className="font-normal normal-case text-slate-400">(mặc định: tên danh mục)</span>
              )}
            </Label>
            <Input
              value={form.title ?? ""}
              onChange={(e) => set("title", e.target.value || null)}
              placeholder={form.type === "category" ? "Tự động từ tên danh mục" : "Nhập tiêu đề..."}
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Số lượng / mô tả ngắn</Label>
            <Input
              value={form.countText ?? ""}
              onChange={(e) => set("countText", e.target.value || null)}
              placeholder="Ví dụ: 250+ sản phẩm"
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">
              Link{" "}
              {form.type === "category" && (
                <span className="font-normal normal-case text-slate-400">(tự động)</span>
              )}
            </Label>
            <Input
              value={form.linkUrl ?? ""}
              onChange={(e) => set("linkUrl", e.target.value || null)}
              placeholder={form.type === "category" ? "/products?category=..." : "/products"}
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Màu accent</Label>
            <Select
              value={form.accentColor ?? "from-violet-500/70"}
              onValueChange={(v) => set("accentColor", v)}
            >
              <SelectTrigger className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCENT_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Thứ tự</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v)}
                id="card-active"
              />
              <Label htmlFor="card-active" className="text-sm font-bold cursor-pointer">
                Hiển thị
              </Label>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-black shadow-lg shadow-primary/20">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo ô danh mục"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
