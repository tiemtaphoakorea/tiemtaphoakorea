import { tool } from "@openai/agents";
import { db } from "@repo/database/db";
import { categories, products, productVariants } from "@repo/database/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

const DEFAULT_PRODUCT_SEARCH_LIMIT = 5;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export const searchProductsTool = tool({
  name: "search_products",
  description:
    "Tìm danh sách sản phẩm đang bán theo tên, slug hoặc SKU. Dùng khi khách hỏi tìm sản phẩm hoặc so sánh lựa chọn.",
  parameters: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).default(DEFAULT_PRODUCT_SEARCH_LIMIT),
  }),
  execute: async ({ query, limit }) => {
    const keyword = query.trim();
    if (!keyword) {
      return "Khong tim thay san pham phu hop.";
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        categoryName: categories.name,
        minPrice: sql<string>`min(${productVariants.price})`,
        maxPrice: sql<string>`max(${productVariants.price})`,
        totalStock: sql<number>`coalesce(sum(${productVariants.stockQuantity}), 0)::int`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${keyword}%`),
            ilike(products.slug, `%${keyword}%`),
            ilike(productVariants.sku, `%${keyword}%`),
          ),
        ),
      )
      .groupBy(products.id, categories.name)
      .orderBy(desc(products.updatedAt))
      .limit(limit);

    if (rows.length === 0) {
      return "Khong tim thay san pham phu hop.";
    }

    return JSON.stringify(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.categoryName,
        minPrice: toNumber(row.minPrice),
        maxPrice: toNumber(row.maxPrice),
        totalStock: toNumber(row.totalStock),
      })),
    );
  },
});
