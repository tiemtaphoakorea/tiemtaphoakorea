import { relations } from "drizzle-orm";
import { categories } from "./categories";
import { expenses } from "./expenses";
import { homepageCollectionProducts, homepageCollections } from "./homepage-collections";
import { inventoryMovements } from "./inventory";
import { orderItems, orderStatusHistory, orders, payments, supplierOrders } from "./orders";
import { costPriceHistory, products, productVariants, variantImages } from "./products";
import { profiles } from "./profiles";
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
