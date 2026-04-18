import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),

  // "category" = auto-derive image/title/url from a category
  // "custom"   = manually provided image URL
  type: varchar("type", { length: 20 }).notNull().default("custom"),

  // Used when type = "category"
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),

  // Used when type = "custom"
  imageUrl: text("image_url"),

  // All optional — if null, auto-derived from category when type = "category"
  title: varchar("title", { length: 200 }),
  subtitle: text("subtitle"),
  badgeText: varchar("badge_text", { length: 100 }),
  ctaLabel: varchar("cta_label", { length: 100 }),
  ctaUrl: text("cta_url"),
  ctaSecondaryLabel: varchar("cta_secondary_label", { length: 100 }),
  discountTag: varchar("discount_tag", { length: 50 }),
  discountTagSub: varchar("discount_tag_sub", { length: 100 }),
  accentColor: varchar("accent_color", { length: 50 }),

  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
