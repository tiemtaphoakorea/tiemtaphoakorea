import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { purchaseOrderStatusEnum } from "./enums";
import { productVariants } from "./products";
import { profiles } from "./profiles";
import { suppliers } from "./suppliers";

// OSN — Đặt hàng nhập (Purchase Order header).
// One OSN groups N variants from one supplier; status is derived from items.
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    branchId: uuid("branch_id"), // nullable for single-branch MVP

    status: purchaseOrderStatusEnum("status").notNull().default("draft"),

    // Lifecycle timestamps
    orderedAt: timestamp("ordered_at"),
    expectedDate: timestamp("expected_date"),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),

    // Aggregate amounts (denormalized for fast list view)
    totalQty: integer("total_qty").notNull().default(0),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).notNull().default("0"),

    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    confirmedBy: uuid("confirmed_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_purchase_orders_supplier").on(table.supplierId),
    index("idx_purchase_orders_status").on(table.status),
    index("idx_purchase_orders_created").on(table.createdAt),
  ],
);

// OSN line items — what variant + qty + cost commitment per PO.
export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseOrderId: uuid("purchase_order_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),

    orderedQty: integer("ordered_qty").notNull(),
    receivedQty: integer("received_qty").notNull().default(0),

    unitCost: decimal("unit_cost", { precision: 15, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 15, scale: 2 }).notNull().default("0"),
    lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),

    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_purchase_order_items_po").on(table.purchaseOrderId),
    index("idx_purchase_order_items_variant").on(table.variantId),
  ],
);
