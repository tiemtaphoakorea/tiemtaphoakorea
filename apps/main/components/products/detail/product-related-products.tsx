import type { ProductListItem } from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";
import { CategoryProductCard } from "@/components/category/category-product-card";

interface ProductRelatedProductsProps {
  products: ProductListItem[];
  categorySlug?: string;
}

export function ProductRelatedProducts({ products, categorySlug }: ProductRelatedProductsProps) {
  if (products.length === 0) return null;

  const seeMoreHref = categorySlug
    ? PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(categorySlug)
    : PUBLIC_ROUTES.PRODUCTS;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Sản phẩm liên quan
        </h2>
        <Link
          href={seeMoreHref}
          className="text-sm font-semibold text-primary transition-colors hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {products.map((p) => (
          <CategoryProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
