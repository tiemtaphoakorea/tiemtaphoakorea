"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CategoryWithChildren, NewCategory } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const formSchema = z.object({
  name: z.string().min(1, "Tên danh mục bắt buộc"),
  slug: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string().optional(),
  displayOrder: z.number().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

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
  // slugTouched is UI state, not a form field — tracks whether user manually edited slug
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      imageUrl: null,
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setSlugTouched(Boolean(category?.slug));
    reset({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      imageUrl: category?.imageUrl ?? null,
      description: category?.description ?? "",
      displayOrder: category?.displayOrder ?? 0,
      isActive: category?.isActive ?? true,
    });
  }, [category, open, reset]);

  // Auto-derive slug for new categories until user manually edits it
  const watchName = watch("name");
  useEffect(() => {
    if (!category && !slugTouched) setValue("slug", slugify(watchName));
  }, [watchName, slugTouched, category, setValue]);

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

  const onFormSubmit = (values: FormValues) => {
    const payload: NewCategory = {
      name: values.name.trim(),
      slug: values.slug?.trim() || slugify(values.name),
      description: values.description?.trim() || undefined,
      imageUrl: values.imageUrl ?? undefined,
      parentId: null,
      displayOrder: values.displayOrder,
      isActive: values.isActive,
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
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-120">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-sm font-bold">
            {category ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel required>Tên danh mục</FieldLabel>
                <Input {...register("name")} placeholder="VD: K-Food" />
                {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
              </Field>
              <Field>
                <FieldLabel>Slug URL</FieldLabel>
                <Input
                  {...register("slug")}
                  placeholder="k-food"
                  onChange={(e) => {
                    setSlugTouched(true);
                    setValue("slug", e.target.value);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel>Ảnh danh mục</FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel>Mô tả</FieldLabel>
                <Textarea {...register("description")} rows={3} />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium">Đang hiển thị</span>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : category ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
