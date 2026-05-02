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
  (table) => [index("idx_homepage_collections_active_sort").on(table.isActive, table.sortOrder)],
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
export type HomepageCollectionType = (typeof homepageCollectionTypeEnum.enumValues)[number];
