import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import {
  type HomepageCollection,
  type HomepageCollectionType,
  homepageCollectionProducts,
  homepageCollections,
} from "../schema/homepage-collections";
import { products, productVariants, variantImages } from "../schema/products";
import { getBestSellers, getNewArrivals, type ProductListItem } from "./product.server";

export type { HomepageCollection, HomepageCollectionType };

export type RenderedCollection = {
  id: string;
  type: HomepageCollectionType;
  title: string;
  subtitle: string | null;
  iconKey: string | null;
  viewAllUrl: string | null;
  itemLimit: number;
  sortOrder: number;
  products: ProductListItem[];
};

const DEFAULT_DAYS_WINDOW = 30;

export async function getActiveHomepageCollections(): Promise<RenderedCollection[]> {
  const rows = await db
    .select()
    .from(homepageCollections)
    .where(eq(homepageCollections.isActive, true))
    .orderBy(asc(homepageCollections.sortOrder));

  const resolved = await Promise.all(
    rows.map(async (row): Promise<RenderedCollection> => {
      const resolvedProducts = await resolveProducts(row);
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.subtitle,
        iconKey: row.iconKey,
        viewAllUrl: row.viewAllUrl,
        itemLimit: row.itemLimit,
        sortOrder: row.sortOrder,
        products: resolvedProducts,
      };
    }),
  );

  // Filter collections that resolved 0 products — keep empty sections off homepage
  return resolved.filter((c) => c.products.length > 0);
}

async function resolveProducts(row: HomepageCollection): Promise<ProductListItem[]> {
  switch (row.type) {
    case "best_sellers":
      return getBestSellers(row.itemLimit);
    case "new_arrivals":
      return getNewArrivals(row.itemLimit, row.daysWindow ?? DEFAULT_DAYS_WINDOW);
    case "by_category":
      if (!row.categoryId) {
        console.warn(`Collection ${row.id} (by_category) has no categoryId — skipping`);
        return [];
      }
      return getProductsByCategory(row.categoryId, row.itemLimit);
    case "manual":
      return getManualCollectionProducts(row.id, row.itemLimit);
  }
}

async function getProductsByCategory(
  categoryId: string,
  limit: number,
): Promise<ProductListItem[]> {
  return await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      categoryName: categories.name,
      basePrice: products.basePrice,
      totalStock: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
      totalOnHand: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
      totalReserved: sql<number>`coalesce(sum(${productVariants.reserved}), 0)`,
      totalAvailable: sql<number>`coalesce(sum(${productVariants.onHand} - ${productVariants.reserved}), 0)`,
      minPrice: sql<number>`min(${productVariants.price})`,
      maxPrice: sql<number>`max(${productVariants.price})`,
      thumbnail: sql<string>`coalesce((
        select ${variantImages.imageUrl}
        from ${variantImages}
        join ${productVariants} as pv_img on ${variantImages.variantId} = pv_img.id
        where pv_img.product_id = ${products.id}
        order by ${variantImages.isPrimary} desc, ${variantImages.displayOrder} asc
        limit 1
      ), '')`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId)))
    .groupBy(products.id, categories.name)
    .orderBy(sql`${products.createdAt} desc`)
    .limit(limit);
}

async function getManualCollectionProducts(
  collectionId: string,
  limit: number,
): Promise<ProductListItem[]> {
  return await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      categoryName: categories.name,
      basePrice: products.basePrice,
      totalStock: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
      totalOnHand: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
      totalReserved: sql<number>`coalesce(sum(${productVariants.reserved}), 0)`,
      totalAvailable: sql<number>`coalesce(sum(${productVariants.onHand} - ${productVariants.reserved}), 0)`,
      minPrice: sql<number>`min(${productVariants.price})`,
      maxPrice: sql<number>`max(${productVariants.price})`,
      thumbnail: sql<string>`coalesce((
        select ${variantImages.imageUrl}
        from ${variantImages}
        join ${productVariants} as pv_img on ${variantImages.variantId} = pv_img.id
        where pv_img.product_id = ${products.id}
        order by ${variantImages.isPrimary} desc, ${variantImages.displayOrder} asc
        limit 1
      ), '')`,
    })
    .from(homepageCollectionProducts)
    .innerJoin(products, eq(homepageCollectionProducts.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(
      and(eq(homepageCollectionProducts.collectionId, collectionId), eq(products.isActive, true)),
    )
    .groupBy(products.id, categories.name, homepageCollectionProducts.sortOrder)
    .orderBy(asc(homepageCollectionProducts.sortOrder))
    .limit(limit);
}

// ── Admin types ─────────────────────────────────────────────────────────────

export type CreateCollectionData = {
  type: HomepageCollectionType;
  title: string;
  subtitle?: string | null;
  iconKey?: string | null;
  viewAllUrl?: string | null;
  itemLimit: number;
  isActive: boolean;
  sortOrder: number;
  categoryId?: string | null;
  daysWindow?: number | null;
};

export type UpdateCollectionData = Partial<CreateCollectionData>;

export type AdminCollectionRow = HomepageCollection & {
  productCount: number;
};

// ── Admin CRUD ───────────────────────────────────────────────────────────────

export async function listCollectionsForAdmin(): Promise<AdminCollectionRow[]> {
  type Row = {
    id: string;
    type: HomepageCollectionType;
    title: string;
    subtitle: string | null;
    icon_key: string | null;
    view_all_url: string | null;
    item_limit: number;
    is_active: boolean;
    sort_order: number;
    category_id: string | null;
    days_window: number | null;
    created_at: Date;
    updated_at: Date;
    product_count: number;
  };

  const rows = (await db.execute(sql`
    SELECT hc.*, COALESCE(pc.cnt, 0)::int AS product_count
    FROM ${homepageCollections} hc
    LEFT JOIN (
      SELECT collection_id, COUNT(*)::int AS cnt
      FROM ${homepageCollectionProducts}
      GROUP BY collection_id
    ) pc ON pc.collection_id = hc.id
    ORDER BY hc.sort_order ASC
  `)) as Row[];

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    iconKey: r.icon_key,
    viewAllUrl: r.view_all_url,
    itemLimit: Number(r.item_limit),
    isActive: r.is_active,
    sortOrder: Number(r.sort_order),
    categoryId: r.category_id,
    daysWindow: r.days_window != null ? Number(r.days_window) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    productCount: Number(r.product_count),
  }));
}

export async function getCollection(id: string) {
  const [row] = await db
    .select()
    .from(homepageCollections)
    .where(eq(homepageCollections.id, id))
    .limit(1);
  if (!row) return null;

  const productRows = await db
    .select({
      productId: homepageCollectionProducts.productId,
      sortOrder: homepageCollectionProducts.sortOrder,
    })
    .from(homepageCollectionProducts)
    .where(eq(homepageCollectionProducts.collectionId, id))
    .orderBy(asc(homepageCollectionProducts.sortOrder));

  return { ...row, products: productRows };
}

export async function createCollection(data: CreateCollectionData) {
  const [row] = await db
    .insert(homepageCollections)
    .values({
      type: data.type,
      title: data.title,
      subtitle: data.subtitle ?? null,
      iconKey: data.iconKey ?? null,
      viewAllUrl: data.viewAllUrl ?? null,
      itemLimit: data.itemLimit,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      categoryId: data.categoryId ?? null,
      daysWindow: data.daysWindow ?? null,
    })
    .returning();
  return row;
}

export async function updateCollection(id: string, data: UpdateCollectionData) {
  const [row] = await db
    .update(homepageCollections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(homepageCollections.id, id))
    .returning();
  return row;
}

export async function deleteCollection(id: string) {
  await db.delete(homepageCollections).where(eq(homepageCollections.id, id));
}

export async function reorderCollections(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(homepageCollections)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(homepageCollections.id, id)),
    ),
  );
}

export async function setCollectionProducts(collectionId: string, productIds: string[]) {
  await db
    .delete(homepageCollectionProducts)
    .where(eq(homepageCollectionProducts.collectionId, collectionId));

  if (productIds.length === 0) return;

  await db.insert(homepageCollectionProducts).values(
    productIds.map((productId, index) => ({
      collectionId,
      productId,
      sortOrder: index,
    })),
  );
}
