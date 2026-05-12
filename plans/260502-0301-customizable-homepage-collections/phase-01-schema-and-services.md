# Phase 01 — Database Schema + Service Layer

**Goal:** Tạo bảng `homepage_collections` + junction `homepage_collection_products`, generate migration, viết service layer với unit tests, seed 3 collection mặc định.

**Files:**
- Create: `packages/database/src/schema/homepage-collections.ts`
- Create: `packages/database/src/services/homepage-collection.server.ts`
- Create: `packages/database/drizzle/<timestamp>_homepage_collections.sql` (auto-gen)
- Create: `packages/database/src/seed/homepage-collections.seed.ts` (idempotent seed)
- Create: `tests/unit/services/homepage-collection.server.test.ts`
- Modify: `packages/database/src/schema/index.ts` (export new schema)
- Modify: `packages/database/src/schema/relations.ts` (add relations)

---

## Task 1.1: Schema file

- [ ] **Step 1: Create schema file**

Create `packages/database/src/schema/homepage-collections.ts`:

```ts
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { products } from "./products";

export const homepageCollectionTypeEnum = pgEnum("homepage_collection_type", [
  "manual",
  "best_sellers",
  "new_arrivals",
  "by_category",
]);

export const homepageCollections = pgTable(
  "homepage_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: homepageCollectionTypeEnum("type").notNull(),

    title: varchar("title", { length: 200 }).notNull(),
    subtitle: text("subtitle"),
    iconKey: varchar("icon_key", { length: 50 }),
    viewAllUrl: text("view_all_url"),
    itemLimit: integer("item_limit").notNull().default(8),

    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    // Type-specific (nullable; app layer validates)
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    daysWindow: integer("days_window"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_homepage_collections_active_sort").on(table.isActive, table.sortOrder),
  ],
);

export const homepageCollectionProducts = pgTable(
  "homepage_collection_products",
  {
    collectionId: uuid("collection_id")
      .references(() => homepageCollections.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.productId] }),
    index("idx_homepage_collection_products_sort").on(table.collectionId, table.sortOrder),
  ],
);

export type HomepageCollection = typeof homepageCollections.$inferSelect;
export type NewHomepageCollection = typeof homepageCollections.$inferInsert;
export type HomepageCollectionProduct = typeof homepageCollectionProducts.$inferSelect;
export type HomepageCollectionType =
  (typeof homepageCollectionTypeEnum.enumValues)[number];
```

- [ ] **Step 2: Export from schema index**

Edit `packages/database/src/schema/index.ts` — add line in alphabetical order:

```ts
export * from "./homepage-collections";
```

- [ ] **Step 3: Add relations**

Edit `packages/database/src/schema/relations.ts` — append:

```ts
import {
  homepageCollections,
  homepageCollectionProducts,
} from "./homepage-collections";

export const homepageCollectionsRelations = relations(homepageCollections, ({ one, many }) => ({
  category: one(categories, {
    fields: [homepageCollections.categoryId],
    references: [categories.id],
  }),
  products: many(homepageCollectionProducts),
}));

export const homepageCollectionProductsRelations = relations(
  homepageCollectionProducts,
  ({ one }) => ({
    collection: one(homepageCollections, {
      fields: [homepageCollectionProducts.collectionId],
      references: [homepageCollections.id],
    }),
    product: one(products, {
      fields: [homepageCollectionProducts.productId],
      references: [products.id],
    }),
  }),
);
```

(If `relations` / `categories` / `products` / `one` / `many` already imported in the file, do not duplicate — just add the new exports.)

- [ ] **Step 4: Generate migration**

Run from repo root:

```bash
pnpm --filter @workspace/database db:generate
```

Expected: prints new migration file under `packages/database/drizzle/<timestamp>_*.sql` containing `CREATE TYPE homepage_collection_type ...`, `CREATE TABLE homepage_collections`, `CREATE TABLE homepage_collection_products`.

- [ ] **Step 5: Inspect migration SQL**

Open the generated `.sql` file. Verify:
- `CREATE TYPE "public"."homepage_collection_type" AS ENUM('manual', 'best_sellers', 'new_arrivals', 'by_category')`
- `CREATE TABLE "homepage_collections"` with all columns + FK to `categories(id) ON DELETE SET NULL`
- `CREATE TABLE "homepage_collection_products"` with composite PK + FKs `ON DELETE CASCADE`
- Two indexes (`idx_homepage_collections_active_sort`, `idx_homepage_collection_products_sort`)

- [ ] **Step 6: Apply migration to local DB**

```bash
DATABASE_URL=$DATABASE_URL pnpm --filter @workspace/database db:migrate
```

Expected: "Applied migration <timestamp>_*.sql".

- [ ] **Step 7: Commit**

```bash
git add packages/database/src/schema/homepage-collections.ts \
        packages/database/src/schema/index.ts \
        packages/database/src/schema/relations.ts \
        packages/database/drizzle/
git commit -m "feat(db): add homepage_collections and junction schema"
```

---

## Task 1.2: Service layer — public read path (best_sellers, new_arrivals, by_category)

- [ ] **Step 1: Write failing test for getActiveHomepageCollections — best_sellers branch**

Create `tests/unit/services/homepage-collection.server.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock("@/services/product.server", () => ({
  getBestSellers: vi.fn(),
  getNewArrivals: vi.fn(),
}));

import { db } from "@/db/db.server";
import { getBestSellers, getNewArrivals } from "@/services/product.server";
import { getActiveHomepageCollections } from "@/services/homepage-collection.server";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockProductCard = (id: string) => ({
  id,
  name: `Product ${id}`,
  slug: `product-${id}`,
  description: null,
  isActive: true,
  categoryName: null,
  basePrice: "100000",
  totalStock: 5,
  totalOnHand: 5,
  totalReserved: 0,
  totalAvailable: 5,
  minPrice: 100000,
  maxPrice: 100000,
  thumbnail: "",
});

describe("getActiveHomepageCollections", () => {
  it("dispatches best_sellers branch to getBestSellers(itemLimit)", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c1",
              type: "best_sellers",
              title: "Bán chạy",
              subtitle: null,
              iconKey: "beauty",
              viewAllUrl: null,
              itemLimit: 4,
              isActive: true,
              sortOrder: 0,
              categoryId: null,
              daysWindow: null,
            },
          ]),
        }),
      }),
    });
    (getBestSellers as any).mockResolvedValue([mockProductCard("p1"), mockProductCard("p2")]);

    const result = await getActiveHomepageCollections();

    expect(getBestSellers).toHaveBeenCalledWith(4);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
    expect(result[0].products).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test — verify it fails (function not defined)**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: FAIL — "Cannot find module '@/services/homepage-collection.server'" or similar.

- [ ] **Step 3: Create service file with minimal implementation**

Create `packages/database/src/services/homepage-collection.server.ts`:

```ts
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../schema/categories";
import {
  homepageCollections,
  homepageCollectionProducts,
  type HomepageCollection,
  type HomepageCollectionType,
} from "../schema/homepage-collections";
import { products, productVariants, variantImages } from "../schema/products";
import {
  getBestSellers,
  getNewArrivals,
  type ProductListItem,
} from "./product.server";

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
      const products = await resolveProducts(row);
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.subtitle,
        iconKey: row.iconKey,
        viewAllUrl: row.viewAllUrl,
        itemLimit: row.itemLimit,
        sortOrder: row.sortOrder,
        products,
      };
    }),
  );

  // Filter empty (resolved 0 products) — keep section out of homepage
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
  // Implementation in Task 1.3 — stub for now
  return [];
}

async function getManualCollectionProducts(
  collectionId: string,
  limit: number,
): Promise<ProductListItem[]> {
  // Implementation in Task 1.4 — stub for now
  return [];
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Add test for new_arrivals branch**

Append to test file:

```ts
it("dispatches new_arrivals branch with daysWindow fallback to 30", async () => {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c2",
            type: "new_arrivals",
            title: "Mới",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 8,
            isActive: true,
            sortOrder: 1,
            categoryId: null,
            daysWindow: null, // fallback to 30
          },
        ]),
      }),
    }),
  });
  (getNewArrivals as any).mockResolvedValue([mockProductCard("p3")]);

  await getActiveHomepageCollections();

  expect(getNewArrivals).toHaveBeenCalledWith(8, 30);
});

it("respects custom daysWindow", async () => {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c3",
            type: "new_arrivals",
            title: "Mới 7 ngày",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 6,
            isActive: true,
            sortOrder: 2,
            categoryId: null,
            daysWindow: 7,
          },
        ]),
      }),
    }),
  });
  (getNewArrivals as any).mockResolvedValue([mockProductCard("p4")]);

  await getActiveHomepageCollections();

  expect(getNewArrivals).toHaveBeenCalledWith(6, 7);
});

it("filters out collections that resolve to 0 products", async () => {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c4",
            type: "best_sellers",
            title: "Empty",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 4,
            isActive: true,
            sortOrder: 0,
            categoryId: null,
            daysWindow: null,
          },
        ]),
      }),
    }),
  });
  (getBestSellers as any).mockResolvedValue([]);

  const result = await getActiveHomepageCollections();

  expect(result).toHaveLength(0);
});
```

- [ ] **Step 6: Run tests — verify all 4 pass**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/database/src/services/homepage-collection.server.ts \
        tests/unit/services/homepage-collection.server.test.ts
git commit -m "feat(db): add homepage collection service with auto-rule resolvers"
```

---

## Task 1.3: by_category resolver

- [ ] **Step 1: Add failing test for by_category**

Append to test file (in same `describe` block):

```ts
it("dispatches by_category branch to getProductsByCategory", async () => {
  // Mock the outer select for collections list
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c5",
            type: "by_category",
            title: "Eyewear",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 6,
            isActive: true,
            sortOrder: 0,
            categoryId: "cat-1",
            daysWindow: null,
          },
        ]),
      }),
    }),
  });
  // Mock the inner select for products by category
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      leftJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockProductCard("p5")]),
              }),
            }),
          }),
        }),
      }),
    }),
  });

  const result = await getActiveHomepageCollections();

  expect(result).toHaveLength(1);
  expect(result[0].products).toHaveLength(1);
});

it("skips by_category collection when categoryId is null", async () => {
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c6",
            type: "by_category",
            title: "Broken",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 4,
            isActive: true,
            sortOrder: 0,
            categoryId: null,
            daysWindow: null,
          },
        ]),
      }),
    }),
  });

  const result = await getActiveHomepageCollections();
  expect(result).toHaveLength(0);
});
```

- [ ] **Step 2: Run tests — verify by_category test fails (returns 0 products)**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: 1 FAIL (by_category dispatch returns 0).

- [ ] **Step 3: Implement getProductsByCategory**

Edit `packages/database/src/services/homepage-collection.server.ts`. Replace the stub `getProductsByCategory` with:

```ts
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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/homepage-collection.server.ts \
        tests/unit/services/homepage-collection.server.test.ts
git commit -m "feat(db): add by_category resolver for homepage collections"
```

---

## Task 1.4: Manual resolver

- [ ] **Step 1: Add failing test for manual collection ordering**

Append to test file:

```ts
it("dispatches manual branch ordered by junction sortOrder", async () => {
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([
          {
            id: "c7",
            type: "manual",
            title: "Featured",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 5,
            isActive: true,
            sortOrder: 0,
            categoryId: null,
            daysWindow: null,
          },
        ]),
      }),
    }),
  });
  // Inner select for manual products — joins junction
  (db.select as any).mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    mockProductCard("p10"),
                    mockProductCard("p11"),
                  ]),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  });

  const result = await getActiveHomepageCollections();
  expect(result[0].products).toHaveLength(2);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: 1 FAIL (manual returns empty stub).

- [ ] **Step 3: Implement getManualCollectionProducts**

Replace the stub in `homepage-collection.server.ts`:

```ts
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
      and(
        eq(homepageCollectionProducts.collectionId, collectionId),
        eq(products.isActive, true),
      ),
    )
    .groupBy(products.id, categories.name, homepageCollectionProducts.sortOrder)
    .orderBy(asc(homepageCollectionProducts.sortOrder))
    .limit(limit);
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/homepage-collection.server.ts \
        tests/unit/services/homepage-collection.server.test.ts
git commit -m "feat(db): add manual resolver with junction sortOrder"
```

---

## Task 1.5: Admin CRUD operations

- [ ] **Step 1: Add tests for admin CRUD**

Append a new `describe` block:

```ts
describe("admin CRUD", () => {
  it("listCollectionsForAdmin returns rows with manual product counts", async () => {
    (db.execute as any).mockResolvedValue([
      {
        id: "c1",
        type: "manual",
        title: "Featured",
        subtitle: null,
        icon_key: null,
        view_all_url: null,
        item_limit: 5,
        is_active: true,
        sort_order: 0,
        category_id: null,
        days_window: null,
        created_at: new Date(),
        updated_at: new Date(),
        product_count: 3,
      },
    ]);
    const { listCollectionsForAdmin } = await import("@/services/homepage-collection.server");
    const result = await listCollectionsForAdmin();
    expect(result).toHaveLength(1);
    expect(result[0].productCount).toBe(3);
  });

  it("createCollection inserts and returns row", async () => {
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "new-id",
            type: "manual",
            title: "Test",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 5,
            isActive: true,
            sortOrder: 0,
            categoryId: null,
            daysWindow: null,
          },
        ]),
      }),
    });
    const { createCollection } = await import("@/services/homepage-collection.server");
    const result = await createCollection({
      type: "manual",
      title: "Test",
      itemLimit: 5,
      sortOrder: 0,
      isActive: true,
    });
    expect(result.id).toBe("new-id");
  });

  it("reorderCollections updates sortOrder per id index", async () => {
    const updateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (db.update as any).mockReturnValue(updateChain);
    const { reorderCollections } = await import("@/services/homepage-collection.server");
    await reorderCollections(["a", "b", "c"]);
    expect(db.update).toHaveBeenCalledTimes(3);
    expect(updateChain.set).toHaveBeenNthCalledWith(1, expect.objectContaining({ sortOrder: 0 }));
    expect(updateChain.set).toHaveBeenNthCalledWith(2, expect.objectContaining({ sortOrder: 1 }));
    expect(updateChain.set).toHaveBeenNthCalledWith(3, expect.objectContaining({ sortOrder: 2 }));
  });

  it("setCollectionProducts deletes then inserts ordered junction rows", async () => {
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    const { setCollectionProducts } = await import("@/services/homepage-collection.server");
    await setCollectionProducts("c1", ["p1", "p2", "p3"]);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: 4 FAIL (functions not exported).

- [ ] **Step 3: Add CRUD functions to service**

Append to `packages/database/src/services/homepage-collection.server.ts`:

```ts
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

// ── Admin CRUD ──────────────────────────────────────────────────────────────

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
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
pnpm test -- tests/unit/services/homepage-collection.server.test.ts
```

Expected: PASS (11 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/services/homepage-collection.server.ts \
        tests/unit/services/homepage-collection.server.test.ts
git commit -m "feat(db): add admin CRUD for homepage collections"
```

---

## Task 1.6: Seed default collections

- [ ] **Step 1: Create seed file**

Create `packages/database/src/seed/homepage-collections.seed.ts`:

```ts
import { eq } from "drizzle-orm";
import { db } from "../db";
import { homepageCollections } from "../schema/homepage-collections";

const DEFAULTS = [
  {
    type: "manual" as const,
    title: "Featured",
    subtitle: null,
    iconKey: null,
    itemLimit: 5,
    sortOrder: 0,
    isActive: true,
    daysWindow: null,
    categoryId: null,
  },
  {
    type: "best_sellers" as const,
    title: "Bán chạy nhất",
    subtitle: "Sản phẩm được khách hàng chọn mua nhiều nhất",
    iconKey: "beauty",
    itemLimit: 4,
    sortOrder: 1,
    isActive: true,
    daysWindow: null,
    categoryId: null,
  },
  {
    type: "new_arrivals" as const,
    title: "Hàng mới về",
    subtitle: "Sản phẩm vừa lên kệ",
    iconKey: null,
    itemLimit: 8,
    sortOrder: 2,
    isActive: true,
    daysWindow: 30,
    categoryId: null,
  },
];

export async function seedHomepageCollections() {
  for (const data of DEFAULTS) {
    const [existing] = await db
      .select({ id: homepageCollections.id })
      .from(homepageCollections)
      .where(eq(homepageCollections.title, data.title))
      .limit(1);
    if (existing) {
      console.log(`[seed] homepage_collections "${data.title}" already exists — skip`);
      continue;
    }
    await db.insert(homepageCollections).values(data);
    console.log(`[seed] homepage_collections "${data.title}" inserted`);
  }
}

if (require.main === module) {
  seedHomepageCollections()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

- [ ] **Step 2: Run seed**

```bash
DATABASE_URL=$DATABASE_URL pnpm --filter @workspace/database tsx src/seed/homepage-collections.seed.ts
```

Expected: 3 lines "inserted" first run, "already exists — skip" on subsequent runs.

- [ ] **Step 3: Verify in DB**

```bash
psql $DATABASE_URL -c "SELECT id, type, title, sort_order, is_active FROM homepage_collections ORDER BY sort_order;"
```

Expected: 3 rows — Featured (manual, 0), Bán chạy nhất (best_sellers, 1), Hàng mới về (new_arrivals, 2).

- [ ] **Step 4: Commit**

```bash
git add packages/database/src/seed/homepage-collections.seed.ts
git commit -m "feat(db): seed default homepage collections (idempotent)"
```

---

## Phase 1 Done When

- [ ] Migration applied locally; 2 tables + enum exist
- [ ] 11 unit tests pass
- [ ] 3 default collections seeded in dev DB
- [ ] All commits pushed
