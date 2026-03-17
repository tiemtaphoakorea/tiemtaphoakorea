import type { Metadata } from "next";
import { getProductBySlug } from "@/services/product.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.isActive !== true) {
    return {
      title: "Sản phẩm không tìm thấy | K-SMART",
    };
  }

  return {
    title: `${product.name} | K-SMART`,
    description: product.description || `Mua ${product.name} chính hãng tại K-SMART`,
  };
}
