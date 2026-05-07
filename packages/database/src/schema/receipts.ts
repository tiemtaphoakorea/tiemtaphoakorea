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
import { paymentMethodEnum, paymentStatusEnum, receiptStatusEnum } from "./enums";
import { productVariants } from "./products";
import { profiles } from "./profiles";
import { purchaseOrderItems, purchaseOrders } from "./purchases";
import { suppliers } from "./suppliers";

// PON — Đơn nhập hàng / Goods Receipt header.
// Stock-in event with payment + supplier debt tracking. Optionally linked to a PO.
export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    branchId: uuid("branch_id"),

    status: receiptStatusEnum("status").notNull().default("draft"),

    // Supplier invoice metadata
    receivedAt: timestamp("received_at"),
    invoiceDate: timestamp("invoice_date"),
    invoiceRef: varchar("invoice_ref", { length: 100 }),

    // Aggregates
    totalQty: integer("total_qty").notNull().default(0),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    extraCost: decimal("extra_cost", { precision: 15, scale: 2 }).notNull().default("0"),
    payableAmount: decimal("payable_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    debtAmount: decimal("debt_amount", { precision: 15, scale: 2 }).notNull().default("0"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),

    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    completedBy: uuid("completed_by").references(() => profiles.id),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_goods_receipts_supplier").on(table.supplierId),
    index("idx_goods_receipts_po").on(table.purchaseOrderId),
    index("idx_goods_receipts_status").on(table.status),
    index("idx_goods_receipts_payment_status").on(table.paymentStatus),
    index("idx_goods_receipts_created").on(table.createdAt),
  ],
);

// PON line items — actual qty received with actual unit cost (basis for WAC).
export const goodsReceiptItems = pgTable(
  "goods_receipt_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    receiptId: uuid("receipt_id")
      .notNull()
      .references(() => goodsReceipts.id, { onDelete: "cascade" }),
    purchaseOrderItemId: uuid("purchase_order_item_id").references(() => purchaseOrderItems.id),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),

    quantity: integer("quantity").notNull(),
    unitCost: decimal("unit_cost", { precision: 15, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 15, scale: 2 }).notNull().default("0"),
    lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),

    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_goods_receipt_items_receipt").on(table.receiptId),
    index("idx_goods_receipt_items_variant").on(table.variantId),
    index("idx_goods_receipt_items_po_item").on(table.purchaseOrderItemId),
  ],
);

// Phiếu chi NCC — payment from us to supplier, allocated to a receipt.
// Phase 1: 1 payment = 1 receipt (FK direct). Phase 3: introduce allocations table.
export const supplierPayments = pgTable(
  "supplier_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    receiptId: uuid("receipt_id").references(() => goodsReceipts.id, { onDelete: "set null" }),

    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull().default("cash"),
    referenceCode: varchar("reference_code", { length: 100 }),

    paidAt: timestamp("paid_at").defaultNow().notNull(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_supplier_payments_supplier").on(table.supplierId),
    index("idx_supplier_payments_receipt").on(table.receiptId),
    index("idx_supplier_payments_paid_at").on(table.paidAt),
  ],
);
