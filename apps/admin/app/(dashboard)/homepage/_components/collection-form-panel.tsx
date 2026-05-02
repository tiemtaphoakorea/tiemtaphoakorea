"use client";

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

type FormState = {
  type: CollectionType;
  title: string;
  subtitle: string;
  iconKey: string | null;
  viewAllUrl: string;
  itemLimit: number;
  isActive: boolean;
  categoryId: string | null;
  daysWindow: number;
};

const EMPTY: FormState = {
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
  const [form, setForm] = useState<FormState>(EMPTY);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [pendingTypeChange, setPendingTypeChange] = useState<CollectionType | null>(null);

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

  useEffect(() => {
    if (!isEdit || !detailQuery.data) return;
    const c = detailQuery.data.collection;
    setForm({
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
  }, [isEdit, detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        iconKey: form.iconKey,
        viewAllUrl: form.viewAllUrl.trim() || null,
        itemLimit: form.itemLimit,
        isActive: form.isActive,
        categoryId: form.type === "by_category" ? form.categoryId : null,
        daysWindow: form.type === "new_arrivals" ? form.daysWindow : null,
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

      if (form.type === "manual") {
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
    form.title.trim().length > 0 && (form.type !== "by_category" || !!form.categoryId);

  function handleTypeChange(next: CollectionType) {
    if (form.type === "manual" && next !== "manual" && productIds.length > 0) {
      setPendingTypeChange(next);
      return;
    }
    setForm({ ...form, type: next });
  }

  function confirmTypeChange() {
    if (!pendingTypeChange) return;
    setProductIds([]);
    setForm((f) => ({ ...f, type: pendingTypeChange }));
    setPendingTypeChange(null);
  }

  return (
    <div className="border-t border-border bg-muted/20 p-4">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel>Loại</FieldLabel>
          <Select value={form.type} onValueChange={(v) => handleTypeChange(v as CollectionType)}>
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
        </Field>

        <Field>
          <FieldLabel>Tiêu đề *</FieldLabel>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="vd: Bán chạy nhất"
          />
        </Field>

        <Field>
          <FieldLabel>Phụ đề</FieldLabel>
          <Textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={2}
          />
        </Field>

        <Field>
          <FieldLabel>Icon</FieldLabel>
          <IconSelect value={form.iconKey} onChange={(k) => setForm({ ...form, iconKey: k })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel>Số sản phẩm (limit)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={50}
              value={form.itemLimit}
              onChange={(e) => setForm({ ...form, itemLimit: Number(e.target.value) || 8 })}
            />
          </Field>
          <Field>
            <FieldLabel>View all URL</FieldLabel>
            <Input
              value={form.viewAllUrl}
              onChange={(e) => setForm({ ...form, viewAllUrl: e.target.value })}
              placeholder="/products"
            />
          </Field>
        </div>

        {form.type === "by_category" && (
          <Field>
            <FieldLabel>Danh mục *</FieldLabel>
            <Select
              value={form.categoryId ?? ""}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
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
          </Field>
        )}

        {form.type === "new_arrivals" && (
          <Field>
            <FieldLabel>Cửa sổ ngày (days)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={365}
              value={form.daysWindow}
              onChange={(e) => setForm({ ...form, daysWindow: Number(e.target.value) || 30 })}
            />
          </Field>
        )}

        {form.type === "manual" && (
          <Field>
            <FieldLabel>Sản phẩm trong collection</FieldLabel>
            <ManualProductPicker value={productIds} onChange={setProductIds} />
          </Field>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            size="sm"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </FieldGroup>

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
