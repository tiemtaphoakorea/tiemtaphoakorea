"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductFormCategory } from "@workspace/shared/types/product";
import { ProductForm } from "@/components/admin/products/product-form";
import { adminClient } from "@/services/admin.client";

export default function NewProductPage() {
  "use no memo";
  const { data, isLoading } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => adminClient.getCategories(),
  });
  const categories = (data?.flatCategories || []) as ProductFormCategory[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return <ProductForm categories={categories} mode="create" />;
}
