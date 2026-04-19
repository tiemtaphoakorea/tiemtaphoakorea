/**
 * Integration test fixtures for order.server tests.
 *
 * Uses the real PGlite in-memory database (packages/database/src/db.ts picks
 * PGlite automatically when VITEST=true). Each call to seedOrderTest()
 * produces globally-unique identifiers so parallel tests do not collide
 * on unique columns (username, slug, sku, customerCode).
 */

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/db.server";
import { categories } from "@/db/schema/categories";
import { orders, supplierOrders } from "@/db/schema/orders";
import { products, productVariants } from "@/db/schema/products";
import { profiles } from "@/db/schema/profiles";
import { ROLE } from "@/lib/constants";

export type OrderTestFixture = {
  testId: string;
  userId: string;
  customerId: string;
  categoryId: string;
  productId: string;
  variantId: string;
};

/**
 * Seed a minimal set of rows needed by createOrder: an internal admin (owner),
 * a customer, a category, a product, and one variant with onHand=5, reserved=0.
 * All unique fields are suffixed with testId so concurrent tests do not collide.
 */
export async function seedOrderTest(): Promise<OrderTestFixture> {
  const testId = randomUUID().slice(0, 8);

  const [admin] = await db
    .insert(profiles)
    .values({
      username: `admin_${testId}`,
      fullName: `Admin ${testId}`,
      role: ROLE.OWNER,
    })
    .returning();

  const [customer] = await db
    .insert(profiles)
    .values({
      username: `cust_${testId}`,
      fullName: `Customer ${testId}`,
      role: ROLE.CUSTOMER,
      customerCode: `KH-${testId}`,
    })
    .returning();

  const [category] = await db
    .insert(categories)
    .values({
      name: `Category ${testId}`,
      slug: `cat-${testId}`,
    })
    .returning();

  const [product] = await db
    .insert(products)
    .values({
      name: `Product ${testId}`,
      slug: `prod-${testId}`,
      categoryId: category.id,
    })
    .returning();

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: product.id,
      sku: `SKU-${testId}`,
      name: `Variant ${testId}`,
      price: "100",
      costPrice: "50",
      onHand: 5,
      reserved: 0,
    })
    .returning();

  return {
    testId,
    userId: admin.id,
    customerId: customer.id,
    categoryId: category.id,
    productId: product.id,
    variantId: variant.id,
  };
}

/**
 * Remove the fixture's rows in FK-safe order. Orders created during the test
 * cascade-delete their items and status history via FKs on the schema.
 */
export async function cleanOrderTest(fx: OrderTestFixture): Promise<void> {
  // Orders → cascade-delete their items and status history via FKs.
  await db.delete(orders).where(eq(orders.customerId, fx.customerId));
  // supplier_orders.variant_id has no cascade from product_variants.
  await db.delete(supplierOrders).where(eq(supplierOrders.variantId, fx.variantId));
  await db.delete(productVariants).where(eq(productVariants.id, fx.variantId));
  await db.delete(products).where(eq(products.id, fx.productId));
  await db.delete(categories).where(eq(categories.id, fx.categoryId));
  await db.delete(profiles).where(eq(profiles.id, fx.customerId));
  await db.delete(profiles).where(eq(profiles.id, fx.userId));
}
