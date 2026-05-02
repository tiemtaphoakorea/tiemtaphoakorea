"use client";

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
import { useEffect, useState } from "react";
import { uploadImage } from "@/lib/upload-image";
import { queryKeys } from "@/lib/query-keys";
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

type FormState = {
  type: "custom" | "category";
  categoryId: string;
  imageFiles: string[];
  title: string;
  subtitle: string;
  badgeText: string;
  ctaLabel: string;
  ctaUrl: string;
  discountTag: string;
  discountTagSub: string;
  accentColor: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  type: "custom",
  categoryId: "",
  imageFiles: [],
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
  const [form, setForm] = useState<FormState>(EMPTY);

  const detailQuery = useQuery({
    queryKey: ["banner-detail", bannerId],
    queryFn: () =>
      adminClient
        .listBanners()
        .then((r) => r.banners.find((b) => b.id === bannerId) ?? null),
    enabled: isEdit,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list("", 1, 100),
    queryFn: () => adminClient.getCategories({}),
    staleTime: 60_000,
    enabled: form.type === "category",
  });

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const b = detailQuery.data;
    setForm({
      type: (b.type as "custom" | "category") ?? "custom",
      categoryId: b.categoryId ?? "",
      imageFiles: b.imageUrl ? [b.imageUrl] : [],
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
  }, [isEdit, detailQuery.data]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        type: form.type,
        categoryId: form.type === "category" ? form.categoryId || null : null,
        imageUrl: form.type === "custom" ? (form.imageFiles[0] ?? null) : null,
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        badgeText: form.badgeText.trim() || null,
        ctaLabel: form.ctaLabel.trim() || null,
        ctaUrl: form.ctaUrl.trim() || null,
        discountTag: form.discountTag.trim() || null,
        discountTagSub: form.discountTagSub.trim() || null,
        accentColor: form.accentColor || null,
        isActive: form.isActive,
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

  const canSave =
    (form.type === "custom" && form.imageFiles.length > 0) ||
    (form.type === "category" && !!form.categoryId);

  return (
    <div className="border-t border-border bg-muted/20 p-4">
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Loại</FieldLabel>
            <Select value={form.type} onValueChange={(v) => set("type", v as "custom" | "category")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom (ảnh tự upload)</SelectItem>
                <SelectItem value="category">Theo danh mục</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Màu accent</FieldLabel>
            <Select value={form.accentColor} onValueChange={(v) => set("accentColor", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCENT_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {form.type === "custom" && (
          <Field>
            <FieldLabel>Ảnh banner *</FieldLabel>
            <FileUploader
              compact
              value={form.imageFiles}
              onChange={(v) => set("imageFiles", v)}
              uploadFn={uploadImage}
              maxFiles={1}
              hint="JPG/PNG/WebP · tỉ lệ 16:9 hoặc 3:1 · ≤2MB"
            />
          </Field>
        )}

        {form.type === "category" && (
          <Field>
            <FieldLabel>Danh mục *</FieldLabel>
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                {(categoriesQuery.data?.flatCategories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Tiêu đề</FieldLabel>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="NÂNG TẦM VẺ ĐẸP HÀN" />
          </Field>
          <Field>
            <FieldLabel>Badge text</FieldLabel>
            <Input value={form.badgeText} onChange={(e) => set("badgeText", e.target.value)} placeholder="Hàng chính hãng từ Seoul" />
          </Field>
        </div>

        <Field>
          <FieldLabel>Phụ đề</FieldLabel>
          <Textarea value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} rows={2} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>CTA label</FieldLabel>
            <Input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Mua ngay" />
          </Field>
          <Field>
            <FieldLabel>CTA URL</FieldLabel>
            <Input value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="/products" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Discount tag</FieldLabel>
            <Input value={form.discountTag} onChange={(e) => set("discountTag", e.target.value)} placeholder="50%" />
          </Field>
          <Field>
            <FieldLabel>Discount sub</FieldLabel>
            <Input value={form.discountTagSub} onChange={(e) => set("discountTagSub", e.target.value)} placeholder="cho đơn đầu tiên" />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>Huỷ</Button>
          <Button size="sm" disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </FieldGroup>
    </div>
  );
}
