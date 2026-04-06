"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LOW_STOCK_DEFAULT_THRESHOLD } from "@workspace/shared/constants";
import { type ProductFormValues, productSchema } from "@workspace/shared/schemas";
import type { ProductFormProps, ProductFormVariant } from "@workspace/shared/types/product";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import axios from "axios";
import { ArrowLeft, Loader2, Plus, RefreshCw, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImageUploader } from "@/components/image-uploader";
import { queryKeys } from "@/lib/query-keys";

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Attribute = { name: string; values: string[] };

type FormState = {
  apiError: string | null;
  apiPending: boolean;
  attributes: Attribute[];
  variants: ProductFormVariant[];
  selectedMediaVariantId: string;
};

type FormAction =
  | { type: "SET_API_ERROR"; payload: string | null }
  | { type: "SET_API_PENDING"; payload: boolean }
  | { type: "SET_VARIANTS"; payload: ProductFormVariant[] }
  | { type: "SET_ATTRIBUTES"; payload: Attribute[] }
  | { type: "UPDATE_ATTRIBUTE_VALUE"; index: number; valString: string }
  | { type: "SET_SELECTED_MEDIA_VARIANT"; payload: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_API_ERROR":
      return { ...state, apiError: action.payload };
    case "SET_API_PENDING":
      return { ...state, apiPending: action.payload };
    case "SET_VARIANTS":
      return { ...state, variants: action.payload };
    case "SET_ATTRIBUTES":
      return { ...state, attributes: action.payload };
    case "UPDATE_ATTRIBUTE_VALUE": {
      const newAttrs = [...state.attributes];
      newAttrs[action.index] = {
        ...newAttrs[action.index],
        values: action.valString
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return { ...state, attributes: newAttrs };
    }
    case "SET_SELECTED_MEDIA_VARIANT":
      return { ...state, selectedMediaVariantId: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type VariantGeneratorProps = {
  attributes: Attribute[];
  dispatch: React.Dispatch<FormAction>;
  onGenerate: () => void;
};

function VariantGenerator({ attributes, dispatch, onGenerate }: VariantGeneratorProps) {
  return (
    <Card className="border-none shadow-inner ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Bộ tạo biến thể tự động
        </CardTitle>
        <CardDescription>Nhập các thuộc tính để tạo nhanh biến thể.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase">
              Thuộc tính 1: {attributes[0].name}
            </Label>
            <Input
              placeholder="Ví dụ: Đỏ, Xanh..."
              onChange={(e) =>
                dispatch({ type: "UPDATE_ATTRIBUTE_VALUE", index: 0, valString: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase">
              Thuộc tính 2: {attributes[1].name}
            </Label>
            <Input
              placeholder="Ví dụ: S, M..."
              onChange={(e) =>
                dispatch({ type: "UPDATE_ATTRIBUTE_VALUE", index: 1, valString: e.target.value })
              }
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={onGenerate}
          className="mt-2 w-full gap-2 border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" /> Tạo danh sách biến thể
        </Button>
      </CardContent>
    </Card>
  );
}

type VariantsTableProps = {
  variants: ProductFormVariant[];
  basePrice: number;
  dispatch: React.Dispatch<FormAction>;
};

function VariantsTable({ variants, basePrice, dispatch }: VariantsTableProps) {
  return (
    <Card className="gap-0 overflow-hidden border-none py-0 shadow-lg ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-950">
        <CardTitle className="text-lg">Danh sách biến thể ({variants.length})</CardTitle>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() =>
            dispatch({
              type: "SET_VARIANTS",
              payload: [
                ...variants,
                {
                  id: `temp-${Date.now()}`,
                  name: "Mới",
                  sku: "",
                  price: basePrice,
                  costPrice: 0,
                  stockQuantity: 0,
                  lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
                  images: [],
                },
              ],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm thủ công
        </Button>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-auto p-0">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="min-w-[150px]">Tên biến thể</TableHead>
              <TableHead className="min-w-[120px] text-blue-600">Mã SKU</TableHead>
              <TableHead className="min-w-[100px]">Giá bán</TableHead>
              <TableHead className="min-w-[100px]">Giá vốn</TableHead>
              <TableHead className="min-w-[80px]">Tồn kho</TableHead>
              <TableHead
                className="min-w-[88px]"
                title="Cảnh báo sắp hết khi tồn kho ≤ giá trị này (theo biến thể)"
              >
                Ngưỡng cảnh báo
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, idx) => (
              <TableRow key={variant.id}>
                <TableCell className="font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                <TableCell>
                  <Input
                    value={variant.name}
                    onChange={(e) => {
                      const newV = [...variants];
                      newV[idx] = { ...newV[idx], name: e.target.value };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    className="h-8 border-transparent bg-transparent px-2 font-medium hover:border-slate-200 focus:border-slate-200"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={variant.sku}
                    placeholder="SKU-..."
                    onChange={(e) => {
                      const newV = [...variants];
                      newV[idx] = { ...newV[idx], sku: e.target.value };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    className="h-8 border-transparent bg-blue-50/50 px-2 font-mono text-blue-700 hover:border-blue-200 focus:border-blue-200"
                  />
                </TableCell>
                <TableCell>
                  <NumberInput
                    name={`variants.${idx}.price`}
                    data-testid={`variant-price-${idx}`}
                    aria-label="Giá bán biến thể"
                    value={variant.price}
                    onValueChange={(values) => {
                      const newV = [...variants];
                      newV[idx] = { ...newV[idx], price: Math.max(0, values.floatValue ?? 0) };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    className="h-8 border-transparent bg-transparent px-2 text-right font-mono hover:border-slate-200 focus:border-slate-200"
                  />
                </TableCell>
                <TableCell>
                  <NumberInput
                    name={`variants.${idx}.costPrice`}
                    data-testid={`variant-cost-${idx}`}
                    aria-label="Giá vốn biến thể"
                    value={variant.costPrice}
                    onValueChange={(values) => {
                      const newV = [...variants];
                      newV[idx] = {
                        ...newV[idx],
                        costPrice: Math.max(0, values.floatValue ?? 0),
                      };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    className="h-8 border-transparent bg-transparent px-2 text-right font-mono text-slate-500 hover:border-slate-200 focus:border-slate-200"
                  />
                </TableCell>
                <TableCell>
                  <NumberInput
                    name={`variants.${idx}.stockQuantity`}
                    data-testid={`variant-stock-${idx}`}
                    aria-label="Tồn kho biến thể"
                    decimalScale={0}
                    value={variant.stockQuantity}
                    onValueChange={(values) => {
                      const newV = [...variants];
                      newV[idx] = {
                        ...newV[idx],
                        stockQuantity: Math.max(0, values.floatValue ?? 0),
                      };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    onBlur={(e) => {
                      const raw = (e.target as HTMLInputElement).value ?? "";
                      const normalized = raw.replace(/\./g, "").replace(",", ".");
                      const parsed = Number.parseFloat(normalized) || 0;
                      if (parsed < 0) {
                        const newV = [...variants];
                        newV[idx] = { ...newV[idx], stockQuantity: 0 };
                        dispatch({ type: "SET_VARIANTS", payload: newV });
                      }
                    }}
                    className="h-8 border-transparent bg-transparent px-2 text-center font-mono font-bold hover:border-slate-200 focus:border-slate-200"
                  />
                </TableCell>
                <TableCell>
                  <NumberInput
                    name={`variants.${idx}.lowStockThreshold`}
                    data-testid={`variant-low-stock-threshold-${idx}`}
                    aria-label="Ngưỡng cảnh báo tồn kho biến thể"
                    decimalScale={0}
                    value={variant.lowStockThreshold}
                    onValueChange={(values) => {
                      const newV = [...variants];
                      newV[idx] = {
                        ...newV[idx],
                        lowStockThreshold: Math.max(0, values.floatValue ?? 0),
                      };
                      dispatch({ type: "SET_VARIANTS", payload: newV });
                    }}
                    className="h-8 border-transparent bg-transparent px-2 text-center font-mono hover:border-slate-200 focus:border-slate-200"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-500"
                    onClick={() => {
                      dispatch({
                        type: "SET_VARIANTS",
                        payload: variants.filter((_, i) => i !== idx),
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Submit Button Component
function SubmitButton({ mode, pending }: { mode: "create" | "edit"; pending: boolean }) {
  return (
    <Button
      type="submit"
      className="h-12 w-full text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {mode === "create" ? "Creating..." : "Saving..."}
        </span>
      ) : mode === "create" ? (
        "Tạo sản phẩm"
      ) : (
        "Lưu thay đổi"
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    variants: initialData?.variants || [
      {
        id: "default",
        name: "Default Variant",
        sku: "",
        price: 0,
        costPrice: 0,
        stockQuantity: 0,
        lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
        images: [],
      },
    ],
    selectedMediaVariantId: initialData?.variants?.[0]?.id || "default",
  } satisfies FormState);

  const { apiError, apiPending, attributes, variants } = formState;

  // Derive the resolved selected media variant id (guard against stale id)
  const selectedMediaVariantId = variants.some(
    (variant) => variant.id === formState.selectedMediaVariantId,
  )
    ? formState.selectedMediaVariantId
    : (variants[0]?.id ?? "default");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      categoryId: initialData?.categoryId ?? "",
      basePrice: initialData?.basePrice ?? 0,
      isActive: initialData?.isActive !== false,
    },
  });

  const basePrice = useWatch({ control: form.control, name: "basePrice" });

  const handleGenerateVariants = () => {
    const activeAttrs = attributes.filter((a) => a.values.length > 0 && a.name.trim() !== "");

    if (activeAttrs.length === 0) return;

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]]);
    };

    const combinations = cartesian(activeAttrs.map((a) => a.values));

    const newVariants: ProductFormVariant[] = combinations.map((combo, idx) => {
      const variantName = combo.join(" - ");
      const skuSuffix = combo.map((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-");
      const name = form.getValues("name");
      const autoSku = name
        ? `${name.substring(0, 6).toUpperCase()}-${skuSuffix}`
        : `SKU-${skuSuffix}`;

      return {
        id: `gen-${Date.now()}-${idx}`,
        name: variantName,
        sku: autoSku,
        price: basePrice,
        costPrice: 0,
        stockQuantity: 0,
        lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
        images: [],
      };
    });

    // If we only have the initial default variant (from create mode), replace it
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
        dispatch({
          type: "SET_API_ERROR",
          payload: `Biến thể ${i + 1}: Vui lòng nhập SKU.`,
        });
        return;
      }
      const price = Number(v.price);
      const costPrice = Number(v.costPrice ?? 0);
      const stock = Number(v.stockQuantity ?? 0);
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
      variants: finalVariants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        costPrice: Number(v.costPrice ?? 0),
        stockQuantity: Number(v.stockQuantity ?? 0),
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
        stockQuantity: Number(v.stockQuantity ?? 0),
        lowStockThreshold: Math.floor(Number(v.lowStockThreshold ?? LOW_STOCK_DEFAULT_THRESHOLD)),
        images: v.images ?? [],
      })),
    };
    let res;
    try {
      if (mode === "create") {
        res = await axios.post("/api/admin/products", createPayload);
      } else {
        if (!productId) {
          dispatch({ type: "SET_API_ERROR", payload: "Thiếu ID sản phẩm" });
          dispatch({ type: "SET_API_PENDING", payload: false });
          return;
        }
        res = await axios.put(`/api/admin/products/${productId}`, updatePayload);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error ??
        err?.message ??
        (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm");
      dispatch({ type: "SET_API_ERROR", payload: message });
      dispatch({ type: "SET_API_PENDING", payload: false });
      return;
    }

    if (res?.data?.success) {
      dispatch({ type: "SET_API_PENDING", payload: false });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all, exact: false });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.products.all,
        exact: false,
      });
      if (mode === "edit" && productId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.productEdit(productId) });
      }
      router.push("/products");
      return;
    }

    dispatch({
      type: "SET_API_ERROR",
      payload:
        res?.data?.error ||
        (mode === "create" ? "Không thể tạo sản phẩm" : "Không thể cập nhật sản phẩm"),
    });
    dispatch({ type: "SET_API_PENDING", payload: false });
  };

  const selectedMediaVariant = variants.find((v) => v.id === selectedMediaVariantId) || null;

  return (
    <div className="flex w-full flex-col gap-8 pb-20">
      {apiError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700"
        >
          {apiError}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {mode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
            </h1>
            {mode === "edit" && (
              <Badge variant="outline" className="mt-1">
                {initialData?.name}
              </Badge>
            )}
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Tạo sản phẩm và các biến thể của nó."
                : "Cập nhật thông tin và biến thể sản phẩm."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onValidSubmit)} className="flex items-start gap-8">
        <div className="w-full flex-1 space-y-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="mb-6 w-full justify-start gap-1 rounded-lg border border-border p-1">
              <TabsTrigger
                value="info"
                className="h-full flex-1 font-bold shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Thông tin chung
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="h-full flex-1 font-bold shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Biến thể & Giá
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="h-full flex-1 font-bold shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Hình ảnh
              </TabsTrigger>
            </TabsList>

            {/* Tab 2: Variants */}
            <TabsContent value="variants" className="space-y-6">
              {/* Generator Section */}
              <VariantGenerator
                attributes={attributes}
                dispatch={dispatch}
                onGenerate={handleGenerateVariants}
              />

              {/* Variants Table */}
              <VariantsTable variants={variants} basePrice={basePrice} dispatch={dispatch} />
            </TabsContent>

            {/* Tab 1: General Info */}
            <TabsContent value="info" className="space-y-6">
              <Card className="border-none shadow-lg ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
                <CardContent className="space-y-6 p-6">
                  <div className="grid gap-3">
                    <Label className="text-xs font-black tracking-wider text-slate-500 uppercase">
                      Tên sản phẩm *
                    </Label>
                    <Input
                      {...form.register("name")}
                      placeholder="Ví dụ: Áo Thun Premium Cotton"
                      className="h-12 text-lg font-bold"
                      aria-invalid={!!form.formState.errors.name}
                      required
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-3">
                      <Label className="text-xs font-black tracking-wider text-slate-500 uppercase">
                        Danh mục
                      </Label>
                      <Controller
                        name="categoryId"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value ?? ""} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {Array(cat.depth ?? 0)
                                    .fill("— ")
                                    .join("") + cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-xs font-black tracking-wider text-slate-500 uppercase">
                        Giá niêm yết (Base Price)
                      </Label>
                      <Controller
                        name="basePrice"
                        control={form.control}
                        render={({ field }) => (
                          <NumberInput
                            name={field.name}
                            value={field.value}
                            onValueChange={(values) => field.onChange(values.floatValue ?? 0)}
                            className="h-11 font-mono font-bold"
                            aria-invalid={!!form.formState.errors.basePrice}
                          />
                        )}
                      />
                      {form.formState.errors.basePrice && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.basePrice.message}
                        </p>
                      )}
                      <p className="text-[10px] font-medium text-slate-500">
                        Giá này sẽ được áp dụng làm mặc định cho các biến thể tạo mới.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label className="text-xs font-black tracking-wider text-slate-500 uppercase">
                      Mô tả sản phẩm
                    </Label>
                    <Textarea
                      {...form.register("description")}
                      placeholder="Thông tin chi tiết về sản phẩm..."
                      className="min-h-[150px] resize-none text-base"
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <Controller
                      name="isActive"
                      control={form.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label className="cursor-pointer font-bold">Hiển thị sản phẩm</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Media */}
            <TabsContent value="media">
              <Card className="min-h-[300px] border-none shadow-lg ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
                <CardHeader>
                  <CardTitle>Hình ảnh sản phẩm</CardTitle>
                  <CardDescription>
                    {selectedMediaVariant
                      ? `Chỉnh sửa hình ảnh cho biến thể: ${selectedMediaVariant.name}`
                      : "Chưa có biến thể nào"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {variants.length > 0 ? (
                    <div className="space-y-4">
                      <div className="max-w-sm space-y-2">
                        <Label className="text-xs font-black tracking-wider text-slate-500 uppercase">
                          Chọn biến thể
                        </Label>
                        <Select
                          value={selectedMediaVariantId}
                          onValueChange={(value) =>
                            dispatch({ type: "SET_SELECTED_MEDIA_VARIANT", payload: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn biến thể" />
                          </SelectTrigger>
                          <SelectContent>
                            {variants.map((variant) => (
                              <SelectItem key={variant.id} value={variant.id}>
                                {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ImageUploader
                        value={selectedMediaVariant?.images ?? []}
                        onChange={(urls) => {
                          dispatch({
                            type: "SET_VARIANTS",
                            payload: variants.map((variant) =>
                              variant.id === selectedMediaVariantId
                                ? { ...variant, images: urls }
                                : variant,
                            ),
                          });
                        }}
                        maxFiles={10}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Thêm biến thể để upload ảnh.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Actions */}
        <div className="sticky top-6 w-[300px] shrink-0 space-y-4">
          <Card className="border-none bg-white shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:bg-slate-950 dark:shadow-none dark:ring-slate-800">
            <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
              <CardTitle className="text-base">Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <SubmitButton mode={mode} pending={apiPending} />
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/products">Hủy bỏ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
