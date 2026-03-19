"use client";

import type { ProductFormCategory } from "@repo/shared/types/product";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/products/product-form";
import { adminClient } from "@/services/admin.client";

export default function NewProductPage() {
  "use no memo";
  const [categories, setCategories] = useState<ProductFormCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategories() {
      try {
        const data = await adminClient.getCategories();
        if (!cancelled && data.flatCategories) setCategories(data.flatCategories);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return <ProductForm categories={categories} mode="create" />;
}
