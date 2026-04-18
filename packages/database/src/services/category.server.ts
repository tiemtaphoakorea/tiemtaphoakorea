import { ERROR_MESSAGE } from "@workspace/shared/constants";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";

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
