"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryWithChildren, NewCategory } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-foreground";

type CategoryDrawerProps = {
  open: boolean;
  category: CategoryWithChildren | null;
  onClose: () => void;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryDrawer({ open, category, onClose }: CategoryDrawerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setImageUrl(category?.imageUrl ?? null);
    setDescription(category?.description ?? "");
    setDisplayOrder(category ? String(category.displayOrder) : "0");
    setIsActive(category?.isActive ?? true);
  }, [category, open]);

  // Auto-derive slug for new categories.
  useEffect(() => {
    if (!category && name && !slug) setSlug(slugify(name));
  }, [name, slug, category]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });

  const createMutation = useMutation({
    mutationFn: (data: NewCategory) => adminClient.createCategory(data),
    onSuccess: () => {
      toast.success("Đã thêm danh mục");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewCategory> }) =>
      adminClient.updateCategory(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Tên danh mục bắt buộc");
      return;
    }
    const payload: NewCategory = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description.trim() || undefined,
      imageUrl: imageUrl ?? undefined,
      parentId: null,
      displayOrder: Number(displayOrder) || 0,
      isActive,
    };
    if (category) {
      updateMutation.mutate({ id: category.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">
            {category ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Tên danh mục</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: K-Food"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Slug URL</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="k-food" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Ảnh danh mục</Label>
            <ImageUploader
              value={imageUrl ? [imageUrl] : []}
              onChange={(urls) => setImageUrl(urls[0] ?? null)}
              maxFiles={1}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-[13px] font-medium">Đang hiển thị</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Đang lưu..." : category ? "Lưu thay đổi" : "Thêm"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
