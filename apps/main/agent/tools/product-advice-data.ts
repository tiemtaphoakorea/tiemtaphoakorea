import { tool } from "@openai/agents";
import { db } from "@workspace/database/db";
import { categories, products, productVariants } from "@workspace/database/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export const getProductAdviceDataTool = tool({
  name: "get_product_advice_data",
  description:
    "Lay thong tin chi tiet cua 1 san pham de tu van: bien the, SKU, gia ban, ton kho. Dung sau khi da co productId/slug/SKU.",
  parameters: z.object({
    productId: z.string().uuid().nullable(),
    slug: z.string().min(1).nullable(),
    sku: z.string().min(1).nullable(),
    name: z.string().min(1).nullable(),
  }),
  execute: async ({ productId, slug, sku, name }) => {
    let resolvedProductId = productId ?? null;

    if (!resolvedProductId && !slug && !sku && !name) {
      return "Phai cung cap productId, slug, sku hoac name.";
    }

    if (!resolvedProductId && sku) {
      const variantMatch = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(and(eq(products.isActive, true), ilike(productVariants.sku, sku.trim())))
        .orderBy(desc(products.updatedAt))
        .limit(1);
      resolvedProductId = variantMatch[0]?.productId ?? null;
    }

    if (!resolvedProductId && slug) {
      const productMatch = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.isActive, true), ilike(products.slug, slug.trim())))
        .limit(1);
      resolvedProductId = productMatch[0]?.id ?? null;
    }

    if (!resolvedProductId && name) {
      const productMatch = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.isActive, true), ilike(products.name, `%${name.trim()}%`)))
        .orderBy(desc(products.updatedAt))
        .limit(1);
      resolvedProductId = productMatch[0]?.id ?? null;
    }

    if (!resolvedProductId) {
      return "Khong tim thay san pham.";
    }

    const productInfo = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, resolvedProductId), eq(products.isActive, true)))
      .limit(1);

    if (productInfo.length === 0) {
      return "Khong tim thay san pham.";
    }

    const variants = await db
      .select({
        id: productVariants.id,
        name: productVariants.name,
        sku: productVariants.sku,
        price: productVariants.price,
        stockQuantity: productVariants.stockQuantity,
      })
      .from(productVariants)
      .where(
        and(eq(productVariants.productId, resolvedProductId), eq(productVariants.isActive, true)),
      )
      .orderBy(desc(productVariants.stockQuantity))
      .limit(20);

    return JSON.stringify({
      product: {
        id: productInfo[0].id,
        name: productInfo[0].name,
        slug: productInfo[0].slug,
        description: productInfo[0].description,
        category: productInfo[0].categoryName,
      },
      variants: variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: toNumber(variant.price),
        stockQuantity: variant.stockQuantity ?? 0,
        inStock: (variant.stockQuantity ?? 0) > 0,
      })),
    });
  },
});
