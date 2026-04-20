import {
  CUSTOMER_TYPE,
  DELIVERY_PREFERENCE,
  ERROR_MESSAGE,
  FULFILLMENT_STATUS,
  type FulfillmentStatusValue,
  ORDER_CODE_PREFIX,
  type PAYMENT_METHOD,
  PAYMENT_STATUS,
  type PaymentStatusValue,
  ROLE,
  SUPPLIER_ORDER_STATUS,
} from "@workspace/shared/constants";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "../db";
import {
  generateOrderNumberOutsideTransaction,
  lockOrderForUpdate,
  lockVariantsForUpdate,
} from "../lib/db-locking";
import { orderItems, orderStatusHistory, orders, payments, supplierOrders } from "../schema/orders";
import { productVariants } from "../schema/products";
import { profiles } from "../schema/profiles";
import type {
  DbError,
  DbTransaction,
  SupplierOrderRecord,
  VariantWithProduct,
} from "../types/database";
import { createCustomer } from "./customer.server";
import { createSplitOrders } from "./order-split.server";

/**
 * Helper function to find or create a customer
 * Handles race conditions when multiple concurrent requests try to create the same customer
 */
async function findOrCreateCustomer(customerInfo: {
  phone: string;
  name: string;
}): Promise<string> {
  // Try up to 3 times to handle race conditions
  for (let attempt = 1; attempt <= 3; attempt++) {
    // First, try to find existing customer by phone
    const existingCustomers = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.role, ROLE.CUSTOMER), eq(profiles.phone, customerInfo.phone)))
      .limit(1);

    if (existingCustomers.length > 0) {
      return existingCustomers[0].id;
    }

    // Customer doesn't exist, try to create
    try {
      const newCustomer = await createCustomer({
        fullName: customerInfo.name,
        phone: customerInfo.phone,
        customerType: CUSTOMER_TYPE.RETAIL,
      });
      return newCustomer.profile.id;
    } catch (error) {
      const dbError = error as DbError;
      // Check if error is due to unique constraint violation (race condition)
      const isUniqueViolation =
        dbError?.code === "23505" ||
        dbError?.constraint?.includes("phone") ||
        dbError?.constraint?.includes("unique") ||
        dbError?.message?.toLowerCase().includes("unique") ||
        dbError?.message?.toLowerCase().includes("duplicate");

      if (isUniqueViolation && attempt < 3) {
        // Another request created the customer, wait and retry lookup
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }

      // Not a unique violation or exhausted retries
      throw error;
    }
  }

  throw new Error("Failed to find or create customer after retries");
}

/**
 * Helper function to auto-create supplier orders for items needing stock
 * This is called after an order is created for pre-order or out-of-stock items
 */
async function createSupplierOrdersForItems(
  tx: DbTransaction,
  itemsNeedingStock: Array<{
    variantId: string;
    quantity: number;
    sku: string;
  }>,
  userId: string,
  orderNumber?: string,
) {
  const createdSupplierOrders: SupplierOrderRecord[] = [];

  for (const item of itemsNeedingStock) {
    // Create supplier order for this item
    const [supplierOrder] = await tx
      .insert(supplierOrders)
      .values({
        variantId: item.variantId,
        quantity: item.quantity,
        status: SUPPLIER_ORDER_STATUS.PENDING,
        note: orderNumber
          ? `Auto-created for pre-order/out-of-stock item: ${item.sku} [Order: ${orderNumber}]`
          : `Auto-created for pre-order/out-of-stock item: ${item.sku}`,
        createdBy: userId,
      })
      .returning();

    createdSupplierOrders.push(supplierOrder);
  }

  return createdSupplierOrders;
}

export async function createOrder(data: {
  customerId: string | { phone: string; name: string };
  items: Array<{
    variantId: string;
    quantity: number;
    customPrice?: number;
  }>;
  note?: string;
  userId: string; // Admin creating the order
  deliveryPreference?: (typeof DELIVERY_PREFERENCE)[keyof typeof DELIVERY_PREFERENCE];
}) {
  // Resolve customerId - handle both string ID and customer info object
  let resolvedCustomerId: string;
  if (typeof data.customerId === "string") {
    resolvedCustomerId = data.customerId;
  } else {
    // Auto-create or find customer by phone
    resolvedCustomerId = await findOrCreateCustomer(data.customerId);
  }

  const deliveryPreference = data.deliveryPreference || DELIVERY_PREFERENCE.SHIP_TOGETHER;

  // Generate Order Number OUTSIDE transaction to avoid transaction abort issues
  // when database function doesn't exist
  const orderNumber = await generateOrderNumberOutsideTransaction(ORDER_CODE_PREFIX);

  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Lock Variants with SELECT FOR UPDATE to prevent race conditions.
    const variantIds = data.items.map((i) => i.variantId);
    const lockedVariants = await lockVariantsForUpdate(tx, variantIds);

    // Build variantMap using VariantWithProduct shape for downstream compat
    // (createSplitOrders, etc.). `onHand` here carries the *available*
    // count (on_hand - reserved) for read-only consumers.
    const variantMap = new Map<string, VariantWithProduct>(
      lockedVariants.map((v) => [
        v.id,
        {
          ...v,
          onHand: (v.onHand ?? 0) - (v.reserved ?? 0),
        },
      ]),
    );
    const missingVariantIds = variantIds.filter((variantId) => !variantMap.has(variantId));

    // If variants not found within transaction (shouldn't happen with proper locking),
    // throw error instead of fallback - data consistency is more important
    if (missingVariantIds.length > 0) {
      throw new Error(
        `${ERROR_MESSAGE.ORDER.NOT_FOUND}: Variants not found: ${missingVariantIds.join(", ")}`,
      );
    }

    // 2. Classify items by quantity (for ship_available_first: available now vs need to order)
    const inStockItems: typeof data.items = [];
    const preOrderItems: typeof data.items = [];

    for (const item of data.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);
      const available = variant.onHand ?? 0;
      if (available >= item.quantity) {
        inStockItems.push(item);
      } else {
        preOrderItems.push(item);
      }
    }

    // 3. Check for Split Condition (by quantity: available now vs backorder)
    if (
      deliveryPreference === DELIVERY_PREFERENCE.SHIP_AVAILABLE_FIRST &&
      inStockItems.length > 0 &&
      preOrderItems.length > 0
    ) {
      return await createSplitOrders(
        tx,
        {
          ...data,
          customerId: resolvedCustomerId,
          deliveryPreference,
          orderNumber,
        },
        inStockItems,
        preOrderItems,
        variantMap,
      );
    }

    // 4. Standard Single Order Creation (Existing Logic)

    // Calculate Totals
    let subtotal = 0;
    let totalCost = 0;

    data.items.forEach((item) => {
      const variant = variantMap.get(item.variantId)!;
      const unitPrice = item.customPrice ?? Number(variant.price);
      subtotal += unitPrice * item.quantity;
      totalCost += Number(variant.costPrice || 0) * item.quantity;
    });

    const total = subtotal;
    const profit = total - totalCost;

    // Create Order: no legacy `status`; use paymentStatus + fulfillmentStatus
    const [newOrder] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId: resolvedCustomerId,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
        subtotal: subtotal.toString(),
        total: total.toString(),
        totalCost: totalCost.toString(),
        profit: profit.toString(),
        adminNote: data.note,
        createdBy: data.userId,
        deliveryPreference,
      })
      .returning();

    // Process Items: reserve (do NOT deduct on_hand); report shortage for supplier
    // Shortage is computed against available = on_hand - reserved (before increment).
    const itemsNeedingStock: Array<{
      sku: string;
      name: string;
      quantityToOrder: number;
      variantId: string;
    }> = [];

    for (const item of data.items) {
      const variant = variantMap.get(item.variantId)!;
      const availableStock = variant.onHand ?? 0;
      const quantityNeedsSupplier = Math.max(0, item.quantity - availableStock);

      await tx
        .update(productVariants)
        .set({
          reserved: sql`${productVariants.reserved} + ${item.quantity}`,
        })
        .where(eq(productVariants.id, variant.id));

      // Keep the map in sync for any later reads in this scope.
      variant.onHand = availableStock - item.quantity;

      if (quantityNeedsSupplier > 0) {
        itemsNeedingStock.push({
          sku: variant.sku,
          name: variant.name,
          quantityToOrder: quantityNeedsSupplier,
          variantId: variant.id,
        });
      }
      const unitPrice = item.customPrice ?? Number(variant.price);
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        variantId: variant.id,
        productName: variant.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        costPriceAtOrderTime: variant.costPrice,
        lineTotal: (unitPrice * item.quantity).toString(),
        lineCost: (Number(variant.costPrice || 0) * item.quantity).toString(),
        lineProfit: ((unitPrice - Number(variant.costPrice || 0)) * item.quantity).toString(),
      });
    }

    // Create Status History with both payment + fulfillment status (both NOT NULL).
    await tx.insert(orderStatusHistory).values({
      orderId: newOrder.id,
      paymentStatus: PAYMENT_STATUS.UNPAID,
      fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
      note: "Order created by admin",
      createdBy: data.userId,
    });

    // Auto-create supplier orders for items needing stock
    if (itemsNeedingStock.length > 0) {
      const supplierOrderItems = itemsNeedingStock.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantityToOrder,
        sku: item.sku,
      }));

      await createSupplierOrdersForItems(tx, supplierOrderItems, data.userId, orderNumber);
    }

    return { order: newOrder, itemsNeedingStock };
  });
}

/**
 * Transition a pending order to stock_out.
 *
 * Semantically: the customer arrived and we pulled their reserved units off
 * the shelf. Deducts `on_hand -= qty` and `reserved -= qty` per order item in
 * a single transaction. Requires `on_hand >= qty` for every item (no oversell
 * once goods physically leave stock) and the order to currently be
 * `fulfillment_status = 'pending'`.
 */
export async function stockOut({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const lockedOrder = await lockOrderForUpdate(tx, orderId);
    if (!lockedOrder) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (lockedOrder.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error(`Invalid transition: cannot stock_out from ${lockedOrder.fulfillmentStatus}`);
    }

    const items = await tx
      .select({ quantity: orderItems.quantity, variantId: orderItems.variantId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) throw new Error("Order has no items");

    const variantIds = items.map((i) => i.variantId);
    const variants = await lockVariantsForUpdate(tx, variantIds);
    const byId = new Map(variants.map((v) => [v.id, v]));

    for (const item of items) {
      const v = byId.get(item.variantId);
      if (!v) throw new Error(`Variant ${item.variantId} missing`);
      if ((v.onHand ?? 0) < item.quantity) {
        throw new Error(
          `Insufficient stock for SKU ${v.sku}: on_hand=${v.onHand}, need=${item.quantity}`,
        );
      }
    }

    for (const item of items) {
      await tx
        .update(productVariants)
        .set({
          onHand: sql`${productVariants.onHand} - ${item.quantity}`,
          reserved: sql`${productVariants.reserved} - ${item.quantity}`,
        })
        .where(eq(productVariants.id, item.variantId));
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        fulfillmentStatus: FULFILLMENT_STATUS.STOCK_OUT,
        stockOutAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.STOCK_OUT,
      note: note ?? "Stock out",
      createdBy: userId,
    });

    return updated;
  });
}

/**
 * Transition a stock_out order to completed.
 *
 * Requires payment_status='paid' (DB CHECK constraint: completed ⇒ paid) and
 * fulfillment_status='stock_out'. Sets completed_at=now() on success.
 */
export async function completeOrder({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const lockedOrder = await lockOrderForUpdate(tx, orderId);
    if (!lockedOrder) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (lockedOrder.fulfillmentStatus !== FULFILLMENT_STATUS.STOCK_OUT) {
      throw new Error(`Invalid transition: cannot complete from ${lockedOrder.fulfillmentStatus}`);
    }
    if (lockedOrder.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error("Order is not fully paid; cannot complete");
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.COMPLETED,
      note: note ?? "Order completed",
      createdBy: userId,
    });

    return updated;
  });
}

/**
 * Transition a pending order to cancelled.
 *
 * Only pending orders can be cancelled in Spec 1 — once goods have physically
 * left stock (stock_out) the customer path is `return_order` (not yet
 * available). Returns reserved stock (`reserved -= qty`) without touching
 * `on_hand`, sets `cancelled_at = now()`, writes a status_history row, and
 * cancels any supplier_orders whose note references this order's number
 * (preserving old updateOrderStatus behavior).
 */
export async function cancelOrder({
  orderId,
  userId,
  note,
}: {
  orderId: string;
  userId: string;
  note?: string;
}) {
  return await db.transaction(async (tx: DbTransaction) => {
    const locked = await lockOrderForUpdate(tx, orderId);
    if (!locked) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (locked.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error(
        `Cannot cancel after stock_out. Use return_order instead (not yet available in Spec 1).`,
      );
    }

    const items = await tx
      .select({ quantity: orderItems.quantity, variantId: orderItems.variantId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const variantIds = items.map((i) => i.variantId);
    if (variantIds.length > 0) {
      await lockVariantsForUpdate(tx, variantIds);
      for (const item of items) {
        await tx
          .update(productVariants)
          .set({ reserved: sql`${productVariants.reserved} - ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }
    }

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: updated.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.CANCELLED,
      note: note ?? "Order cancelled",
      createdBy: userId,
    });

    await tx
      .update(supplierOrders)
      .set({ status: SUPPLIER_ORDER_STATUS.CANCELLED, updatedAt: now })
      .where(ilike(supplierOrders.note, `%[Order: ${locked.orderNumber}]%`));

    return updated;
  });
}

import { calculateMetadata, PAGINATION_DEFAULT } from "@workspace/shared/pagination";

export async function getOrders({
  search = "",
  paymentStatus,
  fulfillmentStatus,
  customerId,
  page = PAGINATION_DEFAULT.PAGE,
  limit = PAGINATION_DEFAULT.LIMIT,
  debtOnly,
}: {
  search?: string;
  paymentStatus?: PaymentStatusValue;
  fulfillmentStatus?: FulfillmentStatusValue;
  customerId?: string;
  page?: number;
  limit?: number;
  debtOnly?: boolean;
} = {}) {
  const offset = (page - 1) * limit;
  const whereConditions: SQL[] = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(profiles.fullName, `%${search}%`),
        ilike(profiles.phone, `%${search}%`),
      )!,
    );
  }

  if (paymentStatus) {
    whereConditions.push(eq(orders.paymentStatus, paymentStatus)!);
  }

  if (fulfillmentStatus) {
    whereConditions.push(eq(orders.fulfillmentStatus, fulfillmentStatus)!);
  }

  if (debtOnly) {
    whereConditions.push(eq(orders.fulfillmentStatus, FULFILLMENT_STATUS.STOCK_OUT)!);
    whereConditions.push(sql`${orders.paymentStatus} != ${PAYMENT_STATUS.PAID}`);
  }

  if (customerId) {
    whereConditions.push(eq(orders.customerId, customerId)!);
  }

  const whereClause = and(...whereConditions);

  // Total count query
  const totalQuery = db
    .select({ count: sql<number>`count(distinct ${orders.id})` })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .where(whereClause);

  const [totalResult] = await totalQuery;
  const total = Number(totalResult?.count || 0);

  const rawResults = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      paymentStatus: orders.paymentStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      total: orders.total,
      paidAmount: orders.paidAmount,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      // Select flat fields to avoid Drizzle nesting issue with groupBy
      customerId: profiles.id,
      customerFullName: profiles.fullName,
      customerCode: profiles.customerCode,
      itemCount: sql<number>`count(${orderItems.id})`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.customerId, profiles.id))
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(whereClause)
    .groupBy(orders.id, profiles.id)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const results = rawResults.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    paidAmount: order.paidAmount,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    customer: {
      id: order.customerId,
      fullName: order.customerFullName,
      customerCode: order.customerCode,
    },
    itemCount: order.itemCount,
  }));

  return {
    data: results,
    metadata: calculateMetadata(total, page, limit),
  };
}

export async function getOrderDetails(id: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;

  // 2. Fetch customer
  const [customer] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, order.customerId))
    .limit(1);

  // 3. Fetch Items with Variants and Products
  const items = await db.query.orderItems.findMany({
    where: (items, { eq }) => eq(items.orderId, id),
    with: {
      variant: {
        with: {
          product: true,
          images: true,
        },
      },
    },
  });

  // 4. Fetch payments
  const paymentsData = await db.query.payments.findMany({
    where: (payments, { eq }) => eq(payments.orderId, id),
    orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    with: {
      creator: true,
    },
  });

  // 5. Fetch Status History
  const statusHistory = await db.query.orderStatusHistory.findMany({
    where: (history, { eq }) => eq(history.orderId, id),
    orderBy: (history, { desc }) => [desc(history.createdAt)],
    with: {
      creator: true,
    },
  });

  // 6. Return assembled object
  return {
    ...order,
    customer,
    payments: paymentsData,
    items,
    statusHistory,
    subOrders: [],
    parentOrder: null,
  };
}

/**
 * Update order details (admin note, discount)
 * For product/quantity changes, cancel and create a new order
 */
export async function updateOrder(
  orderId: string,
  data: {
    adminNote?: string;
    discount?: number;
  },
  userId: string,
) {
  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Lock order and check fulfillment status (pending-only edits).
    const locked = await lockOrderForUpdate(tx, orderId);
    if (!locked) {
      throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);
    }
    if (locked.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error(`Cannot edit order after ${locked.fulfillmentStatus}`);
    }

    // lockOrderForUpdate doesn't surface subtotal; read it on the now-locked row.
    const [currentOrder] = await tx
      .select({ subtotal: orders.subtotal })
      .from(orders)
      .where(eq(orders.id, orderId));

    // 2. Prepare update data
    const updates: Record<string, unknown> = {};

    if (data.adminNote !== undefined) {
      updates.adminNote = data.adminNote;
    }

    if (data.discount !== undefined) {
      updates.discount = data.discount.toString();
      // Recalculate total: total = subtotal - discount
      const newTotal = Number(currentOrder.subtotal) - data.discount;
      updates.total = newTotal.toString();
    }

    if (Object.keys(updates).length === 0) {
      const [fullOrder] = await tx.select().from(orders).where(eq(orders.id, orderId));
      return fullOrder; // Nothing to update
    }

    // 3. Update order
    const [updatedOrder] = await tx
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();

    // 4. Log to status history
    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: locked.paymentStatus as PaymentStatusValue,
      fulfillmentStatus: locked.fulfillmentStatus as FulfillmentStatusValue,
      note: `Cập nhật đơn hàng: ${Object.keys(updates).join(", ")}`,
      createdBy: userId,
    });

    return updatedOrder;
  });
}

/**
 * Replace all items on a PENDING order.
 * - Restores stock for old items, deducts for new items.
 * - Cancels supplier orders linked to the old order number, creates new ones as needed.
 * - Blocked if the order has sub-orders or is a child of another order.
 */
export async function updateOrderItems(
  orderId: string,
  newItems: Array<{ variantId: string; quantity: number; customPrice?: number }>,
  userId: string,
) {
  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Lock and validate order (fetch full fields needed)
    const [lockedOrder] = await tx
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        paymentStatus: orders.paymentStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        subtotal: orders.subtotal,
        discount: orders.discount,
        parentOrderId: orders.parentOrderId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!lockedOrder) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);
    if (lockedOrder.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) {
      throw new Error("Chỉ có thể sửa sản phẩm khi đơn hàng ở trạng thái chờ xử lý.");
    }
    if (lockedOrder.parentOrderId) {
      throw new Error("Không thể sửa đơn hàng con.");
    }

    // Check for sub-orders
    const subOrderRows = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.parentOrderId, orderId));
    if (subOrderRows.length > 0) {
      throw new Error("Không thể sửa đơn hàng đã được tách.");
    }

    // 2. Restore stock for existing items
    const existingItems = await tx
      .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const allVariantIds = [
      ...new Set([...existingItems.map((i) => i.variantId), ...newItems.map((i) => i.variantId)]),
    ];
    await lockVariantsForUpdate(tx, allVariantIds);

    for (const row of existingItems) {
      await tx
        .update(productVariants)
        .set({ reserved: sql`${productVariants.reserved} - ${row.quantity}` })
        .where(eq(productVariants.id, row.variantId));
    }

    // 3. Cancel supplier orders linked to this order
    await tx
      .update(supplierOrders)
      .set({ status: SUPPLIER_ORDER_STATUS.CANCELLED, updatedAt: new Date() })
      .where(ilike(supplierOrders.note, `%[Order: ${lockedOrder.orderNumber}]%`));

    // 4. Delete existing order items
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

    // 5. Fetch new variant data and deduct stock
    const newVariantRows = await tx
      .select()
      .from(productVariants)
      .where(
        sql`${productVariants.id} = ANY(ARRAY[${sql.join(
          newItems.map((i) => sql`${i.variantId}`),
          sql`, `,
        )}]::uuid[])`,
      );
    const newVariantMap = new Map(newVariantRows.map((v) => [v.id, v]));

    let subtotal = 0;
    let totalCost = 0;
    const itemsNeedingStock: Array<{ variantId: string; quantity: number; sku: string }> = [];

    for (const item of newItems) {
      const variant = newVariantMap.get(item.variantId);
      if (!variant) throw new Error(`Không tìm thấy biến thể: ${item.variantId}`);

      const unitPrice = item.customPrice ?? Number(variant.price);
      const costPrice = Number(variant.costPrice || 0);
      subtotal += unitPrice * item.quantity;
      totalCost += costPrice * item.quantity;

      // Re-reserve stock (order still pending, so reserve rather than deduct on_hand).
      await tx
        .update(productVariants)
        .set({ reserved: sql`${productVariants.reserved} + ${item.quantity}` })
        .where(eq(productVariants.id, variant.id));

      // Shortfall = qty - available; available = on_hand - reserved at read time
      // (reads pre-date this loop's reserve increments, which is the correct baseline).
      const available = (variant.onHand ?? 0) - (variant.reserved ?? 0);
      const shortfall = Math.max(0, item.quantity - available);
      if (shortfall > 0) {
        itemsNeedingStock.push({ variantId: variant.id, quantity: shortfall, sku: variant.sku });
      }

      await tx.insert(orderItems).values({
        orderId,
        variantId: variant.id,
        productName: variant.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        costPriceAtOrderTime: variant.costPrice,
        lineTotal: (unitPrice * item.quantity).toString(),
        lineCost: (costPrice * item.quantity).toString(),
        lineProfit: ((unitPrice - costPrice) * item.quantity).toString(),
      });
    }

    // 6. Update order totals
    const discount = Number(lockedOrder.discount || 0);
    const total = subtotal - discount;
    const profit = total - totalCost;

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        subtotal: subtotal.toString(),
        total: total.toString(),
        totalCost: totalCost.toString(),
        profit: profit.toString(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId,
      paymentStatus: lockedOrder.paymentStatus,
      fulfillmentStatus: FULFILLMENT_STATUS.PENDING,
      note: "Cập nhật sản phẩm đơn hàng",
      createdBy: userId,
    });

    // 7. Auto-create supplier orders for new shortfalls
    if (itemsNeedingStock.length > 0) {
      await createSupplierOrdersForItems(
        tx,
        itemsNeedingStock,
        userId,
        lockedOrder.orderNumber ?? undefined,
      );
    }

    return updatedOrder;
  });
}

/**
 * Delete an order (only pending or cancelled orders)
 * Restores stock for in_stock items if order was pending
 */
export async function deleteOrder(orderId: string, userId: string) {
  return await db.transaction(async (tx: DbTransaction) => {
    // 1. Lock order to prevent concurrent modifications
    const orderToDelete = await lockOrderForUpdate(tx, orderId);

    if (!orderToDelete) {
      throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);
    }

    // 2. Only allow deleting CANCELLED orders
    if (orderToDelete.fulfillmentStatus !== FULFILLMENT_STATUS.CANCELLED) {
      throw new Error(
        `${ERROR_MESSAGE.ORDER.CANNOT_DELETE_WITH_STATUS} "${orderToDelete.fulfillmentStatus}". Only cancelled orders can be deleted.`,
      );
    }

    // 3. Delete the order (cascade will delete order_items and status_history)
    await tx.delete(orders).where(eq(orders.id, orderId));

    return { success: true, deletedOrderId: orderId };
  });
}

export async function recordPayment(data: {
  orderId: string;
  amount: number;
  method: (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
  referenceCode?: string;
  note?: string;
  userId: string;
}) {
  // Validate amount first
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error("INVALID_PAYMENT_AMOUNT");
  }

  return await db.transaction(async (tx: DbTransaction) => {
    const locked = await lockOrderForUpdate(tx, data.orderId);
    if (!locked) throw new Error(ERROR_MESSAGE.ORDER.NOT_FOUND);

    if (locked.fulfillmentStatus === FULFILLMENT_STATUS.CANCELLED) {
      throw new Error("Cannot record payment on cancelled order");
    }
    if (locked.fulfillmentStatus === FULFILLMENT_STATUS.COMPLETED) {
      throw new Error("Order already completed; no further payment");
    }

    const total = Number(locked.total ?? 0);
    const newPaid = Number(locked.paidAmount ?? 0) + data.amount;
    if (newPaid > total) throw new Error("OVERPAYMENT_NOT_ALLOWED");

    const nextPaymentStatus =
      newPaid === 0
        ? PAYMENT_STATUS.UNPAID
        : newPaid < total
          ? PAYMENT_STATUS.PARTIAL
          : PAYMENT_STATUS.PAID;

    await tx.insert(payments).values({
      orderId: data.orderId,
      amount: data.amount.toString(),
      method: data.method,
      referenceCode: data.referenceCode,
      note: data.note,
      createdBy: data.userId,
    });

    const now = new Date();
    const [updated] = await tx
      .update(orders)
      .set({
        paidAmount: newPaid.toString(),
        paymentStatus: nextPaymentStatus,
        paidAt: nextPaymentStatus === PAYMENT_STATUS.PAID ? now : locked.paidAt,
        updatedAt: now,
      })
      .where(eq(orders.id, data.orderId))
      .returning();

    await tx.insert(orderStatusHistory).values({
      orderId: data.orderId,
      paymentStatus: nextPaymentStatus,
      fulfillmentStatus:
        locked.fulfillmentStatus as (typeof FULFILLMENT_STATUS)[keyof typeof FULFILLMENT_STATUS],
      note: data.note ?? `Payment recorded: ${data.amount} (${data.method})`,
      createdBy: data.userId,
    });

    return updated;
  });
}

export async function getOrderHistory(orderId: string) {
  const history = await db.query.orderStatusHistory.findMany({
    where: eq(orderStatusHistory.orderId, orderId),
    orderBy: [desc(orderStatusHistory.createdAt)],
    with: {
      creator: {
        columns: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return history;
}

export async function getOrderStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      pending:
        sql<number>`count(*) filter (where ${orders.fulfillmentStatus} = ${FULFILLMENT_STATUS.PENDING})`.mapWith(
          Number,
        ),
      completed:
        sql<number>`count(*) filter (where ${orders.fulfillmentStatus} = ${FULFILLMENT_STATUS.COMPLETED})`.mapWith(
          Number,
        ),
      totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`.mapWith(Number),
    })
    .from(orders);

  return stats;
}
