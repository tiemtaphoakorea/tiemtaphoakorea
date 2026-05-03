import { getProductBySlug } from "@workspace/database/services/product.server";
import type { Metadata } from "next";

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

  const title = `${product.name} | K-SMART`;
  const description = product.description || `Mua ${product.name} chính hãng tại K-SMART`;
  const productImage = product.variants?.[0]?.images?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(productImage && {
        images: [{ url: productImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(productImage && { images: [productImage] }),
    },
  };
}
