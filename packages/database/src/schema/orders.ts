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
import {
  deliveryPreferenceEnum,
  fulfillmentStatusEnum,
  orderStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  supplierOrderStatusEnum,
} from "./enums";
import { productVariants } from "./products";
import { profiles } from "./profiles";
import { suppliers } from "./suppliers";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => profiles.id),
    status: orderStatusEnum("status").default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("pending"),
    stockOutAt: timestamp("stock_out_at"),
    completedAt: timestamp("completed_at"),

    parentOrderId: uuid("parent_order_id"), // Self-reference added below in relations if needed, or just keep as UUID for now. Drizzle self-reference can be tricky in definition but easy in relations. Actually let's just make it UUID.
    splitType: varchar("split_type", { length: 20 }), // legacy: 'in_stock' | 'pre_order' for split orders; classification by quantity
    deliveryPreference: deliveryPreferenceEnum("delivery_preference").default("ship_together"),

    subtotal: decimal("subtotal", { precision: 15, scale: 2 }).default("0"),
    discount: decimal("discount", { precision: 15, scale: 2 }).default("0"),
    total: decimal("total", { precision: 15, scale: 2 }).default("0"),

    totalCost: decimal("total_cost", { precision: 15, scale: 2 }).default("0"),
    profit: decimal("profit", { precision: 15, scale: 2 }).default("0"),

    shippingName: varchar("shipping_name", { length: 255 }),
    shippingPhone: varchar("shipping_phone", { length: 20 }),
    shippingAddress: text("shipping_address"),

    customerNote: text("customer_note"),
    adminNote: text("admin_note"),

    paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0"),

    paidAt: timestamp("paid_at"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_orders_customer").on(table.customerId),
      index("idx_orders_number").on(table.orderNumber),
      index("idx_orders_created").on(table.createdAt),
      index("idx_orders_parent").on(table.parentOrderId),
      index("idx_orders_payment_status").on(table.paymentStatus),
      index("idx_orders_fulfillment_status").on(table.fulfillmentStatus),
      index("idx_orders_stock_out_at").on(table.stockOutAt),
    ];
  },
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),

    productName: varchar("product_name", { length: 255 }).notNull(),
    variantName: varchar("variant_name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),

    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
    costPriceAtOrderTime: decimal("cost_price_at_order_time", {
      precision: 15,
      scale: 2,
    }).default("0"),
    lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),
    lineCost: decimal("line_cost", { precision: 15, scale: 2 }).default("0"),
    lineProfit: decimal("line_profit", { precision: 15, scale: 2 }).default("0"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_order_items_order").on(table.orderId),
      index("idx_order_items_variant").on(table.variantId),
    ];
  },
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [index("idx_status_history_order").on(table.orderId)];
  },
);

export const supplierOrders = pgTable(
  "supplier_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    status: supplierOrderStatusEnum("status").default("pending"),
    quantity: integer("quantity").notNull(),
    actualCostPrice: decimal("actual_cost_price", { precision: 15, scale: 2 }),
    note: text("note"),
    orderedAt: timestamp("ordered_at"),
    expectedDate: timestamp("expected_date"),
    receivedAt: timestamp("received_at"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_supplier_orders_supplier").on(table.supplierId),
      index("idx_supplier_orders_variant").on(table.variantId),
      index("idx_supplier_orders_status").on(table.status),
    ];
  },
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull().default("cash"),
    referenceCode: varchar("reference_code", { length: 100 }), // for bank transfer
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return [
      index("idx_payments_order").on(table.orderId),
      index("idx_payments_method").on(table.method),
    ];
  },
);
