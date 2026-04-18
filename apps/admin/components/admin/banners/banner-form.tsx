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
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";

const ACCENT_COLORS = [
  { value: "violet", label: "Tím (Violet)" },
  { value: "rose", label: "Hồng (Rose)" },
  { value: "blue", label: "Xanh dương (Blue)" },
  { value: "sky", label: "Xanh nhạt (Sky)" },
  { value: "orange", label: "Cam (Orange)" },
  { value: "green", label: "Xanh lá (Green)" },
  { value: "pink", label: "Hồng nhạt (Pink)" },
];

type Category = { id: string; name: string; slug: string };

type BannerData = {
  id?: string;
  type: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  ctaSecondaryLabel?: string | null;
  discountTag?: string | null;
  discountTagSub?: string | null;
  accentColor?: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
};

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: BannerData | null;
  categories: Category[];
};

const defaultForm = (): BannerData => ({
  type: "custom",
  categoryId: null,
  imageUrl: null,
  title: null,
  subtitle: null,
  badgeText: null,
  ctaLabel: null,
  ctaUrl: null,
  ctaSecondaryLabel: null,
  discountTag: null,
  discountTagSub: null,
  accentColor: "violet",
  isActive: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
});

export function BannerForm({ isOpen, onOpenChange, banner, categories }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BannerData>(defaultForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!banner?.id;

  useEffect(() => {
    if (isOpen) {
      setForm(banner ? { ...defaultForm(), ...banner } : defaultForm());
      setError(null);
    }
  }, [isOpen, banner]);

  const set = (field: keyof BannerData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.type === "custom" && !form.imageUrl) {
      setError("Vui lòng upload ảnh banner.");
      return;
    }
    if (form.type === "category" && !form.categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };

      if (isEdit) {
        await axios.patch(API_ENDPOINTS.ADMIN.BANNER_DETAIL(banner!.id!), payload);
      } else {
        await axios.post(API_ENDPOINTS.ADMIN.BANNERS, payload);
      }

      await qc.invalidateQueries({ queryKey: queryKeys.banners.all });
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
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">
            {isEdit ? "Chỉnh sửa banner" : "Thêm banner mới"}
          </SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Banner hiển thị trong carousel trang chủ.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-6">
          {/* Type toggle */}
          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Loại slide</Label>
            <div className="flex gap-2">
              {(["custom", "category"] as const).map((t) => (
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
                  {t === "custom" ? "🖼 Ảnh tùy chọn" : "📂 Từ danh mục"}
                </button>
              ))}
            </div>
          </div>

          {/* Category selector */}
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

          {/* Image upload */}
          {form.type === "custom" && (
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Ảnh banner <span className="text-red-500">*</span>
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
                <span className="font-normal normal-case text-slate-400">
                  (mặc định: tên danh mục)
                </span>
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
            <Label className="text-xs font-black tracking-wider uppercase">Mô tả phụ</Label>
            <Textarea
              value={form.subtitle ?? ""}
              onChange={(e) => set("subtitle", e.target.value || null)}
              placeholder="Ví dụ: Ưu đãi đến 50% các dòng mỹ phẩm..."
              className="min-h-[80px] bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Badge{" "}
                {form.type === "category" && (
                  <span className="font-normal normal-case text-slate-400">(mặc định: "Danh mục hot")</span>
                )}
              </Label>
              <Input
                value={form.badgeText ?? ""}
                onChange={(e) => set("badgeText", e.target.value || null)}
                placeholder={form.type === "category" ? "Danh mục hot" : "Ví dụ: Flash Sale"}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Màu accent</Label>
              <Select
                value={form.accentColor ?? "violet"}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Nút CTA{" "}
                {form.type === "category" && (
                  <span className="font-normal normal-case text-slate-400">(mặc định: "Xem tất cả")</span>
                )}
              </Label>
              <Input
                value={form.ctaLabel ?? ""}
                onChange={(e) => set("ctaLabel", e.target.value || null)}
                placeholder={form.type === "category" ? "Xem tất cả" : "Ví dụ: Mua ngay"}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Link CTA{" "}
                {form.type === "category" && (
                  <span className="font-normal normal-case text-slate-400">(tự động)</span>
                )}
              </Label>
              <Input
                value={form.ctaUrl ?? ""}
                onChange={(e) => set("ctaUrl", e.target.value || null)}
                placeholder={form.type === "category" ? "/products?category=..." : "/products"}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Nút phụ (tùy chọn)</Label>
            <Input
              value={form.ctaSecondaryLabel ?? ""}
              onChange={(e) => set("ctaSecondaryLabel", e.target.value || null)}
              placeholder="Ví dụ: Khám phá thêm"
              className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Tag giảm giá</Label>
              <Input
                value={form.discountTag ?? ""}
                onChange={(e) => set("discountTag", e.target.value || null)}
                placeholder="Ví dụ: 50%"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Chú thích tag</Label>
              <Input
                value={form.discountTagSub ?? ""}
                onChange={(e) => set("discountTagSub", e.target.value || null)}
                placeholder="Ví dụ: cho đơn đầu tiên"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Bắt đầu từ</Label>
              <Input
                type="datetime-local"
                value={form.startsAt ?? ""}
                onChange={(e) => set("startsAt", e.target.value || null)}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Kết thúc lúc</Label>
              <Input
                type="datetime-local"
                value={form.endsAt ?? ""}
                onChange={(e) => set("endsAt", e.target.value || null)}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Thứ tự hiển thị</Label>
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
                id="banner-active"
              />
              <Label htmlFor="banner-active" className="text-sm font-bold cursor-pointer">
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
              {isEdit ? "Lưu thay đổi" : "Tạo banner"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
