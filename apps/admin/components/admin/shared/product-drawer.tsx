"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductData, ProductListItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ProductDrawerProps = {
  open: boolean;
  /** Editing existing product, null = adding new. */
  product: ProductListItem | null;
  onClose: () => void;
};

/** Slugify Vietnamese — lowercase, strip diacritics, replace whitespace with `-`. */
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

/** Edit/create product drawer. Editing PATH wires to `updateProduct`-equivalent
 *  via slug+isActive only; full variants editing handled in dedicated page. */
export function ProductDrawer({ open, product, onClose }: ProductDrawerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<string>("");
  const [stock, setStock] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when product or open changes.
  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setSlug(product?.slug ?? "");
    setSlugTouched(Boolean(product?.slug));
    setDescription(product?.description ?? "");
    setBasePrice(product?.basePrice ? String(Number(product.basePrice)) : "");
    setStock(product ? String(product.totalAvailable) : "0");
    setIsActive(product?.isActive ?? true);
    setImageUrls(product?.thumbnail ? [product.thumbnail] : []);
  }, [product, open]);

  // Auto-derive slug from name when adding new, until user manually edits it.
  useEffect(() => {
    if (!product && !slugTouched) setSlug(slugify(name));
  }, [name, slugTouched, product]);

  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => adminClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Đã thêm sản phẩm");
      onClose();
    },
    onError: (err) => toast.error(`Lỗi: ${err instanceof Error ? err.message : String(err)}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      description?: string;
      basePrice: number;
      isActive: boolean;
    }) => adminClient.updateProduct(product!.id, { ...data, variants: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Đã cập nhật sản phẩm");
      onClose();
    },
    onError: (err) => toast.error(`Lỗi: ${err instanceof Error ? err.message : String(err)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast.success("Đã xoá sản phẩm");
      onClose();
    },
    onError: (err) => toast.error(`Lỗi: ${err instanceof Error ? err.message : String(err)}`),
  });

  const handleSave = () => {
    const priceNum = Number(basePrice) || 0;
    if (!name.trim()) {
      toast.error("Tên sản phẩm bắt buộc");
      return;
    }
    if (priceNum <= 0) {
      toast.error("Giá bán phải > 0");
      return;
    }
    const finalSlug = slug.trim() || slugify(name);
    if (product) {
      updateMutation.mutate({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || undefined,
        basePrice: priceNum,
        isActive,
      });
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || undefined,
      basePrice: priceNum,
      isActive,
      variants: [
        {
          name: "Mặc định",
          sku: `${finalSlug.slice(0, 24).toUpperCase()}-DEFAULT`,
          price: priceNum,
          onHand: Number(stock) || 0,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        },
      ],
    });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">
            {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto px-[22px] py-[22px]">
          <FieldGroup>
            <ImageUploader value={imageUrls} onChange={setImageUrls} maxFiles={1} />

            <Field>
              <FieldLabel>Tên sản phẩm</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Mì cay Shin Ramyun..."
              />
            </Field>

            <Field>
              <FieldLabel>Slug URL</FieldLabel>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="mi-cay-shin-ramyun"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field>
                <FieldLabel>Giá bán (đ)</FieldLabel>
                <NumberInput
                  decimalScale={0}
                  value={basePrice}
                  onValueChange={({ value }) => setBasePrice(value)}
                  placeholder="329000"
                />
              </Field>
              <Field>
                <FieldLabel>Tồn kho khởi tạo</FieldLabel>
                <NumberInput
                  decimalScale={0}
                  value={stock}
                  onValueChange={({ value }) => setStock(value)}
                  placeholder="0"
                  disabled={!!product}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Mô tả sản phẩm</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết, thành phần..."
                rows={4}
              />
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-[13px] font-medium">Đang bán</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {product && (
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                className="self-start border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Xoá sản phẩm
              </Button>
            )}
          </FieldGroup>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
            }
          >
            {product
              ? updateMutation.isPending
                ? "Đang lưu..."
                : "Lưu thay đổi"
              : createMutation.isPending
                ? "Đang lưu..."
                : "Thêm sản phẩm"}
          </Button>
        </div>
      </SheetContent>

      {product && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Xoá sản phẩm "${product.name}"?`}
          confirmLabel="Xoá"
          onConfirm={() => {
            deleteMutation.mutate(product.id);
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </Sheet>
  );
}
