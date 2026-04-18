import { sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { products, productVariants, variantImages } from "../schema/products";

export type CategoryCardItem = {
  id: string;
  type: string;
  categoryId: string | null;
  imageUrl: string;
  title: string;
  countText: string | null;
  linkUrl: string;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
};

/**
 * Auto-generate category cards from the top N categories by product count.
 * Requires no admin configuration — data is always live from the DB.
 */
export async function getTopCategoryCards(limit = 4): Promise<CategoryCardItem[]> {
  type Row = {
    id: string;
    name: string;
    slug: string;
    product_count: number;
    image_url: string | null;
  };

  const rows = (await db.execute(sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      COUNT(p.id)::int AS product_count,
      (
        SELECT vi.image_url
        FROM ${products} p2
        JOIN ${productVariants} pv ON pv.product_id = p2.id
        JOIN ${variantImages} vi ON vi.variant_id = pv.id
        WHERE p2.category_id = c.id AND p2.is_active = true
        ORDER BY vi.is_primary DESC, vi.display_order ASC
        LIMIT 1
      ) AS image_url
    FROM ${categories} c
    JOIN ${products} p ON p.category_id = c.id AND p.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.slug
    ORDER BY product_count DESC
    LIMIT ${limit}
  `)) as Row[];

  return rows.map((row) => ({
    id: row.id,
    type: "category",
    categoryId: row.id,
    isActive: true,
    sortOrder: 0,
    imageUrl: row.image_url ?? "",
    title: row.name,
    countText: `${row.product_count} sản phẩm`,
    linkUrl: `/products?category=${encodeURIComponent(row.slug)}`,
    accentColor: null,
  }));
}
