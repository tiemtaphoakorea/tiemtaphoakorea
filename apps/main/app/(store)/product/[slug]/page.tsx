export const dynamic = "force-dynamic";

import { getProductBySlug } from "@workspace/database/services/product.server";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductClientContainer } from "@/components/products/detail/product-client-container";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

// generateMetadata is re-exported from ./metadata
export { generateMetadata } from "./metadata";

async function ProductDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) notFound();

  const product = await getProductBySlug(slug);
  if (!product || product.isActive !== true) {
    notFound();
  }

  return (
    <>
      <nav className="text-muted-foreground mb-8 flex items-center gap-2 text-sm">
        <Link href={PUBLIC_ROUTES.HOME} className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`${PUBLIC_ROUTES.PRODUCTS}?category=${product.category?.slug}`}
          className="hover:text-primary cursor-pointer transition-colors"
        >
          {product.category?.name || "Sản phẩm"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-primary max-w-[200px] truncate font-bold">{product.name}</span>
      </nav>

      <ProductClientContainer product={product} />
    </>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
