import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
