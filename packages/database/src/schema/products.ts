import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { profiles } from "./profiles";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).default("0"),
    isActive: boolean("is_active").default(true),
    isFeatured: boolean("is_featured").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_products_category").on(table.categoryId),
      index("idx_products_slug").on(table.slug),
      index("idx_products_featured").on(table.isFeatured),
    ];
  },
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    price: decimal("price", { precision: 15, scale: 2 }).notNull().default("0"),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).default("0"),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").default(5),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_variants_product").on(table.productId),
      index("idx_variants_sku").on(table.sku),
    ];
  },
);

export const variantImages = pgTable(
  "variant_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    displayOrder: integer("display_order").default(0),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [index("idx_variant_images_variant").on(table.variantId)];
  },
);

export const costPriceHistory = pgTable(
  "cost_price_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 }).notNull(),
    effectiveDate: timestamp("effective_date").defaultNow(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_cost_history_variant").on(table.variantId),
      index("idx_cost_history_date").on(table.effectiveDate),
    ];
  },
);
