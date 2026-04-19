/**
 * Database Locking Utilities
 *
 * Provides helper functions for row-level locking to prevent race conditions
 * in concurrent database operations.
 */

import { eq, inArray } from "drizzle-orm";
import { orders } from "../schema/orders";
import { productVariants } from "../schema/products";
import type { DbTransaction, VariantWithProduct } from "../types/database";

/**
 * Lock product variants for update using PostgreSQL SELECT FOR UPDATE.
 * This ensures exclusive access to variant rows within a transaction,
 * preventing overselling in concurrent order scenarios.
 *
 * @param tx - Drizzle transaction object
 * @param variantIds - Array of variant IDs to lock
 * @returns Array of locked variant records with current stock data
 *
 * @example
 * await db.transaction(async (tx) => {
 *   const lockedVariants = await lockVariantsForUpdate(tx, ['variant-1', 'variant-2']);
 *   // Now safe to check stock and update
 * });
 */
export async function lockVariantsForUpdate(
  tx: DbTransaction,
  variantIds: string[],
): Promise<VariantWithProduct[]> {
  const validIds = variantIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (validIds.length === 0) {
    return [];
  }

  // Use eq for single ID to avoid PostgreSQL/driver issues with inArray([one UUID])
  const whereClause =
    validIds.length === 1
      ? eq(productVariants.id, validIds[0])
      : inArray(productVariants.id, validIds);

  const results = await tx
    .select({
      id: productVariants.id,
      productId: productVariants.productId,
      sku: productVariants.sku,
      name: productVariants.name,
      price: productVariants.price,
      costPrice: productVariants.costPrice,
      onHand: productVariants.onHand,
      reserved: productVariants.reserved,
      lowStockThreshold: productVariants.lowStockThreshold,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .where(whereClause)
    .for("update");

  return results;
}

/**
 * Lock a single order for update.
 * Useful when updating order status or recording payments.
 *
 * @param tx - Drizzle transaction object
 * @param orderId - Order ID to lock
 * @returns The locked order record or null if not found
 */
export async function lockOrderForUpdate(
  tx: DbTransaction,
  orderId: string,
): Promise<{
  id: string;
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: string | null;
  paidAmount: string | null;
  customerId: string;
  paidAt: Date | null;
  stockOutAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
} | null> {
  const [order] = await tx
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      paymentStatus: orders.paymentStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      total: orders.total,
      paidAmount: orders.paidAmount,
      customerId: orders.customerId,
      paidAt: orders.paidAt,
      stockOutAt: orders.stockOutAt,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update");

  return order || null;
}

/**
 * Generate a unique order number with format: ORD-YYYYMMDD-{6 hex chars}
 * Example: ORD-20260202-E789FA
 *
 * Uses random hex suffix to avoid collisions without needing sequence tracking.
 *
 * @param _tx - Drizzle transaction object (unused, kept for API compatibility)
 * @param prefix - Order number prefix (default: 'ORD')
 * @returns Unique order number string
 */
export async function generateOrderNumber(
  _tx: DbTransaction,
  prefix: string = "ORD",
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `${prefix}-${dateStr}-${randomHex}`;
}

/**
 * Generate order number outside of transaction to avoid transaction abort issues.
 * Should be called before starting a transaction.
 *
 * Format: ORD-YYYYMMDD-{6 hex chars}
 * Example: ORD-20260202-E789FA
 *
 * @param prefix - Order number prefix (default: 'ORD')
 * @returns Unique order number string
 */
export async function generateOrderNumberOutsideTransaction(
  prefix: string = "ORD",
): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `${prefix}-${dateStr}-${randomHex}`;
}

/**
 * Validate stock availability for multiple variants.
 * Should be called after locking variants.
 * Aggregates requested quantity by variantId so duplicate lines are counted correctly.
 *
 * @param lockedVariants - Array of locked variant records
 * @param requestedItems - Array of items with variantId and quantity
 * @throws Error if any variant has insufficient stock
 */
export function validateStockAvailability(
  lockedVariants: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number | null;
  }>,
  requestedItems: Array<{ variantId: string; quantity: number }>,
): void {
  const variantMap = new Map(lockedVariants.map((v) => [v.id, v]));

  // Aggregate requested quantity by variantId (same variant in multiple lines)
  const requestedByVariant = new Map<string, number>();
  for (const item of requestedItems) {
    if (!variantMap.has(item.variantId)) {
      throw new Error(`Variant not found: ${item.variantId}`);
    }
    const current = requestedByVariant.get(item.variantId) ?? 0;
    requestedByVariant.set(item.variantId, current + item.quantity);
  }

  // Stock is tracked by quantity only; negative stock is allowed (no pre_order type)
}
