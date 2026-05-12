import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { movementTypeEnum } from "./enums";
import { productVariants } from "./products";
import { profiles } from "./profiles";

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    type: movementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    onHandBefore: integer("on_hand_before").notNull(),
    onHandAfter: integer("on_hand_after").notNull(),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  },
  (table) => [
    index("idx_inv_movements_variant").on(table.variantId),
    index("idx_inv_movements_created_at").on(table.createdAt),
    index("idx_inv_movements_type").on(table.type),
  ],
);

export const openingStockEntries = pgTable(
  "opening_stock_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitCost: decimal("unit_cost", { precision: 15, scale: 2 }).notNull().default("0"),
    effectiveDate: timestamp("effective_date").notNull(),
    note: text("note"),
    status: varchar("status", { length: 32 }).notNull().default("applied"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uidx_opening_stock_entries_variant").on(table.variantId),
    index("idx_opening_stock_entries_effective_date").on(table.effectiveDate),
    index("idx_opening_stock_entries_status").on(table.status),
  ],
);
