import {
  type DELIVERY_PREFERENCE,
  ORDER_CODE_PREFIX,
  ORDER_SPLIT_SUFFIX,
  ORDER_STATUS,
  STOCK_TYPE,
  SUPPLIER_ORDER_STATUS,
} from "@repo/shared/constants";
import { eq, sql } from "drizzle-orm";
import { generateOrderNumber } from "../lib/db-locking";
import { orderItems, orderStatusHistory, orders, supplierOrders } from "../schema/orders";
import { productVariants } from "../schema/products";
import type { DbTransaction, VariantWithProduct } from "../types/database";

export async function createSplitOrders(
  tx: DbTransaction,
  data: {
    customerId: string;
    items: Array<{
      variantId: string;
      quantity: number;
    }>;
    note?: string;
    userId: string;
    deliveryPreference: (typeof DELIVERY_PREFERENCE)[keyof typeof DELIVERY_PREFERENCE];
    orderNumber?: string; // Pre-generated order number
  },
  inStockItems: Array<{ variantId: string; quantity: number }>,
  preOrderItems: Array<{ variantId: string; quantity: number }>,
  variantMap: Map<string, VariantWithProduct>,
) {
  // 1. Use provided order number or generate within transaction (fallback for backward compatibility)
  const parentOrderNumber = data.orderNumber || (await generateOrderNumber(tx, ORDER_CODE_PREFIX));

  // 2. Calculate Parent Totals
  let parentSubtotal = 0;
  let parentTotalCost = 0;

  // Calculate totals for all items regardless of split
  data.items.forEach((item) => {
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);
    parentSubtotal += Number(variant.price) * item.quantity;
    parentTotalCost += Number(variant.costPrice || 0) * item.quantity;
  });

  const parentTotal = parentSubtotal;
  const parentProfit = parentTotal - parentTotalCost;

  // 3. Create Parent Order
  const [parentOrder] = await tx
    .insert(orders)
    .values({
      orderNumber: parentOrderNumber,
      customerId: data.customerId,
      status: ORDER_STATUS.PREPARING, // Parent stays "preparing" while subs are active
      subtotal: parentSubtotal.toString(),
      total: parentTotal.toString(),
      totalCost: parentTotalCost.toString(),
      profit: parentProfit.toString(),
      adminNote: data.note,
      createdBy: data.userId,
      deliveryPreference: data.deliveryPreference,
    })
    .returning();

  // 4. Create Sub-Orders
  const subOrders: (typeof orders.$inferSelect)[] = [];

  // 4a. Create In-Stock Sub-Order
  if (inStockItems.length > 0) {
    const inStockOrder = await createSubOrder(
      tx,
      parentOrder,
      inStockItems,
      variantMap,
      STOCK_TYPE.IN_STOCK,
      data.userId,
    );
    subOrders.push(inStockOrder);
  }

  // 4b. Create Pre-Order Sub-Order
  if (preOrderItems.length > 0) {
    const preOrderOrder = await createSubOrder(
      tx,
      parentOrder,
      preOrderItems,
      variantMap,
      STOCK_TYPE.PRE_ORDER,
      data.userId,
    );
    subOrders.push(preOrderOrder);
  }

  const itemsNeedingStock = preOrderItems.map((item) => {
    const v = variantMap.get(item.variantId)!;
    return { sku: v.sku, name: v.name, quantityToOrder: item.quantity };
  });

  // Auto-create supplier orders for pre-order items
  if (preOrderItems.length > 0) {
    for (const item of preOrderItems) {
      await tx.insert(supplierOrders).values({
        variantId: item.variantId,
        quantity: item.quantity,
        status: SUPPLIER_ORDER_STATUS.PENDING,
        note: `Auto-created for pre-order item from split order ${parentOrderNumber}`,
        createdBy: data.userId,
      });
    }
  }

  return { order: parentOrder, itemsNeedingStock };
}

async function createSubOrder(
  tx: DbTransaction,
  parentOrder: typeof orders.$inferSelect,
  items: Array<{ variantId: string; quantity: number }>,
  variantMap: Map<string, VariantWithProduct>,
  type: (typeof STOCK_TYPE)[keyof typeof STOCK_TYPE],
  userId: string,
) {
  const suffix =
    type === STOCK_TYPE.IN_STOCK ? ORDER_SPLIT_SUFFIX.IN_STOCK : ORDER_SPLIT_SUFFIX.PRE_ORDER; // A for Available, B for Backorder/Preorder? Or just -1, -2
  const subOrderNumber = `${parentOrder.orderNumber}-${suffix}`;

  let subtotal = 0;
  let totalCost = 0;

  items.forEach((item) => {
    const variant = variantMap.get(item.variantId)!;
    subtotal += Number(variant.price) * item.quantity;
    totalCost += Number(variant.costPrice || 0) * item.quantity;
  });

  const total = subtotal;
  const profit = total - totalCost;

  // Create Sub-Order
  const [subOrder] = await tx
    .insert(orders)
    .values({
      parentOrderId: parentOrder.id,
      splitType: type,
      orderNumber: subOrderNumber,
      customerId: parentOrder.customerId,
      status: ORDER_STATUS.PENDING, // Initial status for sub-order
      subtotal: subtotal.toString(),
      total: total.toString(),
      totalCost: totalCost.toString(),
      profit: profit.toString(),
      adminNote: `Sub-order for ${type} items`,
      createdBy: userId,
      deliveryPreference: parentOrder.deliveryPreference,
    })
    .returning();

  // Create Items for Sub-Order
  // Thiếu hàng: số lượng cần đặt tính toán khi hiển thị (variant stock vs quantity).
  for (const item of items) {
    const variant = variantMap.get(item.variantId)!;

    if (type === STOCK_TYPE.IN_STOCK) {
      const availableStock = variant.stockQuantity || 0;
      const deductQty = item.quantity; // Allow negative stock
      await tx
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${deductQty}`,
        })
        .where(eq(productVariants.id, variant.id));
      variant.stockQuantity = availableStock - deductQty;
    }

    await tx.insert(orderItems).values({
      orderId: subOrder.id,
      variantId: variant.id,
      productName: variant.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
      costPriceAtOrderTime: variant.costPrice,
      lineTotal: (Number(variant.price) * item.quantity).toString(),
      lineCost: (Number(variant.costPrice || 0) * item.quantity).toString(),
      lineProfit: (
        (Number(variant.price) - Number(variant.costPrice || 0)) *
        item.quantity
      ).toString(),
    });
  }

  // Create Status History
  await tx.insert(orderStatusHistory).values({
    orderId: subOrder.id,
    status: ORDER_STATUS.PENDING,
    note: `Sub-order created (${type})`,
    createdBy: userId,
  });

  return subOrder;
}
