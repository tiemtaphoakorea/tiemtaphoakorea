import {
  FEATURED_PRODUCTS_LIMIT_DEFAULT,
  PRODUCT_SORT,
  VARIANT_ID_PREFIX,
} from "@workspace/shared/constants";
import { BusinessError } from "@workspace/shared/http-status";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, desc, eq, gte, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { orderItems } from "../schema/orders";
import { costPriceHistory, products, productVariants, variantImages } from "../schema/products";

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type VariantImage = typeof variantImages.$inferSelect;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean | null;
  categoryName: string | null;
  basePrice: string | null;
  totalStock: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  minPrice: number;
  maxPrice: number;
  thumbnail: string;
  skus?: string | null;
  minLowStockThreshold?: number | null;
};

export type CreateProductData = {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | null;
  basePrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  variants: {
    name: string;
    sku: string;
    price: number;
    costPrice?: number;
    onHand?: number;
    lowStockThreshold?: number;
    images?: string[]; // Array of image URLs
  }[];
};

export type UpdateProductData = Omit<CreateProductData, "variants"> & {
  variants: Array<Partial<CreateProductData["variants"][number]> & { id?: string }>;
};

// ... existing types ...

/**
 * Fetch products list with aggregated data (Category name, Total Stock, Price Range)
 */
export async function getProducts({
  search,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
  stockStatus,
}: {
  search?: string;
  page?: number;
  limit?: number;
  stockStatus?: string;
} = {}) {
  const offset = (page - 1) * limit;
  const stockThresholdExpr = sql`coalesce(min(${productVariants.lowStockThreshold}), 5)`;
  const totalOnHandExpr = sql`coalesce(sum(${productVariants.onHand}), 0)`;
  const totalReservedExpr = sql`coalesce(sum(${productVariants.reserved}), 0)`;
  const totalAvailableExpr = sql`coalesce(sum(${productVariants.onHand} - ${productVariants.reserved}), 0)`;

  const baseWhere = and(
    eq(products.isActive, true),
    search
      ? or(
          ilike(products.name, `%${search}%`),
          ilike(products.slug, `%${search}%`),
          ilike(productVariants.sku, `%${search}%`),
        )
      : undefined,
  );

  // Count must use same filters as data query (including stockStatus HAVING)
  let total: number;
  if (stockStatus === "low_stock" || stockStatus === "out_of_stock") {
    const filteredSubquery = db
      .select({ id: products.id })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(baseWhere)
      .groupBy(products.id, categories.name);
    if (stockStatus === "low_stock") {
      filteredSubquery.having(
        sql`${totalAvailableExpr} > 0 AND ${totalAvailableExpr} <= ${stockThresholdExpr}`,
      );
    } else {
      filteredSubquery.having(sql`${totalAvailableExpr} <= 0`);
    }
    const countRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(filteredSubquery.as("filtered"));
    total = Number(countRows[0]?.count ?? 0);
  } else {
    const [totalResult] = await db
      .select({ count: sql<number>`count(distinct ${products.id})` })
      .from(products)
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(baseWhere);
    total = Number(totalResult?.count || 0);
  }

  // Main data query
  const query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      categoryName: categories.name,
      basePrice: products.basePrice,
      totalStock: totalOnHandExpr,
      totalOnHand: totalOnHandExpr,
      totalReserved: totalReservedExpr,
      totalAvailable: totalAvailableExpr,
      minPrice: sql<number>`min(${productVariants.price})`,
      maxPrice: sql<number>`max(${productVariants.price})`,
      minLowStockThreshold: stockThresholdExpr,
      skus: sql<string>`string_agg(distinct ${productVariants.sku}, ', ')`,
      thumbnail: sql<string>`(
        select ${variantImages.imageUrl}
        from ${variantImages}
        join ${productVariants} as pv_img on ${variantImages.variantId} = pv_img.id
        where pv_img.product_id = ${products.id}
        order by ${variantImages.isPrimary} desc, ${variantImages.displayOrder} asc
        limit 1
      )`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(baseWhere)
    .groupBy(products.id, categories.name)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  // Apply HAVING clause for stock status if requested
  if (stockStatus === "low_stock") {
    query.having(sql`${totalAvailableExpr} > 0 AND ${totalAvailableExpr} <= ${stockThresholdExpr}`);
  } else if (stockStatus === "out_of_stock") {
    query.having(sql`${totalAvailableExpr} <= 0`);
  }

  const results = await query;

  return {
    data: results,
    metadata: calculateMetadata(total, page, limit),
  };
}

/**
 * Get single product with full details (Variants + Images)
 */
export async function getProductById(id: string) {
  const result = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: true,
      variants: {
        with: {
          images: true,
        },
        orderBy: (variants: typeof productVariants, { asc }) => [asc(variants.id)], // Or display order if field existed
      },
    },
  });
  return result;
}

/**
 * Transactional Product Creation
 * Creates Product -> Variants -> Images in one go.
 *
 * All operations happen within a single transaction, ensuring data consistency.
 * The product with all variants and images is queried within the same transaction
 * to guarantee read-your-writes consistency.
 */
export async function createProduct(data: CreateProductData) {
  return await db.transaction(async (tx) => {
    const variantSkus = (data.variants || [])
      .map((variant) => variant.sku?.trim())
      .filter((sku): sku is string => Boolean(sku));

    if (variantSkus.length > 0) {
      const uniqueSkus = new Set<string>();
      for (const sku of variantSkus) {
        if (uniqueSkus.has(sku)) {
          throw new Error(`SKU "${sku}" đã tồn tại`);
        }
        uniqueSkus.add(sku);
      }

      const existingSkus = await tx
        .select({ sku: productVariants.sku })
        .from(productVariants)
        .where(inArray(productVariants.sku, variantSkus));

      if (existingSkus.length > 0) {
        throw new Error(`SKU "${existingSkus[0].sku}" đã tồn tại`);
      }
    }

    // 1. Create Product
    const [newProduct] = await tx
      .insert(products)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: data.basePrice?.toString() || "0",
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
      })
      .returning();

    // 2. Create Variants
    const createdVariants: Array<typeof productVariants.$inferSelect> = [];

    if (data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        const onHand = variant.onHand ?? variant.onHand ?? 0;
        if (onHand < 0) {
          throw new Error("Quantity cannot be negative");
        }
        const [newVariant] = await tx
          .insert(productVariants)
          .values({
            productId: newProduct.id,
            name: variant.name,
            sku: variant.sku,
            price: variant.price.toString(),
            costPrice: variant.costPrice?.toString() || "0",
            onHand,
            reserved: 0,
            lowStockThreshold: variant.lowStockThreshold,
          })
          .returning();

        createdVariants.push(newVariant);

        // 3. Create Variant Images
        if (variant.images && variant.images.length > 0) {
          await tx.insert(variantImages).values(
            variant.images.map((url, index) => ({
              variantId: newVariant.id,
              imageUrl: url,
              displayOrder: index,
              isPrimary: index === 0,
            })),
          );
        }
      }
    }

    // 4. Query the complete product within the SAME transaction
    // This guarantees read-your-writes consistency - no need for external re-fetch
    const fullProduct = await tx.query.products.findFirst({
      where: (table: typeof products, { eq }) => eq(table.id, newProduct.id),
      with: {
        category: true,
        variants: {
          with: {
            images: true,
          },
          orderBy: (variants: typeof productVariants, { asc }) => [asc(variants.id)],
        },
      },
    });

    // CRITICAL: Always ensure variants are populated
    // If query returned product but no variants, use the created variants
    if (
      fullProduct &&
      (!fullProduct.variants || fullProduct.variants.length === 0) &&
      createdVariants.length > 0
    ) {
      return {
        ...fullProduct,
        variants: createdVariants.map((v) => ({ ...v, images: [] })),
      };
    }

    // Return the full product with all relations
    if (fullProduct) {
      return fullProduct;
    }

    // Fallback: construct response from created data
    return {
      ...newProduct,
      category: null,
      variants: createdVariants.map((v) => ({ ...v, images: [] })),
    };
  });
}

/**
 * Delete product (Cascades to variants/images due to DB definition).
 * Throws if any variant is referenced by order history — deactivate instead.
 */
export async function deleteProduct(id: string) {
  const variantIds = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, id));

  if (variantIds.length > 0) {
    const ids = variantIds.map((v) => v.id);
    const referenced = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(inArray(orderItems.variantId, ids))
      .limit(1);

    if (referenced.length > 0) {
      throw new BusinessError(
        "Không thể xóa sản phẩm đã có trong lịch sử đơn hàng. Hãy vô hiệu hóa sản phẩm thay thế.",
      );
    }
  }

  await db.delete(products).where(eq(products.id, id));
  return true;
}

/**
 * Generate Unique Slug
 */
export async function generateProductSlug(name: string, excludeId?: string) {
  let slug = (name || "product")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!slug) slug = "product";

  let isUnique = false;
  let counter = 0;
  const originalSlug = slug;

  while (!isUnique) {
    if (counter > 0) {
      slug = `${originalSlug}-${counter}`;
    }

    const query = db.select({ id: products.id }).from(products).where(eq(products.slug, slug));

    const existing = await query;
    const match = existing[0];

    if (!match || (excludeId && match.id === excludeId)) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  return slug;
}

/**
 * Get product by Slug
 */
export async function getProductBySlug(slug: string) {
  const result = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      variants: {
        with: {
          images: true,
        },
        orderBy: (variants: typeof productVariants, { asc }) => [asc(variants.id)],
      },
    },
  });
  return result;
}

/**
 * Get products for public listing with filters
 */
export async function getProductsForListing(params: {
  search?: string;
  categorySlug?: string;
  sort?: (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT];
  page?: number;
  limit?: number;
}) {
  const { search, categorySlug, sort = PRODUCT_SORT.LATEST, page = 1, limit = 12 } = params;

  // Resolve category filter: include the matched category AND all its descendants
  let categoryIdFilter: ReturnType<typeof inArray> | undefined;
  if (categorySlug) {
    const allCats = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories);
    const root = allCats.find((c) => c.slug === categorySlug);
    console.log(
      "[getProductsForListing] categorySlug:",
      categorySlug,
      "root:",
      root?.id,
      "allCats slugs:",
      allCats.map((c) => c.slug),
    );
    if (!root) {
      return { products: [], total: 0 };
    }
    const ids: string[] = [];
    const queue = [root.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      ids.push(id);
      for (const c of allCats) {
        if (c.parentId === id) queue.push(c.id);
      }
    }
    console.log("[getProductsForListing] resolved category ids:", ids);
    categoryIdFilter = inArray(products.categoryId, ids);
  }

  let orderBy: SQL | ReturnType<typeof desc> = desc(products.createdAt);

  if (sort === PRODUCT_SORT.PRICE_ASC) {
    orderBy = sql`min(${productVariants.price}) asc`;
  } else if (sort === PRODUCT_SORT.PRICE_DESC) {
    orderBy = sql`min(${productVariants.price}) desc`;
  }

  const filters = and(
    eq(products.isActive, true),
    search
      ? or(ilike(products.name, `%${search}%`), ilike(products.slug, `%${search}%`))
      : undefined,
    categoryIdFilter,
  );

  const query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      isActive: products.isActive,
      categoryName: categories.name,
      basePrice: products.basePrice,
      totalStock: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
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
    .where(filters)
    .groupBy(products.id, categories.name)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const countQuery = db
    .select({
      count: sql<number>`count(distinct ${products.id})`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(filters);

  const [productsList, countResult] = await Promise.all([query, countQuery]);

  return {
    products: productsList,
    total: Number(countResult[0]?.count || 0),
  };
}

const PRODUCT_CARD_SELECT = (productsTable: typeof products) => ({
  id: productsTable.id,
  name: productsTable.name,
  slug: productsTable.slug,
  description: productsTable.description,
  isActive: productsTable.isActive,
  isFeatured: productsTable.isFeatured,
  categoryName: categories.name,
  basePrice: productsTable.basePrice,
  totalStock: sql<number>`coalesce(sum(${productVariants.onHand}), 0)`,
  minPrice: sql<number>`min(${productVariants.price})`,
  maxPrice: sql<number>`max(${productVariants.price})`,
  thumbnail: sql<string>`coalesce((
    select ${variantImages.imageUrl}
    from ${variantImages}
    join ${productVariants} as pv_img on ${variantImages.variantId} = pv_img.id
    where pv_img.product_id = ${productsTable.id}
    order by ${variantImages.isPrimary} desc, ${variantImages.displayOrder} asc
    limit 1
  ), '')`,
});

/**
 * Get admin-pinned "Bán chạy" products (isFeatured = true)
 */
export async function getFeaturedProducts(limit = FEATURED_PRODUCTS_LIMIT_DEFAULT) {
  return await db
    .select(PRODUCT_CARD_SELECT(products))
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .groupBy(products.id, categories.name)
    .orderBy(desc(products.updatedAt))
    .limit(limit);
}

/**
 * Get "Hàng mới" — products created within the last N days (default 30)
 */
export async function getNewArrivals(limit = FEATURED_PRODUCTS_LIMIT_DEFAULT, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await db
    .select(PRODUCT_CARD_SELECT(products))
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .where(and(eq(products.isActive, true), gte(products.createdAt, since)))
    .groupBy(products.id, categories.name)
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

/**
 * Get best-selling products by total units sold across all orders.
 */
export async function getBestSellers(limit = FEATURED_PRODUCTS_LIMIT_DEFAULT) {
  return await db
    .select({
      ...PRODUCT_CARD_SELECT(products),
      // Override totalStock with a correlated subquery to avoid inflation from orderItems join
      totalStock: sql<number>`coalesce((
        select sum(pv2.on_hand)
        from ${productVariants} as pv2
        where pv2.product_id = ${products.id}
      ), 0)`,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(products.id, productVariants.productId))
    .leftJoin(orderItems, eq(productVariants.id, orderItems.variantId))
    .where(eq(products.isActive, true))
    .groupBy(products.id, categories.name)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`))
    .limit(limit);
}

/**
 * Get products with full variants for Admin/Order creation
 */
export async function getProductsWithVariants() {
  const productsWithVariants = await db.query.products.findMany({
    with: {
      category: true,
      variants: {
        with: {
          images: true,
        },
      },
    },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
  return productsWithVariants;
}

/**
 * Update individual product with transaction
 */
export async function updateProduct(id: string, data: UpdateProductData) {
  return await db.transaction(async (tx) => {
    // 1. Update Product
    await tx
      .update(products)
      .set({
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        basePrice: data.basePrice?.toString() || "0",
        isActive: data.isActive ?? true,
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    const existingVariants = await tx.query.productVariants.findMany({
      where: eq(productVariants.productId, id),
    });
    const existingMap = new Map<string, typeof productVariants.$inferSelect>(
      existingVariants.map((v) => [v.id, v]),
    );

    // 2. Handle Variants
    for (const v of data.variants) {
      const incomingVariantId = "id" in v ? (v.id as string | undefined) : undefined;
      const hasPersistentVariantId =
        typeof incomingVariantId === "string" &&
        !incomingVariantId.startsWith(VARIANT_ID_PREFIX.GENERATED) &&
        !incomingVariantId.startsWith(VARIANT_ID_PREFIX.TEMP);
      let currentVariantId = hasPersistentVariantId ? incomingVariantId : undefined;
      const existingVariant = currentVariantId ? existingMap.get(currentVariantId) : undefined;

      let previousVariant = existingVariant
        ? existingVariant
        : currentVariantId
          ? await tx.query.productVariants.findFirst({
              where: eq(productVariants.id, currentVariantId),
            })
          : undefined;

      if (!previousVariant && currentVariantId) {
        const [fallbackVariant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, currentVariantId))
          .limit(1);
        if (fallbackVariant) {
          previousVariant = fallbackVariant as typeof productVariants.$inferSelect;
        }
      }

      const resolvedVariant = {
        productId: id,
        name:
          v.name ??
          previousVariant?.name ??
          (incomingVariantId ? `Variant ${incomingVariantId.slice(0, 6)}` : "Variant"),
        sku:
          v.sku ??
          previousVariant?.sku ??
          (incomingVariantId ? `GEN-${incomingVariantId.slice(0, 8)}` : `GEN-${Date.now()}`),
        price: (v.price ?? Number(previousVariant?.price ?? 0)) as number,
        costPrice: (v.costPrice ?? Number(previousVariant?.costPrice ?? 0)) as number,
        onHand: (v.onHand ?? v.onHand ?? previousVariant?.onHand ?? 0) as number,
        lowStockThreshold: v.lowStockThreshold ?? previousVariant?.lowStockThreshold,
        isActive: true,
        updatedAt: new Date(),
      };

      if ((resolvedVariant.onHand || 0) < 0) {
        throw new Error("Quantity cannot be negative");
      }

      const shouldInsertHistory =
        v.costPrice !== undefined &&
        previousVariant &&
        Number(previousVariant.costPrice || 0) !== Number(resolvedVariant.costPrice);

      // Check if ID exists and is a real UUID (not temp/gen)
      if (
        currentVariantId &&
        !currentVariantId.startsWith(VARIANT_ID_PREFIX.GENERATED) &&
        !currentVariantId.startsWith(VARIANT_ID_PREFIX.TEMP)
      ) {
        if (shouldInsertHistory) {
          await tx.insert(costPriceHistory).values({
            variantId: currentVariantId,
            costPrice: (previousVariant.costPrice || "0").toString(),
            effectiveDate: new Date(),
          });
        }

        // Upsert by ID to avoid missing-variant gaps
        await tx
          .insert(productVariants)
          .values({
            id: currentVariantId,
            ...resolvedVariant,
            price: resolvedVariant.price.toString(),
            costPrice: resolvedVariant.costPrice.toString(),
          })
          .onConflictDoUpdate({
            target: productVariants.id,
            set: {
              ...resolvedVariant,
              price: resolvedVariant.price.toString(),
              costPrice: resolvedVariant.costPrice.toString(),
              updatedAt: new Date(),
            },
          });
      } else {
        // Insert new
        const [inserted] = await tx
          .insert(productVariants)
          .values({
            ...resolvedVariant,
            price: resolvedVariant.price.toString(),
            costPrice: resolvedVariant.costPrice.toString(),
          })
          .returning({ id: productVariants.id });
        currentVariantId = inserted.id;
      }

      // 3. Handle Images (Full overwrite for simplicity)
      if (v.images && Array.isArray(v.images)) {
        if (currentVariantId && !currentVariantId.startsWith(VARIANT_ID_PREFIX.TEMP)) {
          // Delete old images
          await tx.delete(variantImages).where(eq(variantImages.variantId, currentVariantId));

          // Insert new
          if (v.images.length > 0) {
            await tx.insert(variantImages).values(
              v.images.map((url, index) => ({
                variantId: currentVariantId,
                imageUrl: url,
                displayOrder: index,
                isPrimary: index === 0,
              })),
            );
          }
        }
      }
    }

    const fullProduct = await tx.query.products.findFirst({
      where: (table: typeof products, { eq }) => eq(table.id, id),
      with: {
        variants: {
          with: {
            images: true,
          },
        },
      },
    });

    return fullProduct;
  });
}

/**
 * Get Cost Price History
 */
export async function getCostPriceHistory(variantId: string) {
  const history = await db
    .select({
      id: costPriceHistory.id,
      costPrice: costPriceHistory.costPrice,
      effectiveDate: costPriceHistory.effectiveDate,
      note: costPriceHistory.note,
      createdAt: costPriceHistory.createdAt,
    })
    .from(costPriceHistory)
    .where(eq(costPriceHistory.variantId, variantId))
    .orderBy(desc(costPriceHistory.createdAt));

  return history.map((record: (typeof history)[number]) => ({
    ...record,
    costPrice: Number(record.costPrice),
  }));
}
