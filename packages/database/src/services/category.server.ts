import { ERROR_MESSAGE } from "@workspace/shared/constants";
import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import { and, asc, count, eq, getTableColumns, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import { products } from "../schema/products";

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
  depth?: number;
};

type GetCategoriesOptions = {
  search?: string;
  /** When true, only return root categories where showInNav=true */
  navOnly?: boolean;
};

/**
 * Fetch all categories.
 * - If search is provided, returns a flat list of matches.
 * - If navOnly is true, returns only active root categories with showInNav=true as a tree.
 * - Otherwise returns the full hierarchical tree.
 */
export async function getCategories(options?: string | GetCategoriesOptions) {
  // Backward-compatible: old callers pass a string search directly
  const opts: GetCategoriesOptions =
    typeof options === "string" ? { search: options } : (options ?? {});
  const { search, navOnly } = opts;

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));

  if (search) {
    return allCategories.filter((cat: Category) =>
      cat.name.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // Build tree
  const categoryMap = new Map<string, CategoryWithChildren>();
  const roots: CategoryWithChildren[] = [];

  allCategories.forEach((cat: Category) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  allCategories.forEach((cat: Category) => {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children?.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  if (navOnly) {
    return roots.filter((cat) => cat.isActive && cat.showInNav);
  }

  return roots;
}

export type NavCategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: { id: string; name: string; slug: string; productCount: number }[];
};

/**
 * Active root categories (showInNav=true) with active product counts that include
 * direct + descendant products. Returns one level of children for mega-menu use.
 */
export async function getNavCategoriesWithCounts(): Promise<NavCategoryWithCount[]> {
  const all = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      parentId: categories.parentId,
      displayOrder: categories.displayOrder,
      isActive: categories.isActive,
      showInNav: categories.showInNav,
    })
    .from(categories)
    .orderBy(asc(categories.displayOrder), asc(categories.name));

  const activeIds = all.filter((c) => c.isActive).map((c) => c.id);
  if (activeIds.length === 0) return [];

  const counts = await db
    .select({
      categoryId: products.categoryId,
      n: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.categoryId, activeIds)))
    .groupBy(products.categoryId);

  const directCount = new Map<string, number>();
  for (const row of counts) {
    if (row.categoryId) directCount.set(row.categoryId, Number(row.n) || 0);
  }

  const childrenByParent = new Map<string, typeof all>();
  for (const c of all) {
    if (!c.parentId) continue;
    const list = childrenByParent.get(c.parentId) ?? [];
    list.push(c);
    childrenByParent.set(c.parentId, list);
  }

  // Total count = direct + sum over descendants (recursive).
  function totalCount(catId: string): number {
    let total = directCount.get(catId) ?? 0;
    for (const child of childrenByParent.get(catId) ?? []) {
      total += totalCount(child.id);
    }
    return total;
  }

  return all
    .filter((c) => !c.parentId && c.isActive && c.showInNav)
    .map((root) => ({
      id: root.id,
      name: root.name,
      slug: root.slug,
      productCount: totalCount(root.id),
      children: (childrenByParent.get(root.id) ?? [])
        .filter((c) => c.isActive && c.showInNav)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: totalCount(c.id),
        })),
    }));
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return category;
}

/**
 * Get flattened categories for select inputs (with depth indicator)
 */
export async function getFlatCategories() {
  const roots = await getCategories();
  const flat: CategoryWithChildren[] = [];

  function traverse(nodes: CategoryWithChildren[], depth = 0) {
    for (const node of nodes) {
      flat.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  }

  traverse(roots);
  return flat;
}

/**
 * Paginated flat category list for admin list views.
 * Does a direct DB query — no tree-building overhead.
 */
export async function getFlatCategoriesPaginated({
  search,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
}: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const offset = (page - 1) * limit;
  const where = search ? ilike(categories.name, `%${search}%`) : undefined;

  const [countRow, data] = await Promise.all([
    db
      .select({ c: count(categories.id) })
      .from(categories)
      .where(where)
      .then((r) => Number(r[0]?.c ?? 0)),
    db
      .select({
        ...getTableColumns(categories),
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .where(where)
      .groupBy(categories.id)
      .orderBy(asc(categories.displayOrder), asc(categories.name))
      .limit(limit)
      .offset(offset),
  ]);

  return { data, metadata: calculateMetadata(countRow, page, limit) };
}

/**
 * Create a new category
 */
export async function createCategory(data: NewCategory) {
  const [newCat] = await db.insert(categories).values(data).returning();
  return newCat;
}

/**
 * Update a category
 */
export async function updateCategory(id: string, data: Partial<NewCategory>) {
  // Prevent circular reference: Parent cannot be itself
  if (data.parentId && data.parentId === id) {
    throw new Error(ERROR_MESSAGE.CATEGORY.SELF_PARENT);
  }

  const [updatedCat] = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();

  return updatedCat;
}

/**
 * Delete a category
 * ParentId constraint is set to "SET NULL", so children become orphans (roots).
 */
export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}

/**
 * Generate a unique slug from a name
 */
export async function generateCategorySlug(name: string, excludeId?: string) {
  let slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Check for uniqueness
  let isUnique = false;
  let counter = 0;
  const originalSlug = slug;

  while (!isUnique) {
    if (counter > 0) {
      slug = `${originalSlug}-${counter}`;
    }

    const query = db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug));

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
