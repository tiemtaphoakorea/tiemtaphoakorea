"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { type ApiError, axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { LOW_STOCK_DEFAULT_THRESHOLD } from "@workspace/shared/constants";
import { type ProductFormValues, productSchema } from "@workspace/shared/schemas";
import type { ProductFormProps, ProductFormVariant } from "@workspace/shared/types/product";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducer, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { queryKeys } from "@/lib/query-keys";
import { DEFAULT_VARIANT, type FormState, formReducer } from "./product-form/form-state";
import { InfoTab } from "./product-form/info-tab";
import { MediaTab } from "./product-form/media-tab";
import { StatusSidebar } from "./product-form/status-sidebar";
import { VariantsTab } from "./product-form/variants-tab";

export function ProductForm({ initialData, categories, mode }: ProductFormProps) {
  "use no memo";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formState, dispatch] = useReducer(formReducer, {
    apiError: null,
    apiPending: false,
    attributes: [
      { name: "Color", values: [] as string[] },
      { name: "Size", values: [] as string[] },
    ],
    variants: initialData?.variants || [DEFAULT_VARIANT],
    selectedMediaVariantId: initialData?.variants?.[0]?.id || DEFAULT_VARIANT.id,
  } satisfies FormState);

  const { apiError, apiPending, attributes, variants } = formState;

  // Guard against stale selected media variant id (e.g. after deletion)
  const selectedMediaVariantId = variants.some((v) => v.id === formState.selectedMediaVariantId)
    ? formState.selectedMediaVariantId
    : (variants[0]?.id ?? DEFAULT_VARIANT.id);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      categoryId: initialData?.categoryId ?? "",
      basePrice: initialData?.basePrice ?? 0,
      isActive: initialData?.isActive !== false,
      isFeatured: initialData?.isFeatured ?? false,
    },
  });

  const basePrice = useWatch({ control: form.control, name: "basePrice" });

  const isDirtyRef = useRef(false);
  const { showDialog, navigateTo, confirmExit, cancelExit, bypassNextNavigation } =
    useUnsavedChangesGuard(isDirtyRef);

  const handleGenerateVariants = () => {
    const activeAttrs = attributes.filter((a) => a.values.length > 0 && a.name.trim() !== "");
    if (activeAttrs.length === 0) return;

    const cartesian = (arrays: string[][]): string[][] =>
      arrays.reduce<string[][]>((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);

    const combinations = cartesian(activeAttrs.map((a) => a.values));
    const name = form.getValues("name");

    const newVariants: ProductFormVariant[] = combinations.map((combo, idx) => {
      const variantName = combo.join(" - ");
      const skuSuffix = combo.map((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-");
      const autoSku = name
        ? `${name.substring(0, 6).toUpperCase()}-${skuSuffix}`
        : `SKU-${skuSuffix}`;

      return {
        id: `gen-${Date.now()}-${idx}`,
        name: variantName,
        sku: autoSku,
        price: basePrice,
        costPrice: 0,
        onHand: 0,
        lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
        images: [],
      };
    });

    // Replace lone untouched default; otherwise append
    if (variants.length === 1 && variants[0].name === "Default Variant" && !variants[0].sku) {
      dispatch({ type: "SET_VARIANTS", payload: newVariants });
    } else {
      dispatch({ type: "SET_VARIANTS", payload: [...variants, ...newVariants] });
    }
  };

  const onValidSubmit = async (data: ProductFormValues) => {
    const finalVariants = [...variants];
    if (finalVariants.length === 0) {
      dispatch({ type: "SET_API_ERROR", payload: "Cần ít nhất một biến thể." });
      return;
    }
    for (let i = 0; i < finalVariants.length; i++) {
      const v = finalVariants[i];
      if (!v.name?.trim()) {
        dispatch({
          type: "SET_API_ERROR",
          payload: `Biến thể ${i + 1}: Vui lòng nhập tên biến thể.`,
        });
        return;
      }
      if (!v.sku?.trim()) {
        dispatch({ type: "SET_API_ERROR", payload: `Biến thể ${i + 1}: Vui lòng nhập SKU.` });
        return;
      }
      const price = Number(v.price);
      const costPrice = Number(v.costPrice ?? 0);
      const stock = Number(v.onHand ?? 0);
      const lowTh = Number(v.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD);
      if (price < 0 || costPrice < 0 || stock < 0 || lowTh < 0 || !Number.isFinite(lowTh)) {
        dispatch({
          type: "SET_API_ERROR",
          payload: `Biến thể ${i + 1}: Giá, giá vốn, tồn kho và ngưỡng cảnh báo phải là số hợp lệ và >= 0.`,
        });
        return;
      }
    }
    dispatch({ type: "SET_API_ERROR", payload: null });
    dispatch({ type: "SET_API_PENDING", payload: true });

    const createPayload = {
      name: data.name,
      description: data.description ?? "",
      categoryId: data.categoryId || null,
      basePrice: Number(data.basePrice ?? 0),
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured === true,
      variants: finalVariants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        costPrice: Number(v.costPrice ?? 0),
        onHand: Number(v.onHand ?? 0),
        lowStockThreshold: Math.floor(Number(v.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD)),
        images: v.images ?? [],
      })),
    };
    const productId = initialData?.id;
    const updatePayload = {
      ...createPayload,
      slug: initialData?.slug ?? "",
      variants: finalVariants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        costPrice: Number(v.costPrice ?? 0),
        onHand: Number(v.onHand ?? 0),
        lowStockThreshold: Math.floor(Number(v.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD)),
        images: v.images ?? [],
      })),
    };

    let res;
    try {
      if (mode === "create") {
        res = await axios.post(API_ENDPOINTS.ADMIN.PRODUCTS, createPayload);
        toast.success("Đã tạo sản phẩm");
      } else {
        if (!productId) {
          dispatch({ type: "SET_API_ERROR", payload: "Thiếu ID sản phẩm" });
          dispatch({ type: "SET_API_PENDING", payload: false });
          return;
        }
        res = await axios.put(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${productId}`, updatePayload);
        toast.success("Đã cập nhật sản phẩm");
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const message =
        (apiErr?.data?.error as string | undefined) ??
        (err instanceof Error ? err.message : null) ??
        (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm");
      toast.error(message || "Có lỗi xảy ra");
      dispatch({ type: "SET_API_ERROR", payload: message });
      dispatch({ type: "SET_API_PENDING", payload: false });
      return;
    }

    if (res?.success) {
      dispatch({ type: "SET_API_PENDING", payload: false });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all, exact: false });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all, exact: false });
      if (mode === "edit" && productId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.productEdit(productId) });
      }
      isDirtyRef.current = false;
      bypassNextNavigation();
      router.push("/products");
      return;
    }

    dispatch({
      type: "SET_API_ERROR",
      payload:
        res?.error ??
        (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm"),
    });
    dispatch({ type: "SET_API_PENDING", payload: false });
  };

  return (
    <div className="flex w-full flex-col gap-5 pb-20">
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={form.handleSubmit(onValidSubmit)}
        onChange={() => {
          isDirtyRef.current = true;
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              onClick={() => navigateTo("/products")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {mode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
                </h1>
                {mode === "edit" && initialData?.name && (
                  <Badge
                    variant="outline"
                    className="border-border text-xs font-medium text-muted-foreground"
                  >
                    {initialData.name}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {mode === "create"
                  ? "Tạo sản phẩm và các biến thể của nó."
                  : "Cập nhật thông tin và biến thể sản phẩm."}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            <Button type="button" variant="outline" onClick={() => navigateTo("/products")}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={apiPending}>
              {apiPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create" ? "Đang tạo..." : "Đang lưu..."}
                </>
              ) : mode === "create" ? (
                "Tạo sản phẩm"
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 flex flex-col gap-5">
            <InfoTab form={form} />
            <VariantsTab
              attributes={attributes}
              variants={variants}
              basePrice={basePrice}
              dispatch={dispatch}
              onGenerate={handleGenerateVariants}
              mode={mode}
            />
            <MediaTab
              variants={variants}
              selectedMediaVariantId={selectedMediaVariantId}
              dispatch={dispatch}
            />
          </div>

          <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-72">
            <StatusSidebar form={form} categories={categories} />
          </aside>
        </div>
      </form>

      <AlertDialog open={showDialog} onOpenChange={(open) => !open && cancelExit()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Có thay đổi chưa lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Tất cả thay đổi sẽ bị mất nếu bạn rời khỏi trang này. Bạn có chắc muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelExit}>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Rời khỏi trang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
