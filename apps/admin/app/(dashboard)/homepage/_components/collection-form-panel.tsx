"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
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
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { IconSelect } from "./icon-select";
import { ManualProductPicker } from "./manual-product-picker";

const TYPES = [
  { value: "manual", label: "Thủ công (chọn sản phẩm)" },
  { value: "best_sellers", label: "Bán chạy (auto)" },
  { value: "new_arrivals", label: "Mới về (auto theo ngày tạo)" },
  { value: "by_category", label: "Theo danh mục" },
] as const;

type CollectionType = (typeof TYPES)[number]["value"];

type CollectionDetail = {
  id: string;
  type: CollectionType;
  title: string;
  subtitle: string | null;
  iconKey: string | null;
  viewAllUrl: string | null;
  itemLimit: number;
  isActive: boolean;
  sortOrder: number;
  categoryId: string | null;
  daysWindow: number | null;
  products: Array<{ productId: string; sortOrder: number }>;
};

const formSchema = z.object({
  type: z.enum(["manual", "best_sellers", "new_arrivals", "by_category"]),
  title: z.string().min(1, "Tiêu đề bắt buộc"),
  subtitle: z.string().optional(),
  iconKey: z.string().nullable().optional(),
  viewAllUrl: z.string().optional(),
  itemLimit: z.number().min(1).max(50),
  isActive: z.boolean(),
  categoryId: z.string().nullable().optional(),
  daysWindow: z.number().min(1).max(365),
});

type CollectionFormValues = z.infer<typeof formSchema>;

const defaultValues: CollectionFormValues = {
  type: "manual",
  title: "",
  subtitle: "",
  iconKey: null,
  viewAllUrl: "",
  itemLimit: 8,
  isActive: true,
  categoryId: null,
  daysWindow: 30,
};

type Props = {
  collectionId: string | null; // null = create new
  onClose: () => void;
};

export function CollectionFormPanel({ collectionId, onClose }: Props) {
  const queryClient = useQueryClient();
  const isEdit = collectionId !== null;

  // productIds is managed outside RHF — it's driven by ManualProductPicker
  const [productIds, setProductIds] = useState<string[]>([]);
  // pendingTypeChange is UI state for the confirmation dialog
  const [pendingTypeChange, setPendingTypeChange] = useState<CollectionType | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const watchType = watch("type");
  const watchTitle = watch("title");
  const watchCategoryId = watch("categoryId");

  const detailQuery = useQuery({
    queryKey: queryKeys.homepageCollections.detail(collectionId ?? ""),
    queryFn: () =>
      adminClient.getHomepageCollection(collectionId!) as unknown as Promise<{
        collection: CollectionDetail;
      }>,
    enabled: isEdit,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list("", 1, 100),
    queryFn: () => adminClient.getCategories({}),
    staleTime: 60_000,
  });

  // Load edit data into form when fetched
  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const c = detailQuery.data.collection;
    reset({
      type: c.type,
      title: c.title,
      subtitle: c.subtitle ?? "",
      iconKey: c.iconKey,
      viewAllUrl: c.viewAllUrl ?? "",
      itemLimit: c.itemLimit,
      isActive: c.isActive,
      categoryId: c.categoryId,
      daysWindow: c.daysWindow ?? 30,
    });
    setProductIds((c.products ?? []).map((p) => p.productId));
  }, [isEdit, detailQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: CollectionFormValues) => {
      const payload = {
        type: data.type,
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        iconKey: data.iconKey ?? null,
        viewAllUrl: data.viewAllUrl?.trim() || null,
        itemLimit: data.itemLimit,
        isActive: data.isActive,
        categoryId: data.type === "by_category" ? (data.categoryId ?? null) : null,
        daysWindow: data.type === "new_arrivals" ? data.daysWindow : null,
      };

      const result = isEdit
        ? await (adminClient.updateHomepageCollection(
            collectionId!,
            payload,
          ) as unknown as Promise<{
            success: boolean;
            collection: { id: string };
          }>)
        : await (adminClient.createHomepageCollection(payload) as unknown as Promise<{
            success: boolean;
            collection: { id: string };
          }>);

      if (data.type === "manual") {
        await adminClient.setHomepageCollectionProducts(result.collection.id, productIds);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homepageCollections.all });
      onClose();
    },
  });

  const canSave =
    isDirty && watchTitle.trim().length > 0 && (watchType !== "by_category" || !!watchCategoryId);

  function handleTypeChange(next: CollectionType) {
    if (watchType === "manual" && next !== "manual" && productIds.length > 0) {
      setPendingTypeChange(next);
      return;
    }
    setValue("type", next, { shouldDirty: true });
  }

  function confirmTypeChange() {
    if (!pendingTypeChange) return;
    setProductIds([]);
    setValue("type", pendingTypeChange, { shouldDirty: true });
    setPendingTypeChange(null);
  }

  return (
    <div className="border-t border-border bg-muted/20 p-4">
      <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Loại</FieldLabel>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => handleTypeChange(v as CollectionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field>
            <FieldLabel required>Tiêu đề</FieldLabel>
            <Input {...register("title")} placeholder="vd: Bán chạy nhất" />
          </Field>

          <Field>
            <FieldLabel>Phụ đề</FieldLabel>
            <Textarea {...register("subtitle")} rows={2} />
          </Field>

          <Field>
            <FieldLabel>Icon</FieldLabel>
            <Controller
              name="iconKey"
              control={control}
              render={({ field }) => (
                <IconSelect value={field.value ?? null} onChange={(k) => field.onChange(k)} />
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Số sản phẩm (limit)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={50}
                {...register("itemLimit", { valueAsNumber: true })}
              />
            </Field>
            <Field>
              <FieldLabel>View all URL</FieldLabel>
              <Input {...register("viewAllUrl")} placeholder="/products" />
            </Field>
          </div>

          {watchType === "by_category" && (
            <Field>
              <FieldLabel required>Danh mục</FieldLabel>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v)}>
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
            </Field>
          )}

          {watchType === "new_arrivals" && (
            <Field>
              <FieldLabel>Cửa sổ ngày (days)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={365}
                {...register("daysWindow", { valueAsNumber: true })}
              />
            </Field>
          )}

          {watchType === "manual" && (
            <Field>
              <FieldLabel>Sản phẩm trong collection</FieldLabel>
              <ManualProductPicker value={productIds} onChange={setProductIds} />
            </Field>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Huỷ
            </Button>
            <Button size="sm" type="submit" disabled={!canSave || saveMutation.isPending}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </FieldGroup>
      </form>

      <ConfirmDialog
        open={pendingTypeChange !== null}
        title="Đổi loại collection?"
        description={`Đổi loại sẽ xoá ${productIds.length} sản phẩm đã chọn thủ công khỏi collection. Hành động này không thể hoàn tác.`}
        confirmLabel="Đổi loại"
        onConfirm={confirmTypeChange}
        onOpenChange={(open) => !open && setPendingTypeChange(null)}
      />
    </div>
  );
}
