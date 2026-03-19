import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "manager", "staff", "customer"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export const customerTypeEnum = pgEnum("customer_type", ["wholesale", "retail"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
]);

export const supplierOrderStatusEnum = pgEnum("supplier_order_status", [
  "pending",
  "ordered",
  "received",
  "cancelled",
]);

export const messageTypeEnum = pgEnum("message_type", ["text", "image", "system"]);

export const deliveryPreferenceEnum = pgEnum("delivery_preference", [
  "ship_together",
  "ship_available_first",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "bank_transfer", "card"]);

export const expenseTypeEnum = pgEnum("expense_type", ["fixed", "variable"]);
