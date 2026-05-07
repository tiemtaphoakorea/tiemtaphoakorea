import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "manager", "staff", "customer"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export const customerTypeEnum = pgEnum("customer_type", ["wholesale", "retail"]);
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

export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "partial", "paid"]);
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "pending",
  "stock_out",
  "completed",
  "cancelled",
]);
export type FulfillmentStatus = (typeof fulfillmentStatusEnum.enumValues)[number];

export const movementTypeEnum = pgEnum("movement_type", [
  "stock_out",
  "supplier_receipt",
  "manual_adjustment",
  "cancellation",
  "stock_count_balance",
  "cost_adjustment",
]);

// Sapo-faithful workflow: OSN (purchase order) header status
export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
  "draft",
  "ordered",
  "partial",
  "received",
  "cancelled",
]);
export type PurchaseOrderStatus = (typeof purchaseOrderStatusEnum.enumValues)[number];

// PON (goods receipt) overall status
export const receiptStatusEnum = pgEnum("receipt_status", ["draft", "completed", "cancelled"]);
export type ReceiptStatus = (typeof receiptStatusEnum.enumValues)[number];

// IAN (stock count) multi-stage status
export const stockCountStatusEnum = pgEnum("stock_count_status", [
  "draft",
  "counting",
  "balanced",
  "cancelled",
]);
export type StockCountStatus = (typeof stockCountStatusEnum.enumValues)[number];
