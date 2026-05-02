"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
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

/** Shape of what the GET /homepage-collections/:id API returns inside `collection`. */
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

export function CollectionFormDrawer({ collectionId, onClose }: Props) {
  const queryClient = useQueryClient();
  const isEdit = collectionId !== null;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [productIds, setProductIds] = useState<string[]>([]);

  const detailQuery = useQuery({
    queryKey: queryKeys.homepageCollections.detail(collectionId ?? ""),
    // API returns { collection: CollectionDetail }
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

  // Populate form when editing an existing collection
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

      // Both create and update return { success, collection: { id, ... } }
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
      // Native confirm is acceptable here — avoids a nested modal
      if (!window.confirm("Đổi loại sẽ xoá danh sách sản phẩm thủ công. Tiếp tục?")) return;
      setProductIds([]);
    }
    setForm({ ...form, type: next });
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Sửa collection" : "Tạo collection"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Type */}
          <div>
            <Label>Loại</Label>
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
          </div>

          {/* Title */}
          <div>
            <Label>Tiêu đề *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="vd: Bán chạy nhất"
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label>Phụ đề</Label>
            <Textarea
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              rows={2}
            />
          </div>

          {/* Icon */}
          <div>
            <Label>Icon</Label>
            <IconSelect value={form.iconKey} onChange={(k) => setForm({ ...form, iconKey: k })} />
          </div>

          {/* Limit + viewAllUrl */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số sản phẩm (limit)</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.itemLimit}
                onChange={(e) => setForm({ ...form, itemLimit: Number(e.target.value) || 8 })}
              />
            </div>
            <div>
              <Label>View all URL</Label>
              <Input
                value={form.viewAllUrl}
                onChange={(e) => setForm({ ...form, viewAllUrl: e.target.value })}
                placeholder="/products"
              />
            </div>
          </div>

          {/* Conditional: category picker */}
          {form.type === "by_category" && (
            <div>
              <Label>Danh mục *</Label>
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
            </div>
          )}

          {/* Conditional: days window */}
          {form.type === "new_arrivals" && (
            <div>
              <Label>Cửa sổ ngày (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.daysWindow}
                onChange={(e) => setForm({ ...form, daysWindow: Number(e.target.value) || 30 })}
              />
            </div>
          )}

          {/* Conditional: manual product picker */}
          {form.type === "manual" && (
            <div>
              <Label>Sản phẩm trong collection</Label>
              <ManualProductPicker value={productIds} onChange={setProductIds} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
