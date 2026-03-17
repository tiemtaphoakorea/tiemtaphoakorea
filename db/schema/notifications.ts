import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { orders, supplierOrders } from "./orders";

export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'pre_order_received', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  orderId: uuid("order_id").references(() => orders.id),
  supplierOrderId: uuid("supplier_order_id").references(
    () => supplierOrders.id
  ),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
