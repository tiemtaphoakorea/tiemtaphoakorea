export const dynamic = "force-dynamic";

import {
  getProductBySlug,
  getProductsForListing,
} from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductClientContainer } from "@/components/products/detail/product-client-container";
import { ProductRelatedProducts } from "@/components/products/detail/product-related-products";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="bg-background min-h-screen pb-24">
      <main className="container mx-auto px-4 py-4">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

export { generateMetadata } from "./metadata";

async function ProductDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();

  const product = await getProductBySlug(slug);
  if (!product || product.isActive !== true) notFound();

  const relatedListing = product.category?.slug
    ? await getProductsForListing({
        categorySlug: product.category.slug,
        limit: 6,
      })
    : { products: [], total: 0 };

  const relatedProducts = relatedListing.products.filter((p) => p.slug !== slug).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb className="py-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={PUBLIC_ROUTES.HOME}>Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={PUBLIC_ROUTES.PRODUCTS}>Sản phẩm</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {product.category?.slug && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY(product.category.slug)}>
                    {product.category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[280px] truncate font-semibold">
              {product.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProductClientContainer product={product} />

      <ProductRelatedProducts products={relatedProducts} categorySlug={product.category?.slug} />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
