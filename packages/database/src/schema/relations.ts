import { relations } from "drizzle-orm";
import { categories } from "./categories";
import { expenses } from "./expenses";
import { homepageCollectionProducts, homepageCollections } from "./homepage-collections";
import { inventoryMovements } from "./inventory";
import { orderItems, orderStatusHistory, orders, payments, supplierOrders } from "./orders";
import { costPriceHistory, products, productVariants, variantImages } from "./products";
import { profiles } from "./profiles";
import { purchaseOrderItems, purchaseOrders } from "./purchases";
import { goodsReceiptItems, goodsReceipts, supplierPayments } from "./receipts";
import { suppliers } from "./suppliers";

export const profilesRelations = relations(profiles, ({ many }) => ({
  orders: many(orders, { relationName: "customer_orders" }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(profiles, {
    fields: [orders.customerId],
    references: [profiles.id],
    relationName: "customer_orders",
  }),
  items: many(orderItems),
  payments: many(payments),
  statusHistory: many(orderStatusHistory),
  creator: one(profiles, {
    fields: [orders.createdBy],
    references: [profiles.id],
    relationName: "creator_orders",
  }),
  parentOrder: one(orders, {
    fields: [orders.parentOrderId],
    references: [orders.id],
    relationName: "parent_child",
  }),
  subOrders: many(orders, {
    relationName: "parent_child",
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  creator: one(profiles, {
    fields: [orderStatusHistory.createdBy],
    references: [profiles.id],
  }),
}));

export const supplierOrdersRelations = relations(supplierOrders, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierOrders.supplierId],
    references: [suppliers.id],
  }),
  variant: one(productVariants, {
    fields: [supplierOrders.variantId],
    references: [productVariants.id],
  }),
  creator: one(profiles, {
    fields: [supplierOrders.createdBy],
    references: [profiles.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  creator: one(profiles, {
    fields: [payments.createdBy],
    references: [profiles.id],
  }),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(variantImages),
  costHistory: many(costPriceHistory),
  movements: many(inventoryMovements),
}));

export const variantImagesRelations = relations(variantImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantImages.variantId],
    references: [productVariants.id],
  }),
}));

export const costPriceHistoryRelations = relations(costPriceHistory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [costPriceHistory.variantId],
    references: [productVariants.id],
  }),
  creator: one(profiles, {
    fields: [costPriceHistory.createdBy],
    references: [profiles.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplierOrders: many(supplierOrders),
  purchaseOrders: many(purchaseOrders),
  goodsReceipts: many(goodsReceipts),
  payments: many(supplierPayments),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
  receipts: many(goodsReceipts),
  creator: one(profiles, {
    fields: [purchaseOrders.createdBy],
    references: [profiles.id],
    relationName: "purchase_order_creator",
  }),
  confirmer: one(profiles, {
    fields: [purchaseOrders.confirmedBy],
    references: [profiles.id],
    relationName: "purchase_order_confirmer",
  }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  variant: one(productVariants, {
    fields: [purchaseOrderItems.variantId],
    references: [productVariants.id],
  }),
  receiptItems: many(goodsReceiptItems),
}));

export const goodsReceiptsRelations = relations(goodsReceipts, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [goodsReceipts.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [goodsReceipts.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  items: many(goodsReceiptItems),
  payments: many(supplierPayments),
  creator: one(profiles, {
    fields: [goodsReceipts.createdBy],
    references: [profiles.id],
    relationName: "goods_receipt_creator",
  }),
  completer: one(profiles, {
    fields: [goodsReceipts.completedBy],
    references: [profiles.id],
    relationName: "goods_receipt_completer",
  }),
}));

export const goodsReceiptItemsRelations = relations(goodsReceiptItems, ({ one }) => ({
  receipt: one(goodsReceipts, {
    fields: [goodsReceiptItems.receiptId],
    references: [goodsReceipts.id],
  }),
  variant: one(productVariants, {
    fields: [goodsReceiptItems.variantId],
    references: [productVariants.id],
  }),
  purchaseOrderItem: one(purchaseOrderItems, {
    fields: [goodsReceiptItems.purchaseOrderItemId],
    references: [purchaseOrderItems.id],
  }),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierPayments.supplierId],
    references: [suppliers.id],
  }),
  receipt: one(goodsReceipts, {
    fields: [supplierPayments.receiptId],
    references: [goodsReceipts.id],
  }),
  creator: one(profiles, {
    fields: [supplierPayments.createdBy],
    references: [profiles.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  creator: one(profiles, {
    fields: [expenses.createdBy],
    references: [profiles.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, {
    relationName: "category_parent",
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryMovements.variantId],
    references: [productVariants.id],
  }),
  createdByUser: one(profiles, {
    fields: [inventoryMovements.createdBy],
    references: [profiles.id],
  }),
}));

export const homepageCollectionsRelations = relations(homepageCollections, ({ one, many }) => ({
  category: one(categories, {
    fields: [homepageCollections.categoryId],
    references: [categories.id],
  }),
  products: many(homepageCollectionProducts),
}));

export const homepageCollectionProductsRelations = relations(
  homepageCollectionProducts,
  ({ one }) => ({
    collection: one(homepageCollections, {
      fields: [homepageCollectionProducts.collectionId],
      references: [homepageCollections.id],
    }),
    product: one(products, {
      fields: [homepageCollectionProducts.productId],
      references: [products.id],
    }),
  }),
);
