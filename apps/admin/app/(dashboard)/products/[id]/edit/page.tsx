"use client";

import { useQuery } from "@tanstack/react-query";
import { LOW_STOCK_DEFAULT_THRESHOLD } from "@workspace/shared/constants";
import type {
  AdminProductDetail,
  ProductFormCategory,
  ProductFormInitialData,
} from "@workspace/shared/types/product";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/products/product-form";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export default function EditProductPage() {
  "use no memo";
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.productEdit(id),
    queryFn: async () => {
      const [catData, productData] = await Promise.all([
        adminClient.getCategories(),
        adminClient.getProduct(id),
      ]);

      const product = productData.product as AdminProductDetail | undefined;
      const initialData: ProductFormInitialData | null = product
        ? {
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description || "",
            categoryId: product.categoryId || "",
            basePrice: parseFloat(product.basePrice || "0"),
            isActive: product.isActive ?? true,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: parseFloat(v.price),
              costPrice: parseFloat(v.costPrice || "0"),
              stockQuantity: v.stockQuantity ?? 0,
              lowStockThreshold:
                v.lowStockThreshold != null
                  ? Number(v.lowStockThreshold)
                  : LOW_STOCK_DEFAULT_THRESHOLD,
              images: v.images?.map((img) => img.imageUrl) ?? [],
            })),
          }
        : null;

      return {
        categories: (catData.flatCategories || []) as ProductFormCategory[],
        initialData,
      };
    },
    enabled: Boolean(id),
  });
  const categories = data?.categories || [];
  const initialData = data?.initialData ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (isError || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <p>Không tìm thấy sản phẩm.</p>
      </div>
    );
  }

  return <ProductForm categories={categories} initialData={initialData} mode="edit" />;
}
