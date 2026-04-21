"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { type ApiError, axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { type BannerFormValues, bannerSchema } from "@workspace/shared/schemas";
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
import { Controller, useForm } from "react-hook-form";
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

type BannerData = BannerFormValues & { id?: string };

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: BannerData | null;
  categories: Category[];
};

const defaultValues: BannerFormValues = {
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
};

export function BannerForm({ isOpen, onOpenChange, banner, categories }: Props) {
  const qc = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    clearErrors,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues,
  });

  const isEdit = !!banner?.id;
  const bannerType = watch("type");

  useEffect(() => {
    if (isOpen) {
      reset(banner ? { ...defaultValues, ...banner } : defaultValues);
    }
  }, [banner, isOpen, reset]);

  const onSubmit = handleSubmit(async (data) => {
    clearErrors("root.serverError");
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        sortOrder: Number(data.sortOrder) || 0,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
      };

      if (isEdit) {
        await axios.patch(API_ENDPOINTS.ADMIN.BANNER_DETAIL(banner!.id!), payload);
      } else {
        await axios.post(API_ENDPOINTS.ADMIN.BANNERS, payload);
      }

      onOpenChange(false);
      qc.invalidateQueries({ queryKey: queryKeys.banners.all });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError("root.serverError", {
        type: "server",
        message:
          (apiErr?.data?.error as string | undefined) ??
          (err instanceof Error ? err.message : null) ??
          "Đã có lỗi xảy ra.",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

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

        <form onSubmit={onSubmit} className="flex flex-col gap-6 py-6">
          {/* Type toggle */}
          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Loại slide</Label>
            <div className="flex gap-2">
              {(["custom", "category"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t, { shouldDirty: true, shouldValidate: true })}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                    bannerType === t
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
          {bannerType === "category" && (
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Danh mục <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(value) => field.onChange(value || null)}
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
                )}
              />
              {errors.categoryId?.message && (
                <p className="text-destructive text-sm">{errors.categoryId.message}</p>
              )}
            </div>
          )}

          {/* Image upload */}
          {bannerType === "custom" && (
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Ảnh banner <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] ?? null)}
                    maxFiles={1}
                  />
                )}
              />
              {errors.imageUrl?.message && (
                <p className="text-destructive text-sm">{errors.imageUrl.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">
              Tiêu đề{" "}
              {bannerType === "category" && (
                <span className="font-normal normal-case text-slate-400">
                  (mặc định: tên danh mục)
                </span>
              )}
            </Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder={
                    bannerType === "category" ? "Tự động từ tên danh mục" : "Nhập tiêu đề..."
                  }
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              )}
            />
            {errors.title?.message && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">Mô tả phụ</Label>
            <Controller
              name="subtitle"
              control={control}
              render={({ field }) => (
                <Textarea
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="Ví dụ: Ưu đãi đến 50% các dòng mỹ phẩm..."
                  className="min-h-[80px] bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              )}
            />
            {errors.subtitle?.message && (
              <p className="text-destructive text-sm">{errors.subtitle.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Badge{" "}
                {bannerType === "category" && (
                  <span className="font-normal normal-case text-slate-400">
                    (mặc định: "Danh mục hot")
                  </span>
                )}
              </Label>
              <Controller
                name="badgeText"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder={bannerType === "category" ? "Danh mục hot" : "Ví dụ: Flash Sale"}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.badgeText?.message && (
                <p className="text-destructive text-sm">{errors.badgeText.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Màu accent</Label>
              <Controller
                name="accentColor"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? "violet"} onValueChange={field.onChange}>
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
                )}
              />
              {errors.accentColor?.message && (
                <p className="text-destructive text-sm">{errors.accentColor.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Nút CTA{" "}
                {bannerType === "category" && (
                  <span className="font-normal normal-case text-slate-400">
                    (mặc định: "Xem tất cả")
                  </span>
                )}
              </Label>
              <Controller
                name="ctaLabel"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder={bannerType === "category" ? "Xem tất cả" : "Ví dụ: Mua ngay"}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.ctaLabel?.message && (
                <p className="text-destructive text-sm">{errors.ctaLabel.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">
                Link CTA{" "}
                {bannerType === "category" && (
                  <span className="font-normal normal-case text-slate-400">(tự động)</span>
                )}
              </Label>
              <Controller
                name="ctaUrl"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder={bannerType === "category" ? "/products?category=..." : "/products"}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.ctaUrl?.message && (
                <p className="text-destructive text-sm">{errors.ctaUrl.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black tracking-wider uppercase">
              Nút phụ (tùy chọn)
            </Label>
            <Controller
              name="ctaSecondaryLabel"
              control={control}
              render={({ field }) => (
                <Input
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  placeholder="Ví dụ: Khám phá thêm"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              )}
            />
            {errors.ctaSecondaryLabel?.message && (
              <p className="text-destructive text-sm">{errors.ctaSecondaryLabel.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Tag giảm giá</Label>
              <Controller
                name="discountTag"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="Ví dụ: 50%"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.discountTag?.message && (
                <p className="text-destructive text-sm">{errors.discountTag.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Chú thích tag</Label>
              <Controller
                name="discountTagSub"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    placeholder="Ví dụ: cho đơn đầu tiên"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.discountTagSub?.message && (
                <p className="text-destructive text-sm">{errors.discountTagSub.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Bắt đầu từ</Label>
              <Controller
                name="startsAt"
                control={control}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.startsAt?.message && (
                <p className="text-destructive text-sm">{errors.startsAt.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Kết thúc lúc</Label>
              <Controller
                name="endsAt"
                control={control}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.endsAt?.message && (
                <p className="text-destructive text-sm">{errors.endsAt.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs font-black tracking-wider uppercase">Thứ tự hiển thị</Label>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                )}
              />
              {errors.sortOrder?.message && (
                <p className="text-destructive text-sm">{errors.sortOrder.message}</p>
              )}
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="banner-active"
                  />
                )}
              />
              <Label htmlFor="banner-active" className="text-sm font-bold cursor-pointer">
                Hiển thị
              </Label>
            </div>
          </div>

          {errors.root?.serverError?.message && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {errors.root.serverError.message}
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-black shadow-lg shadow-primary/20"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo banner"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
