"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { FileUploader } from "@workspace/ui/components/file-uploader";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { queryKeys } from "@/lib/query-keys";
import { uploadImage } from "@/lib/upload-image";
import { adminClient } from "@/services/admin.client";

const ACCENT_COLORS = [
  { value: "violet", label: "Tím" },
  { value: "rose", label: "Hồng" },
  { value: "green", label: "Xanh lá" },
  { value: "sky", label: "Xanh dương" },
  { value: "orange", label: "Cam" },
  { value: "amber", label: "Vàng" },
  { value: "indigo", label: "Chàm" },
] as const;

const formSchema = z.object({
  type: z.enum(["custom", "category"]),
  categoryId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  discountTag: z.string().optional(),
  discountTagSub: z.string().optional(),
  accentColor: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  type: "custom",
  categoryId: null,
  imageUrl: null,
  title: "",
  subtitle: "",
  badgeText: "",
  ctaLabel: "",
  ctaUrl: "",
  discountTag: "",
  discountTagSub: "",
  accentColor: "violet",
  isActive: true,
};

type Props = {
  bannerId: string | null; // null = create
  onClose: () => void;
};

export function BannerFormPanel({ bannerId, onClose }: Props) {
  const queryClient = useQueryClient();
  const isEdit = bannerId !== null;

  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watchType = watch("type");
  const watchImageUrl = watch("imageUrl");
  const watchCategoryId = watch("categoryId");

  const detailQuery = useQuery({
    queryKey: ["banner-detail", bannerId],
    queryFn: () =>
      adminClient.listBanners().then((r) => r.banners.find((b) => b.id === bannerId) ?? null),
    enabled: isEdit,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list("", 1, 100),
    queryFn: () => adminClient.getCategories({}),
    staleTime: 60_000,
    enabled: watchType === "category",
  });

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const b = detailQuery.data;
    reset({
      type: (b.type as "custom" | "category") ?? "custom",
      categoryId: b.categoryId ?? null,
      imageUrl: b.imageUrl ?? null,
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      badgeText: b.badgeText ?? "",
      ctaLabel: b.ctaLabel ?? "",
      ctaUrl: b.ctaUrl ?? "",
      discountTag: b.discountTag ?? "",
      discountTagSub: b.discountTagSub ?? "",
      accentColor: b.accentColor ?? "violet",
      isActive: b.isActive,
    });
  }, [isEdit, detailQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        type: data.type,
        categoryId: data.type === "category" ? (data.categoryId ?? null) : null,
        imageUrl: data.type === "custom" ? (data.imageUrl ?? null) : null,
        title: data.title?.trim() || null,
        subtitle: data.subtitle?.trim() || null,
        badgeText: data.badgeText?.trim() || null,
        ctaLabel: data.ctaLabel?.trim() || null,
        ctaUrl: data.ctaUrl?.trim() || null,
        discountTag: data.discountTag?.trim() || null,
        discountTagSub: data.discountTagSub?.trim() || null,
        accentColor: data.accentColor || null,
        isActive: data.isActive,
      };
      return isEdit
        ? adminClient.updateBanner(bannerId!, payload)
        : adminClient.createBanner(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
      onClose();
    },
  });

  // In edit mode, allow saving a category banner with null category (orphaned state)
  // so the user can update other fields or select a replacement category.
  const canSave =
    isDirty &&
    ((watchType === "custom" && !!watchImageUrl) ||
      (watchType === "category" && (!!watchCategoryId || isEdit)));

  return (
    <div className="border-t border-border bg-muted/20 p-4">
      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))}>
        <FieldGroup className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Loại</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom (ảnh tự upload)</SelectItem>
                      <SelectItem value="category">Theo danh mục</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Màu accent</FieldLabel>
              <Controller
                name="accentColor"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
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
            </Field>
          </div>

          {watchType === "custom" && (
            <Field>
              <FieldLabel required>Ảnh banner</FieldLabel>
              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <FileUploader
                    compact
                    value={field.value ? [field.value] : []}
                    onChange={(files) => field.onChange(files[0] ?? null)}
                    uploadFn={uploadImage}
                    maxFiles={1}
                    hint="JPG/PNG/WebP · tỉ lệ 16:9 hoặc 3:1 · ≤2MB"
                  />
                )}
              />
            </Field>
          )}

          {watchType === "category" && (
            <Field>
              <FieldLabel required>Danh mục</FieldLabel>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoriesQuery.data?.flatCategories ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!watchCategoryId && (
                <p className="text-xs text-amber-600">
                  {isEdit
                    ? "Danh mục đã bị xóa. Nên chọn danh mục mới trước khi lưu."
                    : "Vui lòng chọn danh mục."}
                </p>
              )}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Tiêu đề</FieldLabel>
              <Input {...register("title")} placeholder="NÂNG TẦM VẺ ĐẸP HÀN" />
            </Field>
            <Field>
              <FieldLabel>Badge text</FieldLabel>
              <Input {...register("badgeText")} placeholder="Hàng chính hãng từ Seoul" />
            </Field>
          </div>

          <Field>
            <FieldLabel>Phụ đề</FieldLabel>
            <Textarea {...register("subtitle")} rows={2} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>CTA label</FieldLabel>
              <Input {...register("ctaLabel")} placeholder="Mua ngay" />
            </Field>
            <Field>
              <FieldLabel>CTA URL</FieldLabel>
              <Input {...register("ctaUrl")} placeholder="/products" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Discount tag</FieldLabel>
              <Input {...register("discountTag")} placeholder="50%" />
            </Field>
            <Field>
              <FieldLabel>Discount sub</FieldLabel>
              <Input {...register("discountTagSub")} placeholder="cho đơn đầu tiên" />
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" size="sm" disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
