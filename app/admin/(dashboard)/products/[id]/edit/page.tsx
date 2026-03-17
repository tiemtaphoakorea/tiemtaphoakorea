"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/products/product-form";
import { adminClient } from "@/services/admin.client";
import type {
  AdminProductDetail,
  ProductFormCategory,
  ProductFormInitialData,
} from "@/types/product";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<ProductFormCategory[]>([]);
  const [initialData, setInitialData] = useState<ProductFormInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchData() {
      try {
        const [catData, productData] = await Promise.all([
          adminClient.getCategories(),
          adminClient.getProduct(id),
        ]);

        if (catData.flatCategories && !cancelled) {
          setCategories(catData.flatCategories);
        }

        const product = productData.product as AdminProductDetail;
        if (!product) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!cancelled) {
          setInitialData({
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
              images: v.images?.map((img) => img.imageUrl) ?? [],
            })),
          });
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (notFound || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <p>Không tìm thấy sản phẩm.</p>
      </div>
    );
  }

  return <ProductForm categories={categories} initialData={initialData} mode="edit" />;
}
