"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductData, ProductListItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type ProductDrawerProps = {
  open: boolean;
  /** Editing existing product, null = adding new. */
  product: ProductListItem | null;
  onClose: () => void;
};

const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-foreground";

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
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<string>("");
  const [stock, setStock] = useState<string>("0");
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when product or open changes.
  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setSlug(product?.slug ?? "");
    setDescription(product?.description ?? "");
    setBasePrice(product?.basePrice ? String(Number(product.basePrice)) : "");
    setStock(product ? String(product.totalAvailable) : "0");
    setIsActive(product?.isActive ?? true);
  }, [product, open]);

  // Auto-derive slug from name on first input when adding new.
  useEffect(() => {
    if (!product && name && !slug) setSlug(slugify(name));
  }, [name, slug, product]);

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

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          <div className="flex h-[110px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary hover:bg-primary/5">
            <Upload className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
            <span className="text-xs font-medium text-muted-foreground">
              Kéo thả hoặc click để tải ảnh lên
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Tên sản phẩm</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Mì cay Shin Ramyun..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Slug URL</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mi-cay-shin-ramyun"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Giá bán (đ)</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="329000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Tồn kho khởi tạo</Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                disabled={!!product}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Mô tả sản phẩm</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết, thành phần..."
              rows={4}
            />
          </div>

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
